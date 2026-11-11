// ============================================================================
// Perokio Auth Store — manages JWT session + role-based routing
// ============================================================================
// Replaces the hardcoded `role: 'brand'` in the main store with a real
// auth-backed session. On login, the backend returns the user's role,
// which determines which app shell to show.
// ============================================================================

import { create } from 'zustand'
import { authApi, tryRestoreSession, getCurrentUser, getAccessToken } from './api-client'
import type { Role } from './types'

type BackendRole = 'brand_owner' | 'brand_member' | 'creator' | 'studio_editor' | 'qa_reviewer' | 'ops' | 'finance' | 'super_admin'

interface AuthState {
  // Session
  isAuthenticated: boolean
  userId: string | null
  email: string | null
  backendRole: BackendRole | null
  frontendRole: Role  // 'brand' | 'creator' | 'admin' — derived from backendRole

  // UI state
  loading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, role?: string) => Promise<boolean>
  logout: () => void
  restoreSession: () => boolean
  clearError: () => void
}

/** Map backend 8-role to frontend 3-role */
function toFrontendRole(backendRole: BackendRole): Role {
  if (backendRole === 'creator') return 'creator'
  if (backendRole === 'studio_editor' || backendRole === 'qa_reviewer' || backendRole === 'ops' || backendRole === 'finance' || backendRole === 'super_admin') return 'admin'
  return 'brand' // brand_owner, brand_member
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  userId: null,
  email: null,
  backendRole: null,
  frontendRole: 'brand', // default — will be overridden on login

  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const data = await authApi.login(email, password)
      const backendRole = data.user.role as BackendRole
      set({
        isAuthenticated: true,
        userId: data.user.id,
        email: data.user.email,
        backendRole,
        frontendRole: toFrontendRole(backendRole),
        loading: false,
      })
      return true
    } catch (e: any) {
      set({ loading: false, error: e.message || 'Login failed' })
      return false
    }
  },

  signup: async (email, password, role = 'brand_owner') => {
    set({ loading: true, error: null })
    try {
      const data = await authApi.signup(email, password, role)
      const backendRole = data.user.role as BackendRole
      set({
        isAuthenticated: true,
        userId: data.user.id,
        email: data.user.email,
        backendRole,
        frontendRole: toFrontendRole(backendRole),
        loading: false,
      })
      return true
    } catch (e: any) {
      set({ loading: false, error: e.message || 'Signup failed' })
      return false
    }
  },

  logout: () => {
    authApi.logout()
    set({
      isAuthenticated: false,
      userId: null,
      email: null,
      backendRole: null,
      frontendRole: 'brand',
    })
  },

  restoreSession: () => {
    const restored = tryRestoreSession()
    const user = getCurrentUser()
    if (restored && user) {
      const backendRole = user.role as BackendRole
      set({
        isAuthenticated: true,
        userId: user.id,
        email: user.email,
        backendRole,
        frontendRole: toFrontendRole(backendRole),
      })
      return true
    }
    return false
  },

  clearError: () => set({ error: null }),
}))
