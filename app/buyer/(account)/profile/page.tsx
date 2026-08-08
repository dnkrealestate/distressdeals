'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Shield, Heart, TrendingUp, Clock, CheckCircle2, Settings, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { userAPI, authAPI, leadAPI } from '@/lib/api'
import { getInitials, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const TABS = ['Profile', 'Notifications', 'Security'] as const
type Tab = typeof TABS[number]

const NOTIFICATION_FIELDS: { key: string; label: string; desc: string }[] = [
  { key: 'newProperties',    label: 'New Property Matches', desc: 'Get notified when new listings match your criteria' },
  { key: 'leadUpdates',      label: 'Lead Status Updates',   desc: 'Updates on your property enquiries' },
  { key: 'meetingReminders', label: 'Meeting Reminders',     desc: 'Reminders for scheduled property viewings' },
  { key: 'messages',         label: 'Messages',              desc: 'New messages from your agent' },
  { key: 'email',            label: 'Email Notifications',  desc: 'Receive notifications via email' },
  { key: 'push',             label: 'Push Notifications',   desc: 'Receive browser/app push notifications' },
  { key: 'sms',              label: 'SMS Notifications',    desc: 'Receive notifications via text message' },
]

export default function BuyerProfilePage() {
  const { user, setUser } = useAuthStore()
  const { favorites, fetchFavorites } = useFavoritesStore()
  const [tab, setTab] = useState<Tab>('Profile')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leadCount, setLeadCount] = useState<number | null>(null)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [notifications, setNotifications] = useState(user?.notifications || {
    email: true, push: true, sms: false, newProperties: true, leadUpdates: true, messages: true, meetingReminders: true,
  })
  const [savingNotifications, setSavingNotifications] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    fetchFavorites()
    leadAPI.myLeads({ limit: 1 }).then(r => { if (r.data.success) setLeadCount(r.data.data.total) }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await userAPI.updateProfile({ name: form.name, phone: form.phone })
      if (res.data.success) setUser(res.data.data)
      toast.success('Profile updated')
      setEditing(false)
    } catch (err: any) {
      toast.error(err?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const toggleNotification = async (key: string) => {
    const next = { ...notifications, [key]: !(notifications as any)[key] }
    setNotifications(next)
    setSavingNotifications(true)
    try {
      const res = await userAPI.updateProfile({ notifications: next })
      if (res.data.success) setUser(res.data.data)
    } catch (err: any) {
      setNotifications(notifications) // revert on failure
      toast.error(err?.error || 'Failed to update notification settings')
    } finally {
      setSavingNotifications(false)
    }
  }

  const submitPasswordChange = async () => {
    if (!pwForm.current || !pwForm.next) { toast.error('Fill in all password fields'); return }
    if (pwForm.next !== pwForm.confirm) { toast.error('New passwords do not match'); return }
    if (pwForm.next.length < 6) { toast.error('New password must be at least 6 characters'); return }
    setChangingPw(true)
    try {
      await authAPI.changePassword(pwForm.current, pwForm.next)
      toast.success('Password updated')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      toast.error(err?.error || 'Failed to update password')
    } finally {
      setChangingPw(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="card p-6 flex flex-wrap items-center gap-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
          {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="" /> : getInitials(user?.name || 'U')}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>{user?.name}</h2>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-teal capitalize">{user?.role}</span>
            {user?.isEmailVerified && <span className="badge badge-green">Email Verified</span>}
          </div>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          {[
            { icon: Heart,      label: 'Saved',     val: favorites.length },
            { icon: TrendingUp, label: 'Enquiries', val: leadCount ?? '—' },
            { icon: Clock,      label: 'Member Since', val: formatDate(user?.createdAt || '') },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="text-center">
              <Icon size={15} style={{ color: 'var(--teal)' }} className="mx-auto mb-1" />
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{val}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className="btn-ghost btn-sm"
            style={tab === t ? { color: 'var(--teal)', borderColor: 'rgba(49,178,222,0.40)', background: 'rgba(49,178,222,0.06)' } : undefined}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Personal Information</h3>
            <button
              onClick={() => (editing ? saveProfile() : setEditing(true))}
              disabled={saving}
              className={editing ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : editing ? <CheckCircle2 size={13} /> : <Settings size={13} />}
              {editing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <User size={11} style={{ color: 'var(--teal)' }} />Full Name
              </label>
              {editing ? (
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              ) : (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--bg-alt)', color: 'var(--text-mid)' }}>{form.name}</div>
              )}
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Mail size={11} style={{ color: 'var(--teal)' }} />Email Address
              </label>
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Phone size={11} style={{ color: 'var(--teal)' }} />Phone Number
              </label>
              {editing ? (
                <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+971 5X XXX XXXX" />
              ) : (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--bg-alt)', color: form.phone ? 'var(--text-mid)' : 'var(--text-muted)' }}>
                  {form.phone || 'Not set'}
                </div>
              )}
            </div>
          </div>

          <div className="divider my-6" />

          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Email Verified', active: user?.isEmailVerified, icon: Mail },
              { label: 'Phone Verified', active: user?.isPhoneVerified, icon: Phone },
            ].map(({ label, active, icon: Icon }) => (
              <div key={label} className={active ? 'badge badge-green' : 'badge badge-gray'} style={{ padding: '8px 14px', gap: 8 }}>
                <Icon size={13} />{label}{active && <CheckCircle2 size={12} />}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === 'Notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <h3 className="font-semibold mb-6" style={{ color: 'var(--text)' }}>Notification Preferences</h3>
          <div className="space-y-3">
            {NOTIFICATION_FIELDS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-alt)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(key)}
                  disabled={savingNotifications}
                  role="switch"
                  aria-checked={(notifications as any)[key]}
                  className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors disabled:opacity-60"
                  style={{ background: (notifications as any)[key] ? 'var(--teal)' : 'var(--border)' }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ left: 2, transform: (notifications as any)[key] ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === 'Security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield size={16} style={{ color: 'var(--teal)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Change Password</h3>
          </div>
          <div className="space-y-3 max-w-sm">
            <input type="password" placeholder="Current Password" className="input"
              value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
            <input type="password" placeholder="New Password" className="input"
              value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
            <input type="password" placeholder="Confirm New Password" className="input"
              value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            <button onClick={submitPasswordChange} disabled={changingPw} className="btn-primary btn-sm">
              {changingPw ? <Loader2 size={13} className="animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
