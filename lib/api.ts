import axios from 'axios'
import { getVisitorId } from './visitor'

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
    // Lets the backend count a guest's views once (utils/uniqueView).
    const vid = getVisitorId()
    if (vid) cfg.headers['X-Visitor-Id'] = vid
  }
  return cfg
})

// Response interceptor — handle auth errors.
// A 401 from a request made WITH a token means that token is dead (expired/revoked) — bounce to login. A 401 from
// the login/register/claim-account endpoints themselves just means "wrong credentials", which the calling form
// already shows inline (and, for claim/login done from inside a modal elsewhere on the site, hijacking the whole
// page to /auth/login would defeat the entire point of logging in without leaving where they were).
const CREDENTIAL_ENDPOINTS = /\/auth\/(login|register|claim-account|google|facebook)(\?|$)/
api.interceptors.response.use(
  res => res,
  err => {
    const isCredentialAttempt = CREDENTIAL_ENDPOINTS.test(err.config?.url || '')
    if (err.response?.status === 401 && !isCredentialAttempt && typeof window !== 'undefined') {
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
  // Forgot password: a WhatsApp code to the registered number doubles as proof of ownership and reset authorization.
  sendForgotPasswordOtp: (phone: string) => api.post('/auth/forgot-password/send-otp', { phone }),
  resetPasswordWithOtp:  (phone: string, otp: string, password: string) => api.post('/auth/forgot-password/reset', { phone, otp, password }),
  verifyEmail:      (token: string) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
  // Sets a password on an account that has none yet (auto-created, or never claimed), from the token an
  // 'I'm interested' submission handed back — signs the person straight in.
  claimAccount: (claimToken: string, password: string) => api.post('/auth/claim-account', { claimToken, password }),
  // Buyer → seller: a WhatsApp code to the number they want to sell with.
  sendSellerOtp:   (phone: string) => api.post('/auth/become-seller/send-otp', { phone }),
  verifySellerOtp: (otp: string) => api.post('/auth/become-seller/verify-otp', { otp }),
  changePassword:   (currentPassword: string, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword }),
  getMe:            () => api.get('/auth/me'),
  refreshToken:     () => api.post('/auth/refresh'),
}

// ── Routing (drive times) ───────────────────────────
export const routingAPI = {
  driveTimes: (origins: { lat: number; lng: number }[], destinations: { lat: number; lng: number }[]) =>
    api.post('/routing/drive-times', { origins, destinations }),
  // One drive with its road geometry and turn-by-turn steps.
  route: (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) =>
    api.post('/routing/route', { origin, destination }),
}

// ── Properties ──────────────────────────────────────
export const propertyAPI = {
  getAll:       (params?: any) => api.get('/properties', { params }),
  // Lightweight pins for the map search tool (filters + drawn polygon / radius).
  getMapPins:   (params?: any) => api.get('/properties/map', { params }),
  getOne:       (slug: string) => api.get(`/properties/${slug}`),
  create:       (data: FormData) => api.post('/properties', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:       (id: string, data: any) => api.put(`/properties/${id}`, data),
  // Rent availability only — routine upkeep, doesn't send a live listing back to review.
  updateAvailability: (id: string, data: { rentalStatus: string; availableFrom?: string }) => api.patch(`/properties/${id}/availability`, data),
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
  // Trending Areas sidebar — this week's views vs last week, with live listing counts.
  getTrendingAreas: (kind: 'sale' | 'rent', limit = 5) => api.get('/properties/trending-areas', { params: { kind, limit } }),
  getTypeStats: (params?: any) => api.get('/properties/type-stats', { params }),
  getAllAreas:  () => api.get('/properties/areas'),
  getAreaBySlug: (slug: string) => api.get(`/properties/areas/${slug}`),
  suggest: (q: string) => api.get('/properties/suggest', { params: { q } }),
  getSimilar:   (id: string) => api.get(`/properties/${id}/similar`),
  trackView:    (id: string) => api.post(`/properties/${id}/view`),
  trackShare:   (id: string) => api.post(`/properties/${id}/share`),
  getAnalytics: (id: string) => api.get(`/properties/${id}/analytics`),
  uploadImages: (id: string, data: FormData) => api.post(`/properties/${id}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // AI drafting can take 10-40s (a draft plus up to two revision passes) — well past the default 15s timeout.
  aiDescription: (data: any) => api.post('/properties/ai-description', data, { timeout: 90000 }),
  aiSearch: (query: string) => api.post('/properties/ai-search', { query }),
}

// ── Users / Profile ─────────────────────────────────
export const userAPI = {
  updateProfile: (data: any) => api.patch('/users/me', data),
  // Compare list is kept on the server so the buyer's agent can see it.
  getCompare:  () => api.get('/users/me/compare'),
  setCompare:  (ids: string[]) => api.put('/users/me/compare', { ids }),
  // Staff: a buyer's interests, likes, compare list and needs.
  getBuyerProfile: (id: string) => api.get(`/users/${id}/buyer-profile`),
  assignBuyerAgent: (id: string, agentId: string) => api.patch(`/users/${id}/assign-agent`, { agentId }),
  getOne:        (id: string) => api.get(`/users/${id}`),
}

// ── Favorites ───────────────────────────────────────
export const favAPI = {
  getAll:  () => api.get('/users/favorites'),
  toggle:  (propertyId: string) => api.post(`/users/favorites/${propertyId}`),
  getProjects:   () => api.get('/users/favorite-projects'),
  toggleProject: (projectId: string) => api.post(`/users/favorite-projects/${projectId}`),
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
  // Everything I have expressed interest in (properties and projects), whatever my role.
  myInterests:    () => api.get('/leads/my-interests'),
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
  // Plain text goes as JSON; with attachments it is multipart (text + up to 5 files).
  sendMessage: (roomId: string, content: string, files: File[] = []) => {
    if (files.length === 0) return api.post(`/chat/rooms/${roomId}/messages`, { content })
    const fd = new FormData()
    if (content) fd.append('content', content)
    files.forEach(f => fd.append('files', f))
    return api.post(`/chat/rooms/${roomId}/messages`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
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
  trackView:   (id: string) => api.post(`/blog/${id}/view`),
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
  // One view per visitor — counted by the backend, not by page fetches.
  trackView: (id: string) => api.post(`/projects/${id}/view`),
  create:  (data: any) => api.post('/projects', data),
  update:  (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete:  (id: string) => api.delete(`/projects/${id}`),
  getAllDevelopers: () => api.get('/projects/developers'),
  getDeveloperBySlug: (slug: string) => api.get(`/projects/developers/${slug}`),
  getAreas: () => api.get('/projects/areas'),
  getStatusStats: (params?: any) => api.get('/projects/status-stats', { params }),
  getTypeStats:   (params?: any) => api.get('/projects/type-stats', { params }),
  // Staff: every project with who added / last edited it.
  manageAll:      (params?: any) => api.get('/projects/manage/all', { params }),
  manageOne:      (id: string) => api.get(`/projects/manage/${id}`),
  trackShare: (id: string) => api.post(`/projects/${id}/share`),
  getAnalytics: (id: string) => api.get(`/projects/${id}/analytics`),
  aiDescription: (data: any) => api.post('/projects/ai-description', data, { timeout: 90000 }),
}

// ── Developers (real, admin-managed records) ──────────
export const developerAPI = {
  getAll:     (params?: any) => api.get('/developers', { params }),
  getBySlug:  (slug: string) => api.get(`/developers/${slug}`),
  create:     (data: any) => api.post('/developers', data),
  update:     (id: string, data: any) => api.put(`/developers/${id}`, data),
  delete:     (id: string) => api.delete(`/developers/${id}`),
  // Reads the developer's website and drafts the profile + logo — several pages and an AI call, so allow time.
  aiImport:   (url: string) => api.post('/developers/ai-import', { url }, { timeout: 90000 }),
  // Any logo URL → stored colour + white WebP versions.
  processLogo: (url: string, name?: string) => api.post('/developers/process-logo', { url, name }, { timeout: 60000 }),
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
// ── Ads ─────────────────────────────────────────────
export const adAPI = {
  serve:       (placement: 'listings' | 'details') => api.get('/ads/serve', { params: { placement } }),
  impressions: (ids: string[]) => api.post('/ads/impressions', { ids }),
  // Clicks go through the backend (counted there, then redirected) — this is the link an ad points at.
  clickUrl:    (id: string) => `${(api.defaults.baseURL || '').replace(/\/$/, '')}/ads/${id}/click${typeof window !== 'undefined' && getVisitorId() ? `?v=${getVisitorId()}` : ''}`,
  list:        () => api.get('/ads'),
  create:      (data: any) => api.post('/ads', data),
  update:      (id: string, data: any) => api.put(`/ads/${id}`, data),
  delete:      (id: string) => api.delete(`/ads/${id}`),
  stats:       (id: string, days = 30) => api.get(`/ads/${id}/stats`, { params: { days } }),
}

export const communityContentAPI = {
  getAll:    (params?: any) => api.get('/community-content', { params }),
  getBySlug: (slug: string) => api.get(`/community-content/${slug}`),
  create:    (data: any) => api.post('/community-content', data),
  update:    (id: string, data: any) => api.put(`/community-content/${id}`, data),
  delete:    (id: string) => api.delete(`/community-content/${id}`),
  // Drafts overview / highlights / amenities (and parent area / emirate) — the model can take ~5-20s.
  aiFill:    (data: { name: string; area?: string; emirate?: string; address?: string; coordinates?: { lat: number; lng: number } }) =>
    api.post('/community-content/ai-fill', data, { timeout: 90000 }),
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

// ── Contact (general enquiries — no property/project attached) ──
export const contactAPI = {
  submit: (data: { name: string; email: string; phone?: string; message: string; source: 'contact_form' | 'valuation_request' | 'fast_sale_request' }) =>
    api.post('/contact', data),
}

// ── Content pages (admin-editable body content for the distress-sale landing pages + About) ──
export const contentPageAPI = {
  get:    (pageKey: string) => api.get(`/content-pages/${pageKey}`),
  update: (pageKey: string, data: Partial<import('@/types').ContentPageData>) => api.put(`/content-pages/${pageKey}`, data),
}

// ── SEO settings (admin-editable title/description/keywords per page) ──
export const seoAPI = {
  get:    (pageKey: string) => api.get(`/seo/${pageKey}`),
  getAll: () => api.get('/seo'),
  update: (pageKey: string, data: { title?: string; description?: string; keywords?: string }) => api.put(`/seo/${pageKey}`, data),
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