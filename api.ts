export type SessionUser = { id: number; name: string; email: string; role: string; city: string }
export type PrescriptionRecord = { id: number; patient_id: number; medication: string; dosage: string; status: string; notes: string; patient_name: string; pharmacy_name: string }
export type DeliveryRecord = { id: number; order_id: number; agent_id: number | null; medication: string; status: string; order_status: string; tracking_code: string; patient_name: string; city: string }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('mediri-token')
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(path, { ...options, headers })
  const payload = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`)
  return payload
}

export async function signIn(email: string, password: string) {
  const result = await request<{ token: string; user: SessionUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('mediri-token', result.token)
  localStorage.setItem('mediri-user', JSON.stringify(result.user))
  localStorage.setItem('mediri-role', result.user.role)
  return result.user
}

export function uploadPrescription(file: File, pharmacyId: number, medication: string, address: string, notes: string) {
  const form = new FormData()
  form.set('prescription', file)
  form.set('pharmacyId', String(pharmacyId))
  form.set('medication', medication)
  form.set('address', address)
  form.set('notes', notes)
  return request<{ id: number; status: string; message: string }>('/api/prescriptions', { method: 'POST', body: form })
}

export function listPrescriptions() {
  return request<PrescriptionRecord[]>('/api/prescriptions')
}

export function updatePrescriptionStatus(id: number, status: string, notes?: string) {
  return request<{ id: number; status: string }>(`/api/prescriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  })
}

export function updatePrescriptionNotes(id: number, notes: string) {
  return request<{ id: number }>(`/api/prescriptions/${id}/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  })
}

export function listDeliveries() {
  return request<DeliveryRecord[]>('/api/deliveries')
}

export function updateDeliveryStatus(id: number, status: string) {
  return request<{ id: number; status: string }>(`/api/deliveries/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function listDeliveryAgents() {
  return request<{ user_id: number; name: string; availability: string }[]>('/api/delivery-agents')
}

export function assignDelivery(id: number, agentId: number) {
  return request<{ id: number; agentId: number }>(`/api/deliveries/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ agentId }),
  })
}
