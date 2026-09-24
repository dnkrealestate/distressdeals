import type { AgentPermission, User } from '@/types'

// The admin dashboard's modules, as assigned to staff on the Users page. Mirrors backend/src/config/modules.ts.
// Agents can hold any module; editors only the website-content ones. Admins and super admins have everything.
export interface ModuleDef { key: AgentPermission; label: string; hint: string }

export const OPERATION_MODULES: ModuleDef[] = [
  { key: 'approve_listings',  label: 'Listings',          hint: 'Review, approve and edit property listings' },
  { key: 'manage_leads',      label: 'Leads & Mortgage',  hint: 'Buyer enquiries, mortgage requests and tasks' },
  { key: 'schedule_meetings', label: 'Meetings',          hint: 'Viewings and client meetings' },
  { key: 'manage_agents',     label: 'Agents',            hint: 'Manage the agent team' },
  { key: 'view_analytics',    label: 'Analytics',         hint: 'Reports and performance charts' },
  { key: 'export_data',       label: 'Export data',       hint: 'Download leads and listings as files' },
]

export const CONTENT_MODULES: ModuleDef[] = [
  { key: 'manage_blog',        label: 'Blog & News',   hint: 'Articles, news and the editorial calendar' },
  { key: 'manage_homepage',    label: 'Homepage',      hint: 'Hero, stats and homepage sections' },
  { key: 'manage_seo',         label: 'SEO',           hint: 'Page titles, descriptions and keywords' },
  { key: 'manage_pages',       label: 'Page Content',  hint: 'About page and the distress-sale pages' },
  { key: 'manage_projects',    label: 'Projects',      hint: 'Off-plan and new development listings' },
  { key: 'manage_developers',  label: 'Developers',    hint: 'Developer profiles' },
  { key: 'manage_areas',       label: 'Areas',         hint: 'Area guide pages' },
  { key: 'manage_communities', label: 'Communities',   hint: 'Community guide pages' },
  { key: 'manage_buildings',   label: 'Buildings',     hint: 'Building guide pages' },
]

export const CONTENT_KEYS = CONTENT_MODULES.map(m => m.key)

export const STAFF_ROLES = ['admin', 'super_admin', 'agent', 'editor']
export const isFullAccess = (user?: Pick<User, 'role'> | null) => user?.role === 'admin' || user?.role === 'super_admin'

// The login response already expands the legacy "all content" umbrella, but check it too for safety.
export function can(user: Pick<User, 'role' | 'permissions'> | null | undefined, key: AgentPermission): boolean {
  if (!user) return false
  if (isFullAccess(user)) return true
  const perms = user.permissions || []
  return perms.includes(key) || (CONTENT_KEYS.includes(key) && perms.includes('manage_content'))
}

export const canAnyContent = (user: Pick<User, 'role' | 'permissions'> | null | undefined) => CONTENT_KEYS.some(k => can(user, k))

// Admin pages that belong to a single content module — used to block direct visits without that module.
export const PATH_MODULE: [string, AgentPermission][] = [
  ['/admin/content', 'manage_blog'],
  ['/admin/homepage', 'manage_homepage'],
  ['/admin/seo', 'manage_seo'],
  ['/admin/settings/content-pages', 'manage_pages'],
  ['/admin/projects', 'manage_projects'],
  ['/admin/developers', 'manage_developers'],
  ['/admin/areas', 'manage_areas'],
  ['/admin/communities', 'manage_communities'],
  ['/admin/buildings', 'manage_buildings'],
  ['/admin/properties', 'approve_listings'],
  ['/admin/leads', 'manage_leads'],
  ['/admin/mortgage', 'manage_leads'],
  ['/admin/meetings', 'schedule_meetings'],
  ['/admin/agents', 'manage_agents'],
]

export const ROLE_LABEL: Record<string, string> = {
  buyer: 'Buyer', seller: 'Seller', agent: 'Agent', editor: 'Editor', admin: 'Admin', super_admin: 'Super Admin',
}

// Where a staff member lands after signing in: editors have no Overview, so they start at Settings.
export const staffHome = (user?: Pick<User, 'role'> | null) => user?.role === 'editor' ? '/admin/settings' : '/admin/dashboard'
