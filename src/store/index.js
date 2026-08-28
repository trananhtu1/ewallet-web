import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import authReducer, { initialAuthState } from './authSlice'
import rootSaga from './authSaga'
import { walletApi } from './walletApi'

/**
 * Dung MOT store moi.
 *
 * <p>La ham chu khong phai mot store toan cuc san: moi lan render trong test
 * can mot store SACH. Dung chung mot singleton thi phien dang nhap cua test
 * truoc con nam lai trong store cua test sau, va loi hien ra o mot cho chang
 * lien quan gi toi nguyen nhan.
 *
 * <p>App that goi ham nay dung mot lan, trong AuthProvider.
 */
export function makeStore() {
  const sagaMiddleware = createSagaMiddleware()

  const store = configureStore({
    reducer: {
      auth: authReducer,
      [walletApi.reducerPath]: walletApi.reducer,
    },

    // Doc lai localStorage o DUNG luc store nay duoc dung, khong dung lai anh
    // chup tu luc module authSlice duoc import - xem initialAuthState().
    preloadedState: { auth: initialAuthState() },

    middleware: (getDefault) =>
      getDefault()
        // RTK Query tu lo cache, dedupe va huy request cho toan bo server state.
        .concat(walletApi.middleware)
        // Saga chi lo cac hanh dong NGUOI DUNG BAM: dang nhap, dang ky, dang xuat.
        .concat(sagaMiddleware),
  })

  // Phai chay SAU configureStore - sagaMiddleware chua co store de dispatch vao
  // truoc thoi diem do.
  sagaMiddleware.run(rootSaga)

  return store
}
