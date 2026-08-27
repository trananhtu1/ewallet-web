import { createContext } from 'react'

// Nam rieng mot file, khong o chung voi AuthProvider: Vite fast-refresh chi
// hoat dong khi mot file CHI export component. De chung thi moi lan sua
// provider la ca cay component mat state - go dang do trong form la bay sach.
export const AuthContext = createContext(null)
