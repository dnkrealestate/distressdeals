'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Search, UserCog, Ban, CheckCircle2, ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import type { User } from '@/types'
import toast from 'react-hot-toast'

const ROLE_TABS = [
  { value: '',       label: 'All'    },
  { value: 'buyer',  label: 'Buyers' },
  { value: 'seller', label: 'Sellers'},
]

const ROLE_OPTIONS = ['buyer', 'seller', 'admin', 'super_admin']

interface UserFormValues { name: string; email: string; password?: string; phone?: string; role: string }

function UserFormModal({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!user
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UserFormValues>({
    defaultValues: {
      name: user?.name || '', email: user?.email || '', password: '',
      phone: user?.phone || '', role: user?.role || 'buyer',
    },
  })

  const onSubmit = async (data: UserFormValues) => {
    const payload: any = { name: data.name, email: data.email, phone: data.phone, role: data.role }
    if (data.password) payload.password = data.password

    try {
      if (isEdit) await adminAPI.updateUser(user!._id, payload)
      else {
        if (!data.password) { toast.error('Password is required'); return }
        await adminAPI.createUser(payload)
      }
      toast.success(isEdit ? 'User updated' : 'User created')
      onSaved(); onClose()
    } catch (err: any) { toast.error(err?.error || 'Failed to save user') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{isEdit ? 'Edit User' : 'New User'}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-3">
          <input className="input" placeholder="Full name" {...register('name', { required: true })} />
          {errors.name && <p className="text-xs" style={{ color: '#FB7185' }}>Name is required</p>}

          <input className="input" type="email" placeholder="Email" {...register('email', { required: true })} />
          {errors.email && <p className="text-xs" style={{ color: '#FB7185' }}>Email is required</p>}

          <input className="input" type="password" placeholder={isEdit ? 'New password (leave blank to keep current)' : 'Password'} {...register('password', { required: !isEdit, minLength: 6 })} />
          {errors.password && <p className="text-xs" style={{ color: '#FB7185' }}>Password is required (min 6 characters)</p>}

          <input className="input" placeholder="Phone (optional)" {...register('phone')} />

          <select className="select-field" {...register('role')}>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            To add agents with CRM permissions, use the Agents page instead.
          </p>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center mt-2">
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [role, setRole] = useState('')
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | null | 'new'>(null)
  const limit = 20

  const load = useCallback(() => {
    setLoading(true)
    adminAPI.getUsers({ role: role || undefined, q: q || undefined, page, limit })
      .then(r => { if (r.data.success) { setUsers(r.data.data.data || []); setTotal(r.data.data.total || 0) } })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [role, q, page])

  useEffect(() => { load() }, [load])

  const toggleSuspend = async (u: User) => {
    try {
      await adminAPI.suspendUser(u._id)
      toast.success(u.status === 'suspended' ? 'User reactivated' : 'User suspended')
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to update user') }
  }

  const remove = async (u: User) => {
    if (!confirm(`Delete "${u.name}"? This cannot be undone.`)) return
    try {
      await adminAPI.deleteUser(u._id)
      toast.success('User deleted')
      load()
    } catch (err: any) { toast.error(err?.error || 'Failed to delete user') }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <header className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Users</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Buyers and sellers on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="input-glass w-64">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              className="bg-transparent outline-none flex-1 text-sm"
              placeholder="Search name, email…"
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1) }}
            />
          </div>
          <button onClick={() => setEditing('new')} className="btn-primary btn-sm gap-2">
            <Plus size={13} /> Add User
          </button>
        </div>
      </header>

      <div className="p-7">
        <div className="flex items-center gap-1.5 mb-5">
          {ROLE_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setRole(t.value); setPage(1) }}
              className="btn-ghost btn-sm"
              style={role === t.value ? { color: 'var(--teal)', borderColor: 'rgba(203,1,1,0.40)', background: 'rgba(203,1,1,0.06)' } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">{Array(6).fill(null).map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <UserCog size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users match this filter</p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                          {u.name?.[0] || 'U'}
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{u.name}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-xs" style={{ color: 'var(--text)' }}>{u.email}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.phone || '—'}</p>
                    </td>
                    <td><span className="badge badge-gray capitalize">{u.role}</span></td>
                    <td>
                      <span className={cn('badge', u.status === 'suspended' ? 'badge-red' : 'badge-green')}>{u.status}</span>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setEditing(u)} className="btn-ghost btn-sm p-2" title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => toggleSuspend(u)}
                          className="btn-ghost btn-sm p-2"
                          style={{ color: u.status === 'suspended' ? 'var(--green)' : '#FBBF24' }}
                          title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        >
                          {u.status === 'suspended' ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                        </button>
                        <button onClick={() => remove(u)} className="btn-ghost btn-sm p-2" style={{ color: '#FB7185' }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages} · {total} users</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm p-2 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm p-2 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <UserFormModal
            user={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
