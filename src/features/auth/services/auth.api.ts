import { api } from '@/lib/api'
import type { ApiResponse, AuthUser, LoginResponse } from '@/types/api'

export async function login(payload: { username: string; password: string }) {
  const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload)
  return response.data.data
}

export async function getCurrentUser() {
  const response = await api.get<ApiResponse<AuthUser>>('/auth/me')
  return response.data.data
}
