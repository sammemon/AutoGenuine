// Staff Account Settings — the dashboard-native profile page for admins/owners.
// Distinct from the customer Settings page (which wears storefront chrome): this
// lives inside the console, shows the role + the exact capabilities that role
// carries, and has no "delete my account" escape hatch (staff removal is an
// owner action in the Users section, audited).
import { useState } from 'react'
import { User, Lock, Save, ShieldCheck, Check } from 'lucide-react'
import { useAuth, initials } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { resolveImageUrl } from '../../utils/imageUrl'
import { auth as authAPI } from '../../services/api'
import { ROLE_PERMISSIONS, roleLabel } from '../../auth/permissions'
import ImageUpload from '../ImageUpload'
import { SectionHeader, Field, BtnPrimary, Pill } from './ui'

// Friendly one-liners for each permission string, shown in the capability card so
// a staff member can see exactly what their role grants.
const PERM_LABELS = {
  'dashboard:view': 'Open the management console',
  'stats:view': 'See store statistics',
  'users:view': 'View customer & staff accounts',
  'users:set-status': 'Suspend or reactivate accounts',
  'users:set-role': 'Change account roles',
  'users:delete': 'Permanently delete accounts',
  'orders:view': 'View all orders',
  'orders:update': 'Update order status',
  'products:manage': 'Add, edit & remove products',
  'categories:manage': 'Manage categories',
  'vehicles:manage': 'Manage vehicles',
  'messages:view': 'Read contact messages',
  'messages:delete': 'Delete contact messages',
  'analytics:view': 'View revenue & sales analytics',
  'settings:manage': 'Change store-wide settings',
  'audit:view': 'Read the staff audit log',
}

export default function StaffAccountSection() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [busy, setBusy] = useState({ profile: false, password: false })

  const perms = ROLE_PERMISSIONS[user?.role] || []

  async function saveProfile(e) {
    e.preventDefault()
    setBusy((b) => ({ ...b, profile: true }))
    try {
      await updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar: profile.avatar,
      })
      showToast('Profile updated')
    } catch (err) {
      showToast(err.message || 'Update failed')
    } finally {
      setBusy((b) => ({ ...b, profile: false }))
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (pwd.newPassword !== pwd.confirmPassword) {
      showToast('Passwords do not match')
      return
    }
    if (pwd.newPassword.length < 8) {
      showToast('Password must be at least 8 characters')
      return
    }
    setBusy((b) => ({ ...b, password: true }))
    try {
      await authAPI.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
      showToast('Password changed')
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showToast(err.message || 'Password change failed')
    } finally {
      setBusy((b) => ({ ...b, password: false }))
    }
  }

  return (
    <>
      <SectionHeader title="Account Settings" subtitle="Your staff profile, security and access — separate from the customer-facing account page." />

      {/* Identity banner */}
      <div className="bg-white rounded-xl border border-line p-5 flex items-center gap-4 mb-6">
        {profile.avatar
          ? <img
              src={resolveImageUrl(profile.avatar)}
              referrerPolicy="no-referrer"
              alt=""
              className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200"
              onError={(e) => {
                e.target.style.display = 'none'
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
              }}
            />
          : null}
        <span
          style={{ display: profile.avatar ? 'none' : 'flex' }}
          className="w-16 h-16 rounded-full bg-brand text-white items-center justify-center text-xl font-black shrink-0"
        >
          {initials(user?.name)}
        </span>
        <div className="min-w-0">
          <p className="text-ink font-black text-lg leading-tight truncate">{user?.name}</p>
          <p className="text-muted text-[13px] truncate">{user?.email}</p>
          <span className="inline-block mt-1.5"><Pill tone="brand"><ShieldCheck size={12} /> {roleLabel(user?.role)}</Pill></span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile form */}
        <form onSubmit={saveProfile} className="bg-white rounded-xl border border-line p-6 space-y-4">
          <h3 className="text-ink font-black text-[15px] flex items-center gap-2"><User size={18} className="text-brand" /> Profile Information</h3>
          <Field label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <Field label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <Field label="Phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <ImageUpload
            label="Profile Photo"
            shape="circle"
            value={profile.avatar}
            onChange={(url) => setProfile({ ...profile, avatar: url })}
            helperText="JPG, PNG, WEBP • Max 5 MB"
          />
          <div className="flex justify-end pt-1">
            <BtnPrimary type="submit" disabled={busy.profile}>
              <Save size={15} /> {busy.profile ? 'SAVING…' : 'SAVE PROFILE'}
            </BtnPrimary>
          </div>
        </form>

        {/* Password form */}
        <form onSubmit={savePassword} className="bg-white rounded-xl border border-line p-6 space-y-4">
          <h3 className="text-ink font-black text-[15px] flex items-center gap-2"><Lock size={18} className="text-brand" /> Change Password</h3>
          <Field label="Current Password" type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          <Field label="New Password" type="password" placeholder="Minimum 8 characters" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          <Field label="Confirm New Password" type="password" value={pwd.confirmPassword} onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })} />
          <div className="flex justify-end pt-1">
            <BtnPrimary type="submit" disabled={busy.password}>
              <Lock size={15} /> {busy.password ? 'UPDATING…' : 'UPDATE PASSWORD'}
            </BtnPrimary>
          </div>
        </form>
      </div>

      {/* Capability card — exactly what this role can do, straight from the shared map */}
      <div className="mt-6 bg-white rounded-xl border border-line p-6">
        <h3 className="text-ink font-black text-[15px] flex items-center gap-2 mb-1"><ShieldCheck size={18} className="text-brand" /> Your Access</h3>
        <p className="text-muted text-[13px] mb-4">Capabilities granted to the <span className="font-bold text-ink">{roleLabel(user?.role)}</span> role. These are enforced by the server on every request.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {perms.map((p) => (
            <div key={p} className="flex items-center gap-2.5 text-[13px] text-ink">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0"><Check size={12} /></span>
              {PERM_LABELS[p] || p}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
