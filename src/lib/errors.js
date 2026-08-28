// Hai kieu loi cua ca app. Tach rieng khoi api.js vi http.js can dung chung
// ma api.js lai import http.js - de chung mot file thi thanh vong tron import.

/**
 * Loi tu backend, giu nguyen hop dong loi cua API.
 *
 * Backend tra ve DUNG MOT hinh dang cho moi loi:
 *   { timestamp, status, code, message, path, fieldErrors? }
 *
 * Component re nhanh theo `code`, KHONG BAO GIO theo `message`:
 * message la chu tieng Viet cho nguoi dung doc va co the doi bat cu luc nao,
 * code la hop dong.
 */
export class ApiError extends Error {
  constructor(body, httpStatus) {
    super(body?.message ?? 'Có lỗi xảy ra, thử lại sau')
    this.name = 'ApiError'
    this.code = body?.code ?? 'UNKNOWN'
    this.status = httpStatus
    // LUON la mang - mot field co the truot NHIEU luat cung luc.
    // Vi du that: amount = 0.001 truot ca DecimalMin lan Digits.
    this.fieldErrors = body?.fieldErrors ?? []
  }
}

/** Loi mang: khong noi toi duoc server. Khac han loi do server TRA VE. */
export class NetworkError extends Error {
  constructor(cause) {
    super('Không kết nối được tới máy chủ')
    this.name = 'NetworkError'
    this.code = 'NETWORK'
    this.cause = cause
  }
}
