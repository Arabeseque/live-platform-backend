/**
 * 自定义错误基类
 */
export class AppError extends Error {
  code: number;
  status: number;

  constructor(message: string, code: number = 1, status: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 400);
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '未登录或登录已过期') {
    super(message, 401, 401);
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '没有操作权限') {
    super(message, 403, 403);
  }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 404, 404);
  }
}

/**
 * 业务逻辑错误
 */
export class BusinessError extends AppError {
  constructor(message: string) {
    super(message, 1, 400);
  }
}

/**
 * 并发冲突错误
 */
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409, 409);
  }
}

/**
 * 服务器错误
 */
export class ServerError extends AppError {
  constructor(message: string = '服务器内部错误') {
    super(message, 500, 500);
  }
}
