import axios from 'axios'

// NEXT_PUBLIC_API_URL always wins when set (e.g. to point a build at a
// staging backend). When it's not set, fall back by build environment
// instead of always defaulting to localhost — otherwise a production build
// that forgot to set the Vercel env var silently calls localhost:5000 from
// every visitor's browser instead of the real VPS backend.
const BASE = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === 'production' ? 'https://data.distressdealsuae.com/api/v1' : 'http://localhost:5000/api/v1')

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('luxestate_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

// Response interceptor — handle auth errors
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('luxestate_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

// ── Auth ────────────────────────────────────────────
export const authAPI = {
  register:         (data: any) => api.post('/auth/register', data),
  login:            (data: any) => api.post('/auth/login', data),
  googleAuth:       (token: string, role?: string) => api.post('/auth/google', { token, role }),
  facebookAuth:     (accessToken: string, role?: string) => api.post('/auth/facebook', { accessToken, role }),
  appleAuth:        (data: any) => api.post('/auth/apple', data),
  sendOtp:          (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp:        (otp: string) => api.post('/auth/verify-otp', { otp }),
  forgotPassword:   (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword:    (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  verifyEmail:      (token: string) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
  changePassword:   (currentPassword: string, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword }),
  getMe:            () => api.get('/auth/me'),
  refreshToken:     () => api.post('/auth/refresh'),
}

// ── Properties ──────────────────────────────────────
export const propertyAPI = {
  getAll:       (params?: any) => api.get('/properties', { params }),
  getOne:       (slug: string) => api.get(`/properties/${slug}`),
  create:       (data: FormData) => api.post('/properties', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:       (id: string, data: any) => api.put(`/properties/${id}`, data),
  delete:       (id: string) => api.delete(`/properties/${id}`),
  requestDelete: (id: string, reason?: string) => api.post(`/properties/${id}/delete-request`, { reason }),
  approveDeleteRequest: (id: string) => api.patch(`/properties/${id}/delete-request/approve`),
  rejectDeleteRequest:  (id: string) => api.patch(`/properties/${id}/delete-request/reject`),
  approve:      (id: string) => api.patch(`/properties/${id}/approve`),
  reject:       (id: string, reason: string) => api.patch(`/properties/${id}/reject`, { reason }),
  closeDeal:    (id: string) => api.patch(`/properties/${id}/close-deal`),
  reopen:       (id: string) => api.patch(`/properties/${id}/reopen`),
  report:       (id: string, data: { reason: string; details?: string }) => api.post(`/properties/${id}/report`, data),
  assignAgent:  (id: string, agentId: string) => api.patch(`/properties/${id}/assign`, { agentId }),
  myListings:   (params?: any) => api.get('/properties/my-listings', { params }),
  manageAll:    (params?: any) => api.get('/properties/manage/all', { params }),
  getFeatured:  () => api.get('/properties?featured=true&limit=6'),
  getAreaStats: (limit?: number) => api.get('/properties/area-stats', { params: { limit } }),
  getTypeStats: (params?: any) => api.get('/properties/type-stats', { params }),
  getAllAreas:  () => api.get('/properties/areas'),
  getAreaBySlug: (slug: string) => api.get(`/properties/areas/${slug}`),
  suggest: (q: string) => api.get('/properties/suggest', { params: { q } }),
  getSimilar:   (id: string) => api.get(`/properties/${id}/similar`),
  trackView:    (id: string) => api.post(`/properties/${id}/view`),
  trackShare:   (id: string) => api.post(`/properties/${id}/share`),
  getAnalytics: (id: string) => api.get(`/properties/${id}/analytics`),
  uploadImages: (id: string, data: FormData) => api.post(`/properties/${id}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  aiDescription: (data: any) => api.post('/properties/ai-description', data),
  aiSearch: (query: string) => api.post('/properties/ai-search', { query }),
}

// ── Users / Profile ─────────────────────────────────
export const userAPI = {
  updateProfile: (data: any) => api.patch('/users/me', data),
  getOne:        (id: string) => api.get(`/users/${id}`),
}

// ── Favorites ───────────────────────────────────────
export const favAPI = {
  getAll:  () => api.get('/users/favorites'),
  toggle:  (propertyId: string) => api.post(`/users/favorites/${propertyId}`),
}

// ── Leads ───────────────────────────────────────────
export const leadAPI = {
  create:         (data: any) => api.post('/leads', data),
  createProjectLead: (data: { project: string; name: string; email: string; phone: string; message?: string }) => api.post('/leads/project-lead', data),
  getAll:         (params?: any) => api.get('/leads', { params }),
  getOne:         (id: string) => api.get(`/leads/${id}`),
  update:         (id: string, data: any) => api.patch(`/leads/${id}`, data),
  addNote:        (id: string, content: string) => api.post(`/leads/${id}/notes`, { content }),
  assign:         (id: string, agentId: string) => api.patch(`/leads/${id}/assign`, { agentId }),
  reassign:       (id: string, agentId: string) => api.patch(`/leads/${id}/reassign`, { agentId }),
  shuffle:        (ids: string[]) => api.post('/leads/shuffle', { ids }),
  myLeads:        (params?: any) => api.get('/leads/my-leads', { params }),
  pipeline:       () => api.get('/leads/pipeline'),
  sourceReport:   () => api.get('/leads/source-report'),
  aiSummary:      (id: string) => api.post(`/leads/${id}/ai-summary`),
  delete:         (id: string) => api.delete(`/leads/${id}`),
  requestDelete:  (id: string, reason?: string) => api.post(`/leads/${id}/delete-request`, { reason }),
  approveDeleteRequest: (id: string) => api.patch(`/leads/${id}/delete-request/approve`),
  rejectDeleteRequest:  (id: string) => api.patch(`/leads/${id}/delete-request/reject`),
}

// ── Meetings ────────────────────────────────────────
export const meetingAPI = {
  create:   (data: any) => api.post('/meetings', data),
  getAll:   (params?: any) => api.get('/meetings', { params }),
  getOne:   (id: string) => api.get(`/meetings/${id}`),
  update:   (id: string, data: any) => api.patch(`/meetings/${id}`, data),
  cancel:   (id: string, reason?: string) => api.patch(`/meetings/${id}/cancel`, { reason }),
  complete: (id: string, outcome?: string) => api.patch(`/meetings/${id}/complete`, { outcome }),
  calendar: (params?: any) => api.get('/meetings/calendar', { params }),
}

// ── Agents ──────────────────────────────────────────
export const agentAPI = {
  getAll:    (params?: any) => api.get('/agents', { params }),
  getOne:    (id: string) => api.get(`/agents/${id}`),
  create:    (data: any) => api.post('/agents', data),
  update:    (id: string, data: any) => api.patch(`/agents/${id}`, data),
  delete:    (id: string) => api.delete(`/agents/${id}`),
  updatePermissions: (id: string, permissions: string[]) => api.patch(`/agents/${id}/permissions`, { permissions }),
  getStats:  (id: string) => api.get(`/agents/${id}/stats`),
  getPerformance: () => api.get('/agents/performance'),
}

// ── Chat ────────────────────────────────────────────
export const chatAPI = {
  getRooms:    () => api.get('/chat/rooms'),
  getUnreadCount: () => api.get('/chat/unread-count'),
  getRoom:     (id: string) => api.get(`/chat/rooms/${id}`),
  createRoom:  (data: any) => api.post('/chat/rooms', data),
  getMessages: (roomId: string, params?: any) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  sendMessage: (roomId: string, content: string, type?: string) => api.post(`/chat/rooms/${roomId}/messages`, { content, type }),
  markRead:    (roomId: string) => api.patch(`/chat/rooms/${roomId}/read`),
}

// ── Notifications ───────────────────────────────────
export const notifAPI = {
  getAll:   (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getCount: () => api.get('/notifications/unread-count'),
}

// ── Blog ────────────────────────────────────────────
export const blogAPI = {
  getAll:      (params?: any) => api.get('/blog', { params }),
  getAllAdmin: (params?: any) => api.get('/blog/admin/all', { params }),
  getOne:      (slug: string) => api.get(`/blog/${slug}`),
  create:      (data: any) => api.post('/blog', data),
  update:      (id: string, data: any) => api.put(`/blog/${id}`, data),
  delete:      (id: string) => api.delete(`/blog/${id}`),
}

// ── News ────────────────────────────────────────────
export const newsAPI = {
  getAll:      (params?: any) => api.get('/news', { params }),
  getAllAdmin: (params?: any) => api.get('/news/admin/all', { params }),
  getOne:      (slug: string) => api.get(`/news/${slug}`),
  create:      (data: any) => api.post('/news', data),
  update:      (id: string, data: any) => api.put(`/news/${id}`, data),
  delete:      (id: string) => api.delete(`/news/${id}`),
}

// ── Admin ───────────────────────────────────────────
export const adminAPI = {
  getDashboard:    () => api.get('/admin/dashboard'),
  getUsers:        (params?: any) => api.get('/admin/users', { params }),
  createUser:      (data: any) => api.post('/admin/users', data),
  updateUser:      (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  deleteUser:      (id: string) => api.delete(`/admin/users/${id}`),
  suspendUser:     (id: string) => api.patch(`/admin/users/${id}/suspend`),
  getAnalytics:    (params?: any) => api.get('/admin/analytics', { params }),
  exportLeads:     (params?: any) => api.get('/admin/export/leads', { params, responseType: 'blob' }),
  exportProperties:(params?: any) => api.get('/admin/export/properties', { params, responseType: 'blob' }),
}

// ── Upload ──────────────────────────────────────────
export const uploadAPI = {
  image:    (data: FormData) => api.post('/upload/image', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  document: (data: FormData) => api.post('/upload/document', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:   (publicId: string) => api.delete(`/upload/${publicId}`),
}

// ── Projects (off-plan developments) ─────────────────
export const projectAPI = {
  getAll:  (params?: any) => api.get('/projects', { params }),
  getOne:  (slug: string) => api.get(`/projects/${slug}`),
  create:  (data: any) => api.post('/projects', data),
  update:  (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete:  (id: string) => api.delete(`/projects/${id}`),
  getAllDevelopers: () => api.get('/projects/developers'),
  getDeveloperBySlug: (slug: string) => api.get(`/projects/developers/${slug}`),
  getAreas: () => api.get('/projects/areas'),
  getStatusStats: (params?: any) => api.get('/projects/status-stats', { params }),
  trackShare: (id: string) => api.post(`/projects/${id}/share`),
  getAnalytics: (id: string) => api.get(`/projects/${id}/analytics`),
}

// ── Developers (real, admin-managed records) ──────────
export const developerAPI = {
  getAll:     (params?: any) => api.get('/developers', { params }),
  getBySlug:  (slug: string) => api.get(`/developers/${slug}`),
  create:     (data: any) => api.post('/developers', data),
  update:     (id: string, data: any) => api.put(`/developers/${id}`, data),
  delete:     (id: string) => api.delete(`/developers/${id}`),
}

// ── Area Content (admin-managed area-insights copy) ──
export const areaContentAPI = {
  getAll:    (params?: any) => api.get('/area-content', { params }),
  getBySlug: (slug: string) => api.get(`/area-content/${slug}`),
  create:    (data: any) => api.post('/area-content', data),
  update:    (id: string, data: any) => api.put(`/area-content/${id}`, data),
  delete:    (id: string) => api.delete(`/area-content/${id}`),
}

// ── Community Content (separate section from Area) ────
export const communityContentAPI = {
  getAll:    (params?: any) => api.get('/community-content', { params }),
  getBySlug: (slug: string) => api.get(`/community-content/${slug}`),
  create:    (data: any) => api.post('/community-content', data),
  update:    (id: string, data: any) => api.put(`/community-content/${id}`, data),
  delete:    (id: string) => api.delete(`/community-content/${id}`),
}

// ── Building Content ───────────────────────────────────
export const buildingContentAPI = {
  getAll:    (params?: any) => api.get('/building-content', { params }),
  getBySlug: (slug: string) => api.get(`/building-content/${slug}`),
  create:    (data: any) => api.post('/building-content', data),
  update:    (id: string, data: any) => api.put(`/building-content/${id}`, data),
  delete:    (id: string) => api.delete(`/building-content/${id}`),
}

// ── Saved Searches ────────────────────────────────────
export const savedSearchAPI = {
  create: (data: { name: string; filters: any }) => api.post('/saved-searches', data),
  getAll: () => api.get('/saved-searches'),
  update: (id: string, data: { name?: string; alertsEnabled?: boolean }) => api.patch(`/saved-searches/${id}`, data),
  delete: (id: string) => api.delete(`/saved-searches/${id}`),
}

// ── Tasks (lead follow-up reminders) ──────────────────
export const taskAPI = {
  create:   (data: { lead: string; title: string; dueAt: string; assignedTo?: string }) => api.post('/tasks', data),
  getForLead: (leadId: string) => api.get(`/tasks/lead/${leadId}`),
  getMy:    (params?: { includeCompleted?: boolean }) => api.get('/tasks/my', { params }),
  complete: (id: string) => api.patch(`/tasks/${id}/complete`),
  delete:   (id: string) => api.delete(`/tasks/${id}`),
}

// ── Mortgage inquiries ────────────────────────────────
export const mortgageAPI = {
  create:  (data: any) => api.post('/mortgage-inquiries', data),
  getAll:  (params?: any) => api.get('/mortgage-inquiries', { params }),
  update:  (id: string, data: any) => api.patch(`/mortgage-inquiries/${id}`, data),
  delete:  (id: string) => api.delete(`/mortgage-inquiries/${id}`),
}

// ── Homepage CMS ─────────────────────────────────────
export const homepageAPI = {
  get:          () => api.get('/homepage'),
  update:       (data: any) => api.put('/homepage', data),
  trackView:    () => api.post('/homepage/track/view'),
  trackCta:     (cta: string) => api.post('/homepage/track/cta', { cta }),
  getAnalytics: () => api.get('/homepage/analytics'),
}

export default api