/**
 * Axios/backend xato javobidan foydalanuvchiga ko'rsatiladigan xabarni xavfsiz ajratadi.
 * Backend ApiResponse strukturasida xato `response.data.message` da keladi
 * (GlobalExceptionHandler). Topilmasa null qaytaradi — chaqiruvchi umumiy
 * fallback xabarini ishlatadi.
 */
export function getApiErrorMessage(error: unknown): string | null {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return null;
}
