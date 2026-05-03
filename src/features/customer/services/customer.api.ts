import { api } from '@/lib/api'
import type { ApiResponse, CreateCustomerPayload, Customer, CustomerHistory, UpdateCustomerPayload } from '@/types/api'

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

export async function getCustomerHistory(customerId: string) {
  const response = await api.get<ApiResponse<CustomerHistory>>(`/customers/${customerId}/history`)
  return response.data.data
}

export async function createCustomer(payload: CreateCustomerPayload) {
  const response = await api.post<ApiResponse<Customer>>('/customers', payload)
  return response.data.data
}

export async function updateCustomer(customerId: string, payload: UpdateCustomerPayload) {
  const response = await api.put<ApiResponse<Customer>>(`/customers/${customerId}`, payload)
  return response.data.data
}
