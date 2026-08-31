// Audit log (owner-only). A read-only trail of every privileged action taken in
// the dashboard — who did what and when. Written by the API on each action.
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { admin as adminAPI } from '../../services/api'
import { SectionHeader, DataState, TableWrap, Th, Td, Pill, BtnGhost } from './ui'

// Map the stored action strings to readable labels.
const ACTION_LABELS = {
  'user.suspend': { label: 'Suspend account', tone: 'red' },
  'user.active': { label: 'Reactivate account', tone: 'green' },
  'user.role': { label: 'Change role', tone: 'blue' },
  'user.delete': { label: 'Delete user', tone: 'red' },
  'order.status': { label: 'Update order', tone: 'amber' },
  'settings.update': { label: 'Update settings', tone: 'ink' },
}

export default function AuditSection() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    adminAPI.listAudit()
      .then(setRows)
      .catch((e) => setError(e.message || 'Failed to load audit log'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <>
      <SectionHeader title="Audit Log" subtitle="Every privileged action by staff — visible to the Store Owner only.">
        <BtnGhost onClick={load} disabled={loading}>
          <RefreshCw size={15} /> {loading ? 'LOADING…' : 'REFRESH'}
        </BtnGhost>
      </SectionHeader>

      <DataState loading={loading} error={error} empty={rows.length === 0} emptyLabel="No recorded actions yet">
        <TableWrap>
          <thead>
            <tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Details</Th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = ACTION_LABELS[r.action] || { label: r.action || 'Action', tone: 'ink' }
              return (
                <tr key={r._id}>
                  <Td className="text-muted whitespace-nowrap">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</Td>
                  <Td className="font-semibold text-ink">{r.actorEmail || 'System'}</Td>
                  <Td><Pill tone={meta.tone}>{meta.label}</Pill></Td>
                  <Td className="text-muted">{r.details || '—'}</Td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      </DataState>
    </>
  )
}
