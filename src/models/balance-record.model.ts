import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// 余额变动类型枚举
export enum BalanceRecordType {
  RECHARGE = 'recharge',
  GIFT_SEND = 'gift_send',
  GIFT_RECEIVE = 'gift_receive'
}

// 余额变动来源类型枚举
export enum BalanceSourceType {
  RECHARGE_ORDER = 'recharge_order',
  GIFT_RECORD = 'gift_record'
}

// 余额变动记录文档接口
// NOTE: IBalanceRecord 接口专注于定义数据结构
export interface IBalanceRecord extends Document {
  user_id: Types.ObjectId;
  type: BalanceRecordType;
  amount: number;
  description: string;
  source_id: Types.ObjectId;
  source_type: BalanceSourceType;
  created_at: Date;
}

// 静态方法接口 
// NOTE: IBalanceRecordModel 接口专注于定义 Model 的行为，描述了 Model 应该提供哪些方法来操作 IBalanceRecord 类型的数据。它关心的是如何与数据库交互，例如创建、查询、更新和删除数据。
interface IBalanceRecordModel extends Model<IBalanceRecord> {
  createRechargeRecord(
    userId: Types.ObjectId,
    amount: number,
    orderId: Types.ObjectId,
    description: string
  ): Promise<IBalanceRecord>;
  
  createGiftRecord(
    userId: Types.ObjectId,
    amount: number,
    giftRecordId: Types.ObjectId,
    isSender: boolean,
    description: string
  ): Promise<IBalanceRecord>;
}

// 余额变动记录Schema定义
const BalanceRecordSchema = new Schema<IBalanceRecord>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(BalanceRecordType),
    required: true
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: function(v: number) {
        return v !== 0;
      },
      message: '金额不能为0'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  source_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  source_type: {
    type: String,
    enum: Object.values(BalanceSourceType),
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  }
});

// 索引
BalanceRecordSchema.index({ user_id: 1, created_at: -1 });
BalanceRecordSchema.index({ source_id: 1, source_type: 1 });

// 静态方法：创建充值记录
BalanceRecordSchema.statics.createRechargeRecord = async function(
  userId: Types.ObjectId,
  amount: number,
  orderId: Types.ObjectId,
  description: string
): Promise<IBalanceRecord> {
  return await this.create({
    user_id: userId,
    type: BalanceRecordType.RECHARGE,
    amount: Math.abs(amount), // 充值金额始终为正数
    description,
    source_id: orderId,
    source_type: BalanceSourceType.RECHARGE_ORDER
  });
};

// 静态方法：创建礼物相关记录
BalanceRecordSchema.statics.createGiftRecord = async function(
  userId: Types.ObjectId,
  amount: number,
  giftRecordId: Types.ObjectId,
  isSender: boolean,
  description: string
): Promise<IBalanceRecord> {
  return await this.create({
    user_id: userId,
    type: isSender ? BalanceRecordType.GIFT_SEND : BalanceRecordType.GIFT_RECEIVE,
    amount: isSender ? -Math.abs(amount) : Math.abs(amount), // 送礼为负，收礼为正
    description,
    source_id: giftRecordId,
    source_type: BalanceSourceType.GIFT_RECORD
  });
};

// 创建模型
const BalanceRecord = mongoose.model<IBalanceRecord, IBalanceRecordModel>('BalanceRecord', BalanceRecordSchema);

export default BalanceRecord;
