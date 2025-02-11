# 认证系统API文档

## 端点

### 1. 发送验证码
- 路径: `POST /auth/verification-code`
- 描述: 发送手机验证码
- 请求体:
```json
{
    "phone": "13800138000",
    "type": "register" | "login" | "reset_password"
}
```
- 响应:
```json
{
    "code": 0,
    "message": "验证码发送成功",
    "data": {
        "expires_in": 300
    }
}
```

### 2. 验证码登录
- 路径: `POST /auth/login/code`
- 描述: 使用手机号和验证码登录
- 请求体:
```json
{
    "phone": "13800138000",
    "code": "123456"
}
```
- 响应:
```json
{
    "code": 0,
    "message": "登录成功",
    "data": {
        "token": "jwt_token_string",
        "user": {
            "id": "user_id",
            "username": "username",
            "nickname": "nickname",
            "avatar_url": "avatar_url",
            "role": "user"
        }
    }
}
```

### 3. 验证码注册
- 路径: `POST /auth/register`
- 描述: 使用手机号和验证码注册新用户
- 请求体:
```json
{
    "phone": "13800138000",
    "code": "123456",
    "password": "Password123",
    "username": "username" // 可选
}
```
- 响应:
```json
{
    "code": 0,
    "message": "注册成功",
    "data": {
        "token": "jwt_token_string",
        "user": {
            "id": "user_id",
            "username": "username",
            "nickname": "nickname",
            "avatar_url": "avatar_url",
            "role": "user"
        }
    }
}
```

### 4. 密码登录（现有）
- 路径: `POST /auth/login`
- 描述: 使用用户名和密码登录
- 请求体:
```json
{
    "username": "username",
    "password": "Password123"
}
```
- 响应:
```json
{
    "code": 0,
    "message": "登录成功",
    "data": {
        "token": "jwt_token_string",
        "user": {
            "id": "user_id",
            "username": "username",
            "nickname": "nickname",
            "avatar_url": "avatar_url",
            "role": "user"
        }
    }
}
```

## 错误处理

所有接口的错误响应格式：
```json
{
    "code": number,
    "message": string,
    "error": {
        "type": string,
        "details": any
    }
}
```

### 常见错误码
- 400: 参数验证失败
- 401: 未授权
- 403: 禁止访问
- 404: 资源不存在
- 429: 请求过于频繁
- 500: 服务器内部错误

## 安全说明

1. 密码要求
   - 最小长度：8位
   - 必须包含：大写字母、小写字母、数字

2. 验证码
   - 长度：6位数字
   - 有效期：5分钟
   - 最大尝试次数：3次

3. Token
   - JWT格式
   - 有效期：24小时
