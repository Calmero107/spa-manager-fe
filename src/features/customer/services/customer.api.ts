import { api } from '@/lib/api'
import type { ApiResponse, CreateCustomerPayload, Customer } from '@/types/api'

export async function getCustomers(branchId: string, q?: string) {
  const search = new URLSearchParams({ branchId })
  if (q?.trim()) {
    search.set('q', q.trim())
  }

  const response = await api.get<ApiResponse<Customer[]>>(`/customers?${search.toString()}`)
  return response.data.data
}

export async function getCustomer(customerId: string) {
  const response = await api.get<ApiResponse<Customer>>(`/customers/${customerId}`)
  return response.data.data
}

export async function createCustomer(payload: CreateCustomerPayload) {
  const response = await api.post<ApiResponse<Customer>>('/customers', payload)
  return response.data.data
}
