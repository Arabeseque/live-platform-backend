/**
 * 标准API响应格式
 */
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 分页数据格式
 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 创建成功响应
 * @param data 响应数据
 * @param message 成功信息
 */
export function success<T>(data?: T, message: string = '操作成功'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data
  };
}

/**
 * 创建分页响应
 * @param data 分页数据
 * @param message 成功信息
 */
export function successWithPagination<T>(data: PaginatedData<T>, message: string = '操作成功'): ApiResponse<PaginatedData<T>> {
  return success(data, message);
}

/**
 * 创建失败响应
 * @param message 错误信息
 * @param code 错误码
 */
export function error(message: string = '操作失败', code: number = 1): ApiResponse {
  return {
    code,
    message
  };
}

/**
 * 分页查询参数类型
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * 处理分页参数
 * @param query 查询参数
 * @returns 标准化的分页参数
 */
export function handlePagination(query: PaginationQuery) {
  return {
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.min(100, Math.max(1, Number(query.limit) || 10))
  };
}
