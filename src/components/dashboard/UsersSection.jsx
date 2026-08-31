import { useEffect, useMemo, useState } from 'react'
import { Search, Trash2, Ban, CheckCircle2, ShieldCheck, Crown, KeyRound, Lock, Eye, EyeOff, RefreshCw, Copy, Check, ShieldAlert } from 'lucide-react'
import { admin as adminAPI } from '../../services/api'
import { useAuth, initials } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { resolveImageUrl } from '../../utils/imageUrl'
import { can, roleLabel, PERMISSION as P } from '../../auth/permissions'
import Modal from '../Modal'
import {
  SectionHeader, DataState, TableWrap, Th, Td, Pill,
  ConfirmDialog, SelectField, BtnGhost, Pagination,
} from './ui'

const ROLE_TONE = { owner: 'brand', admin: 'ink', user: 'green' }

export default function UsersSection() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [savingId, setSavingId] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  // Reset Password State
  const [resetTargetUser, setResetTargetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  // View Credentials State (Store Owner Only)
  const [viewCredentialUser, setViewCredentialUser] = useState(null)
  const [viewCredentialData, setViewCredentialData] = useState(null)
  const [fetchingCredential, setFetchingCredential] = useState(false)
  const [copied, setCopied] = useState(false)

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const canRole = can(me, P.SET_USER_ROLE)
  const canStatus = can(me, P.SET_USER_STATUS)
  const canDelete = can(me, P.DELETE_USER)
  const isRoot = !!me?.isPrimaryOwner

  useEffect(() => {
    adminAPI.listUsers()
      .then(setRows)
      .catch((e) => setError(e.message || 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!needle) return true
      return u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
    })
  }, [rows, q, roleFilter])

  useEffect(() => {
    setPage(1)
  }, [q, roleFilter])

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  }, [list, page, pageSize])

  async function changeRole(u, role) {
    if (role === u.role) return
    setSavingId(u.id)
    try {
      const updated = await adminAPI.updateUserRole(u.id, role)
      setRows((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: updated.role } : x)))
      showToast(`${u.name} is now ${roleLabel(role)}`)
    } catch (e) { showToast(e.message || 'Role change failed') } finally { setSavingId(null) }
  }

  async function toggleStatus(u) {
    const next = u.status === 'suspended' ? 'active' : 'suspended'
    setSavingId(u.id)
    try {
      const updated = await adminAPI.setUserStatus(u.id, next)
      setRows((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: updated.status } : x)))
      showToast(`${u.name} ${next === 'suspended' ? 'suspended' : 'reactivated'}`)
    } catch (e) { showToast(e.message || 'Status change failed') } finally { setSavingId(null) }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await adminAPI.deleteUser(toDelete.id)
      setRows((prev) => prev.filter((x) => x.id !== toDelete.id))
      showToast('User deleted'); setToDelete(null)
    } catch (e) { showToast(e.message || 'Delete failed') } finally { setBusy(false) }
  }

  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(pass)
    setShowPassword(true)
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault()
    if (!resetTargetUser || !newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters')
      return
    }
    setResettingPassword(true)
    try {
      await adminAPI.resetUserPassword(resetTargetUser.id, newPassword)
      showToast(`🔑 Password for ${resetTargetUser.email} updated successfully!`)
      setResetTargetUser(null)
      setNewPassword('')
    } catch (err) {
      showToast(err.message || 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  async function handleViewCredential(u) {
    setViewCredentialUser(u)
    setViewCredentialData(null)
    setFetchingCredential(true)
    setCopied(false)
    try {
      const res = await adminAPI.getUserCredential(u.id)
      setViewCredentialData(res)
    } catch (err) {
      showToast(err.message || 'Failed to fetch password credentials')
      setViewCredentialUser(null)
    } finally {
      setFetchingCredential(false)
    }
  }

  function handleCopyPassword(text) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('📋 Password copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      <SectionHeader
        title="Users"
        subtitle={canRole
          ? 'View customers and staff. Change roles, suspend, reset passwords, or remove accounts.'
          : 'View customers and staff. You can suspend customer accounts or reset passwords.'}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email"
            className="w-full h-10 pl-9 pr-3 border border-line rounded-md text-sm focus:outline-none focus:border-brand" />
        </div>
        <div className="w-[160px]">
          <SelectField value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            options={[{ value: 'all', label: 'All roles' }, { value: 'user', label: 'Customer' }, { value: 'admin', label: 'Admin' }, { value: 'owner', label: 'Owner' }]} />
        </div>
      </div>

      <DataState loading={loading} error={error} empty={list.length === 0} emptyLabel="No users found">
        <TableWrap>
          <thead>
            <tr>
              <Th>User</Th><Th>Role</Th><Th>Status</Th><Th>Joined</Th>
              {(canRole || canStatus || canDelete) && <Th className="text-right">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {paginatedList.map((u) => {
              const isSelf = String(u.id) === String(me?._id || me?.id)
              // Mirror of the server's cannotManage(): the primary owner is
              // untouchable by everyone; any other owner is manageable only by
              // the primary owner. Protected rows show no action controls.
              const isProtected = u.isPrimaryOwner || (u.role === 'owner' && !isRoot)
              const manageable = !isSelf && !isProtected
              // An admin can only moderate customers; owner/root can moderate staff too.
              const canModerateThis = canStatus && manageable && (canRole || u.role === 'user')
              return (
                <tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {u.avatar
                        ? <img
                            src={resolveImageUrl(u.avatar)}
                            referrerPolicy="no-referrer"
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        : null}
                      <span
                        style={{ display: u.avatar ? 'none' : 'flex' }}
                        className="w-9 h-9 rounded-full bg-brand text-white items-center justify-center text-[11px] font-bold"
                      >
                        {initials(u.name)}
                      </span>
                      <div className="min-w-0">
                        <span className="block font-semibold text-ink truncate max-w-[200px]">{u.name}{isSelf && <span className="text-muted font-normal"> (you)</span>}</span>
                        <span className="block text-muted text-[12px] truncate max-w-[200px]">{u.email}</span>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Pill tone={ROLE_TONE[u.role] || 'ink'}>{u.role === 'owner' && <ShieldCheck size={11} />}{roleLabel(u.role)}</Pill>
                    {u.isPrimaryOwner && <Pill tone="amber"><Crown size={11} /> Primary</Pill>}
                  </Td>
                  <Td>{u.status === 'suspended' ? <Pill tone="red">suspended</Pill> : <Pill tone="green">active</Pill>}</Td>
                  <Td className="text-muted whitespace-nowrap">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</Td>
                  {(canRole || canStatus || canDelete) && (
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        {/* Role selector: owner+ only, and never on a protected row or self */}
                        {canRole && manageable ? (
                          <select
                            value={u.role}
                            disabled={savingId === u.id}
                            onChange={(e) => changeRole(u, e.target.value)}
                            className="h-9 px-2 border border-line rounded-md text-[13px] bg-white focus:outline-none focus:border-brand disabled:opacity-50"
                          >
                            <option value="user">Customer</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                        ) : null}

                        {/* Reset Password Button */}
                        {(canModerateThis || isSelf) && (
                          <button
                            onClick={() => {
                              setResetTargetUser(u)
                              setNewPassword('')
                              setShowPassword(false)
                            }}
                            className="w-9 h-9 rounded-md border border-line flex items-center justify-center text-slate-600 hover:text-brand hover:bg-slate-50 transition-colors"
                            aria-label="Reset Password"
                            title="Reset Password"
                          >
                            <KeyRound size={15} />
                          </button>
                        )}

                        {canModerateThis && (
                          <button
                            onClick={() => toggleStatus(u)}
                            disabled={savingId === u.id}
                            className={`w-9 h-9 rounded-md border flex items-center justify-center disabled:opacity-50 ${
                              u.status === 'suspended'
                                ? 'border-line text-green-600 hover:bg-green-50'
                                : 'border-line text-amber-600 hover:bg-amber-50'
                            }`}
                            aria-label={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          >
                            {u.status === 'suspended' ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                          </button>
                        )}

                        {canDelete && manageable && (
                          <button onClick={() => setToDelete(u)} className="w-9 h-9 rounded-md border border-line flex items-center justify-center text-red-600 hover:bg-red-50" aria-label="Delete" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}

                        {/* Protected / self rows with no available action */}
                        {!manageable && !canModerateThis && !isSelf && (
                          <span className="text-muted text-[12px]" title={isProtected ? 'Protected account' : undefined}>
                            {u.isPrimaryOwner ? 'Protected' : '—'}
                          </span>
                        )}
                      </div>
                    </Td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </TableWrap>

        <Pagination
          page={page}
          total={list.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </DataState>

      {!canRole && canStatus && (
        <p className="mt-4 text-[12px] text-muted flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-brand" />
          Role changes and account deletion are reserved for the Store Owner.
        </p>
      )}

      {/* Reset Password Modal */}
      <Modal
        open={!!resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        title="Reset User Password"
      >
        {resetTargetUser && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-wider">Account Target</p>
              <p className="text-sm font-black text-ink">{resetTargetUser.name}</p>
              <p className="text-xs text-muted">{resetTargetUser.email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={generateRandomPassword}
                className="h-10 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Generate Random</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || !newPassword || newPassword.length < 6}
                  className="h-10 px-5 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-xs"
                >
                  {resettingPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        title="Reset User Password"
      >
        {resetTargetUser && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-wider">Account Target</p>
              <p className="text-sm font-black text-ink">{resetTargetUser.name}</p>
              <p className="text-xs text-muted">{resetTargetUser.email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={generateRandomPassword}
                className="h-10 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Generate Random</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || !newPassword || newPassword.length < 6}
                  className="h-10 px-5 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-xs"
                >
                  {resettingPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} busy={busy}
        title="Delete user" message={`Permanently delete ${toDelete?.name} (${toDelete?.email})? This cannot be undone.`} />
    </>
  )
}
