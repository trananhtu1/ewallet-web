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
  tagTypes: ['Wallet', 'Transactions', 'Kyc', 'Reconciliation'],
  endpoints: (build) => ({
    getWallet: build.query({
      query: (walletId) => ({ url: `/api/wallets/${walletId}` }),
      providesTags: ['Wallet'],
    }),

    // Backend doi hop dong 29/08 (ewallet-api #14): truoc tra ve MOT MANG, gio
    // tra ve { items, nextCursor, hasMore }. Ly do khong phai toc do ma la DUNG
    // SAI: OFFSET dem theo VI TRI, ma vi tri xe dich khi co giao dich moi chen
    // vao dau. Do duoc o backend: doc trang 1 ra id 1..5, co 3 giao dich moi,
    // doc OFFSET 5 ra id 3,4,5,6,7 - ba dong vua xem hien lai lan hai. Tren mot
    // bang tien thi nguoi dung doc do la "toi bi tru tien hai lan".
    getTransactions: build.query({
      query: ({ walletId, limit = 20, cursor, type, direction, status, from, to }) => ({
        url: `/api/wallets/${walletId}/transactions`,
        // Khong gui cursor=undefined: axios se bien no thanh ?cursor= (chuoi
        // rong), va backend coi chuoi rong la "co cursor nhung doc khong ra"
        // -> 400 INVALID_CURSOR ngay o trang dau.
        //
        // Cung ly do do voi cac bo loc: loc bo moi khoa co gia tri rong TRUOC
        // khi gui, thay vi de axios sinh ra `?type=&status=`. Backend nhan
        // chuoi rong cho mot enum se nem 400 chu khong hieu la "khong loc".
        params: Object.fromEntries(
          Object.entries({ limit, cursor, type, direction, status, from, to })
            .filter(([, v]) => v !== undefined && v !== null && v !== ''),
        ),
      }),

      // ⭐ Ba tuy chon duoi day bien mot query "mot trang" thanh danh sach noi dai.
      //
      // serializeQueryArgs: bo `cursor` ra khoi khoa cache, chi giu walletId.
      // Khong co dong nay thi MOI trang la mot o cache rieng, va man hinh se
      // NHAY sang trang 2 thay vi noi them vao duoi.
      serializeQueryArgs: ({ queryArgs }) => queryArgs.walletId,

      // merge: noi trang moi vao duoi trang cu. Day la ham cua Immer nen sua
      // truc tiep `cache` duoc.
      merge: (cache, moi, { arg }) => {
        // Khong co cursor = trang DAU = lam moi that su (vd. sau khi chuyen
        // tien). Phai THAY HAN, khong duoc noi - noi thi 20 dong cu con nguyen
        // ben duoi va giao dich vua tao hien HAI lan.
        if (!arg.cursor) return moi

        cache.items.push(...moi.items)
        cache.nextCursor = moi.nextCursor
        cache.hasMore = moi.hasMore
      },

      // forceRefetch: vi cursor da bi loai khoi khoa cache o tren, RTK Query
      // nhin hai lan goi khac cursor thay y het nhau va se KHONG goi lan hai.
      // Dong nay noi cho no biet cursor doi thi van phai di lay.
      //
      // ⚠️ VA PHAI SO CA BO LOC, khong chi cursor. Day la cai bay di kem
      // `serializeQueryArgs` rut gon: doi bo loc thi khoa cache VAN LA walletId
      // nhu cu, nen neu chi so cursor thi RTK Query ket luan "khong co gi doi"
      // va KHONG goi lai - nguoi dung bam loc ma danh sach dung im.
      // Khong loi, khong log. Chi la khong phan hoi.
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor ||
        currentArg?.type !== previousArg?.type ||
        currentArg?.direction !== previousArg?.direction ||
        currentArg?.status !== previousArg?.status ||
        currentArg?.from !== previousArg?.from ||
        currentArg?.to !== previousArg?.to,

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

    // ===== KYC =====
    //
    // ⭐ Hai endpoint nay backend co tu 29/08 va chua he co giao dien nao goi.
    getKyc: build.query({
      query: () => ({ url: '/api/kyc/me' }),
      providesTags: ['Kyc'],
    }),

    submitKyc: build.mutation({
      query: (formData) => ({
        url: '/api/kyc',
        method: 'POST',
        data: formData,
        // ⚠️ KHONG dat Content-Type bang tay. Voi FormData, trinh duyet phai tu
        // sinh header kem `boundary=...` - go 'multipart/form-data' vao day la
        // gui mot header THIEU boundary, va Spring khong tach duoc cac phan,
        // tra ve 400 voi thong bao khong lien quan gi toi nguyen nhan.
      }),
      invalidatesTags: ['Kyc'],
    }),

    // ===== Doi soat cuoi ngay =====
    getReconciliation: build.query({
      query: (limit = 7) => ({ url: '/api/reconciliation', params: { limit } }),
      providesTags: ['Reconciliation'],
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
  useGetKycQuery,
  useSubmitKycMutation,
  useGetReconciliationQuery,
} = walletApi
