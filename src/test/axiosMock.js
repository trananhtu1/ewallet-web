import { AxiosError, CanceledError } from 'axios'
import { vi } from 'vitest'
import { http } from '../lib/http'

/**
 * Cat ngang axios o tang ADAPTER - cho thap nhat, ngay truoc khi request roi may.
 *
 * <p>Truoc day cac test nay stub global `fetch`. Doi sang axios thi cho do
 * khong con la duong di nua, nhung y nghia cua tung test khong doi mot chu:
 * van la "FE thuc su gui gi len day" va "no doc loi tra ve nhu the nao".
 *
 * <p>Vi sao chon adapter chu khong phai axios-mock-adapter: adapter nam SAU
 * toan bo interceptor, nen moi thu dang duoc kiem tra - gan token, doi token,
 * doi loi sang ApiError - deu thuc su chay. Mock o tang cao hon la mock mat
 * chinh phan code can canh giu.
 */
const realAdapter = http.defaults.adapter

export function mockAdapter(handler) {
  const adapter = vi.fn(handler)
  http.defaults.adapter = adapter
  return adapter
}

export function restoreAdapter() {
  http.defaults.adapter = realAdapter
}

/** Server tra ve 2xx. */
export function ok(data, status = 200) {
  return (config) => Promise.resolve({ data, status, statusText: 'OK', headers: {}, config })
}

/**
 * Server TRA VE loi. Khac han mang chet: co response, chi la response do mang
 * ma loi. Day la ly do api() khong the dua vao try/catch de biet that bai.
 */
export function fail(status, data) {
  return (config) =>
    Promise.reject(
      new AxiosError('Request failed', null, config, {}, {
        data,
        status,
        statusText: 'Error',
        headers: {},
        config,
      }),
    )
}

/** Mang chet: khong bao gio co response. */
export function networkDown() {
  return (config) =>
    Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {}))
}

/** Request bi huy - KHONG phai that bai. */
export function canceled() {
  return (config) => Promise.reject(new CanceledError(null, config))
}

/**
 * Dinh tuyen theo URL - giong backend that hon la mot response duy nhat cho
 * moi thu. Duong dan KHONG khop voi handler nao thi coi nhu mang chet, dung
 * nhu khi goi mot endpoint chua ton tai.
 *
 * ⚠️ Thu tu key CO Y NGHIA: '/api/wallets/4' khop ca
 * '/api/wallets/4/transactions', nen key dai phai dat TRUOC key ngan.
 */
export function routeAdapter(handlers) {
  return mockAdapter((config) => {
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`
    const match = Object.keys(handlers).find((key) => url.includes(key))

    return match ? handlers[match](config) : networkDown()(config)
  })
}

/** Mot response theo status, dung lam handler cho routeAdapter. */
export function reply(status, body) {
  return status < 400 ? ok(body, status) : fail(status, body)
}

/**
 * Than request lan thu `index`, da parse san.
 *
 * <p>transformRequest cua axios chay TRUOC adapter, nen den day `data` da la
 * chuoi JSON - dung cai chuoi that su di ra day. Kiem ca hai dang cho chac.
 */
export function sentBody(adapter, index = 0) {
  const { data } = adapter.mock.calls[index][0]
  return typeof data === 'string' ? JSON.parse(data) : data
}

/** Mot header cua request lan thu `index`. */
export function sentHeader(adapter, index, name) {
  const { headers } = adapter.mock.calls[index][0]
  return typeof headers?.get === 'function' ? headers.get(name) : headers?.[name]
}
