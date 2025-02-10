# API 接口设计文档

## 通用说明

### 响应格式
```typescript
interface ApiResponse<T> {
  code: number;       // 状态码: 0-成功,非0-失败
  message: string;    // 响应信息
  data?: T;          // 响应数据
}
```

### 分页参数
```typescript
interface PaginationQuery {
  page: number;      // 页码,从1开始
  limit: number;     // 每页条数
}

interface PaginatedResponse<T> {
  list: T[];         // 数据列表
  total: number;     // 总条数
  page: number;      // 当前页码
  limit: number;     // 每页条数
}
```

## 用户(User)接口

### 1. 创建用户
- 路由: POST /api/users
- 描述: 创建新用户
- 请求体:
```typescript
interface CreateUserDTO {
  username: string;
  nickname: string;
  password: string;
  phone: string;
  avatar_url?: string;
  role?: 'user' | 'streamer' | 'admin';
}
```

### 2. 获取用户详情
- 路由: GET /api/users/:id
- 描述: 获取指定用户的详细信息

### 3. 更新用户
- 路由: PATCH /api/users/:id
- 描述: 更新用户信息
- 请求体:
```typescript
interface UpdateUserDTO {
  nickname?: string;
  avatar_url?: string;
  password?: string;
  phone?: string;
  role?: 'user' | 'streamer' | 'admin';
  is_active?: boolean;
}
```

### 4. 获取用户列表
- 路由: GET /api/users
- 描述: 获取用户列表,支持分页和筛选
- 查询参数: PaginationQuery & {
  keyword?: string;  // 搜索关键词(用户名/昵称)
  role?: string;     // 用户角色
  is_active?: boolean; // 是否激活
}

## 直播间(LiveRoom)接口

### 1. 创建直播间
- 路由: POST /api/live-rooms
- 描述: 创建新直播间
- 请求体:
```typescript
interface CreateLiveRoomDTO {
  user_id: string;   // 主播ID
  title: string;     // 直播间标题
  stream_key?: string; // 推流密钥(可选,后端生成)
}
```

### 2. 获取直播间详情
- 路由: GET /api/live-rooms/:id
- 描述: 获取直播间详细信息

### 3. 更新直播间
- 路由: PATCH /api/live-rooms/:id
- 描述: 更新直播间信息
- 请求体:
```typescript
interface UpdateLiveRoomDTO {
  title?: string;
  status?: 'pending' | 'live' | 'finished';
  start_time?: Date;
  end_time?: Date;
}
```

### 4. 获取直播间列表
- 路由: GET /api/live-rooms
- 描述: 获取直播间列表,支持分页和筛选
- 查询参数: PaginationQuery & {
  status?: string;   // 直播状态
  user_id?: string;  // 主播ID
}

## 礼物(Gift)接口

### 1. 创建礼物
- 路由: POST /api/gifts
- 描述: 创建新礼物
- 请求体:
```typescript
interface CreateGiftDTO {
  name: string;
  icon_url: string;
  price: number;
  description?: string;
  is_available?: boolean;
}
```

### 2. 获取礼物详情
- 路由: GET /api/gifts/:id
- 描述: 获取礼物详细信息

### 3. 更新礼物
- 路由: PATCH /api/gifts/:id
- 描述: 更新礼物信息
- 请求体:
```typescript
interface UpdateGiftDTO {
  name?: string;
  icon_url?: string;
  price?: number;
  description?: string;
  is_available?: boolean;
}
```

### 4. 获取礼物列表
- 路由: GET /api/gifts
- 描述: 获取礼物列表,支持分页和筛选
- 查询参数: PaginationQuery & {
  is_available?: boolean;
}

## 礼物记录(GiftRecord)接口

### 1. 创建礼物记录
- 路由: POST /api/gift-records
- 描述: 创建礼物赠送记录
- 请求体:
```typescript
interface CreateGiftRecordDTO {
  user_id: string;
  room_id: string;
  gift_id: string;
  quantity: number;
}
```

### 2. 获取礼物记录详情
- 路由: GET /api/gift-records/:id
- 描述: 获取礼物记录详细信息

### 3. 获取礼物记录列表
- 路由: GET /api/gift-records
- 描述: 获取礼物记录列表,支持分页和筛选
- 查询参数: PaginationQuery & {
  user_id?: string;  // 赠送用户ID
  room_id?: string;  // 直播间ID
  gift_id?: string;  // 礼物ID
}

## 余额变动记录(BalanceRecord)接口

### 1. 创建余额记录
- 路由: POST /api/balance-records
- 描述: 创建余额变动记录
- 请求体:
```typescript
interface CreateBalanceRecordDTO {
  user_id: string;
  type: 'recharge' | 'gift_send' | 'gift_receive';
  amount: number;
  description: string;
  source_id?: string;
  source_type?: 'recharge_order' | 'gift_record';
}
```

### 2. 获取余额记录详情
- 路由: GET /api/balance-records/:id
- 描述: 获取余额记录详细信息

### 3. 获取余额记录列表
- 路由: GET /api/balance-records
- 描述: 获取余额记录列表,支持分页和筛选
- 查询参数: PaginationQuery & {
  user_id?: string;  // 用户ID
  type?: string;     // 变动类型
}

## 弹幕消息(DanmakuMessage)接口

### 1. 创建弹幕消息
- 路由: POST /api/danmaku-messages
- 描述: 发送弹幕消息
- 请求体:
```typescript
interface CreateDanmakuMessageDTO {
  user_id: string;
  room_id: string;
  content: string;
  color?: string;
  font_size?: number;
}
```

### 2. 获取弹幕消息列表
- 路由: GET /api/danmaku-messages
- 描述: 获取弹幕消息列表,支持分页和筛选
- 查询参数: PaginationQuery & {
  room_id?: string;  // 直播间ID
  user_id?: string;  // 发送用户ID
}

## 验证码(VerificationCode)接口

### 1. 创建验证码
- 路由: POST /api/verification-codes
- 描述: 生成新的验证码
- 请求体:
```typescript
interface CreateVerificationCodeDTO {
  phone: string;
  type: 'register' | 'login' | 'reset_password';
}
```

### 2. 验证验证码
- 路由: POST /api/verification-codes/verify
- 描述: 验证验证码是否有效
- 请求体:
```typescript
interface VerifyCodeDTO {
  phone: string;
  code: string;
  type: 'register' | 'login' | 'reset_password';
}
```

## 后续开发建议

1. 接口实现优先级
   - 用户相关接口: 高优先级
   - 直播间接口: 高优先级
   - 礼物相关接口: 中优先级
   - 弹幕接口: 中优先级
   - 验证码接口: 低优先级

2. 安全性考虑
   - 实现用户认证和权限控制中间件
   - 添加请求频率限制
   - 验证码接口需要防刷机制
   - 敏感操作需要二次验证

3. 性能优化
   - 合理使用索引
   - 添加缓存层
   - 实现数据库读写分离
   - 大量数据的分页优化

4. 可维护性
   - 统一错误处理
   - 规范的日志记录
   - 完善的接口文档
   - 充分的单元测试
