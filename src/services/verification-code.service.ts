import { injectable } from 'tsyringe';
import VerificationCode, { VerificationCodeType, IVerificationCode } from '../models/verification-code.model.js';
import { ValidationError } from '../utils/errors.js';

@injectable()
export class VerificationCodeService {
  // 验证码有效期（5分钟）
  private readonly CODE_EXPIRE_TIME = 5 * 60 * 1000;
  // 最大验证尝试次数
  private readonly MAX_VERIFY_ATTEMPTS = 3;

  /**
   * 生成6位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证码
   * @param phone 手机号
   * @param type 验证码类型
   */
  async sendCode(phone: string, type: VerificationCodeType): Promise<number> {
    // 验证手机号格式
    if (!this.isValidPhone(phone)) {
      throw new ValidationError('手机号格式不正确');
    }

    // 生成新验证码
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRE_TIME);

    // 保存验证码
    await VerificationCode.create({
      phone,
      code,
      type,
      expires_at: expiresAt,
      is_used: false,
      verify_attempts: 0
    });

    // 模拟发送短信
    console.log(`向 ${phone} 发送验证码：${code}`);

    // 返回过期时间（秒）
    return this.CODE_EXPIRE_TIME / 1000;
  }

  /**
   * 验证验证码
   * @param phone 手机号
   * @param code 验证码
   * @param type 验证码类型
   */
  async verifyCode(phone: string, code: string, type: VerificationCodeType): Promise<boolean> {
    // 验证手机号格式
    if (!this.isValidPhone(phone)) {
      throw new ValidationError('手机号格式不正确');
    }

    // 查找最近的未使用验证码
    const verificationCode = await VerificationCode.findOne({
      phone,
      type,
      is_used: false,
      expires_at: { $gt: new Date() }
    }).sort({ created_at: -1 });

    if (!verificationCode) {
      throw new ValidationError('验证码不存在或已过期');
    }

    // 验证尝试次数
    if (verificationCode.verify_attempts >= this.MAX_VERIFY_ATTEMPTS) {
      throw new ValidationError('验证码已失效，请重新发送');
    }

    // 验证码匹配检查
    if (verificationCode.code !== code) {
      // 增加验证尝试次数
      verificationCode.verify_attempts += 1;
      await verificationCode.save();
      throw new ValidationError('验证码错误');
    }

    // 标记验证码为已使用
    verificationCode.is_used = true;
    await verificationCode.save();

    return true;
  }

  /**
   * 验证手机号格式
   * @param phone 手机号
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
}
