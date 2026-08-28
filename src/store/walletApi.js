import { createApi } from '@reduxjs/toolkit/query/react'
import { http } from '../lib/http'

/**
 * baseQuery cua RTK Query, chay tren DUNG axios instance ma ca app dung.
 *
 * <p>Khong dung fetchBaseQuery co san: lam vay thi RTK Query di mot duong
 * rieng, khong qua interceptor - tuc la khong duoc gan token, khong duoc doi
 * token ngam, va khong doi loi sang ApiError. Ba thu do la toan bo phan kho
 * cua tang HTTP.
 *
 * <p>`api.signal` la AbortSignal cua RTK Query: no tu huy request khi component
 * unmount hoac khi query bi thay the. Day la thu thay cho AbortController viet
 * tay trong WalletPage truoc day.
 */
const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params }, api) => {
    try {
      const response = await http.request({ url, method, data, params, signal: api.signal })

      // 204 khong co than - axios dua ve chuoi rong. RTK Query doi `data` phai
      // ton tai, nen dua ve null cho ro rang.
      const body = response.status === 204 || response.data === '' ? null : response.data
      return { data: body }
    } catch (error) {
      // Giu NGUYEN `code` va `fieldErrors`: component re nhanh theo code, va
      // do la ca hop dong loi cua backend. Boc lai thanh mot chuoi la vut het.
      return {
        error: {
          status: error.status ?? 'FETCH_ERROR',
          code: error.code ?? 'UNKNOWN',
          message: error.message,
          fieldErrors: error.fieldErrors ?? [],
        },
      }
    }
  }

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Wallet', 'Transactions'],
  endpoints: (build) => ({
    getWallet: build.query({
      query: (walletId) => ({ url: `/api/wallets/${walletId}` }),
      providesTags: ['Wallet'],
    }),

    getTransactions: build.query({
      query: ({ walletId, limit = 20 }) => ({
        url: `/api/wallets/${walletId}/transactions`,
        params: { limit },
      }),
      providesTags: ['Transactions'],
    }),

    deposit: build.mutation({
      query: ({ walletId, amount }) => ({
        url: `/api/wallets/${walletId}/deposits`,
        method: 'POST',
        // ⚠️ Tien GUI LEN phai la CHUOI. Number('12345678901234567.89') ->
        // 12345678901234568: so tien hong ngay truoc khi roi trinh duyet, dung
        // cai loi ma ca money.js duoc viet ra de tranh.
        data: { amount: String(amount).trim() },
      }),
      // Chi invalidate Transactions. Vi thi khong can goi lai - xem onQueryStarted.
      invalidatesTags: ['Transactions'],
      onQueryStarted: writeWalletIntoCache,
    }),

    transfer: build.mutation({
      query: ({ fromWalletId, toWalletId, amount }) => ({
        url: '/api/transfers',
        method: 'POST',
        data: {
          // ID vi thi de Number: chung la `long` va la so nguyen nho, khong co
          // gi de mat. Chi so TIEN moi phai giu nguyen chuoi.
          fromWalletId: Number(fromWalletId),
          toWalletId: Number(toWalletId),
          amount: String(amount).trim(),
        },
      }),
      invalidatesTags: ['Transactions'],
      onQueryStarted: writeWalletIntoCache,
    }),
  }),
})

/**
 * Response cua /deposits va /transfers CHINH LA cai vi sau khi tien chay.
 *
 * <p>Nen thay vi invalidate 'Wallet' roi de RTK Query di goi lai
 * GET /api/wallets/{id}, ghi thang ket qua do vao cache. Bot mot vong mang, va
 * so du hien ra ngay lap tuc thay vi nhay qua mot nhip "dang tai".
 *
 * <p>Lich su giao dich thi VAN phai invalidate - no co dong moi ma response
 * nay khong he chua.
 */
async function writeWalletIntoCache({ walletId, fromWalletId }, { dispatch, queryFulfilled }) {
  // transfer tra ve vi NGUON, nen key cache la vi dang dung o ca hai truong hop.
  const id = walletId ?? fromWalletId

  try {
    const { data: wallet } = await queryFulfilled
    dispatch(walletApi.util.upsertQueryData('getWallet', id, wallet))
  } catch {
    // That bai thi khong dung toi cache. Cho goi da nhan duoc loi qua unwrap().
  }
}

export const {
  useGetWalletQuery,
  useGetTransactionsQuery,
  useDepositMutation,
  useTransferMutation,
} = walletApi
