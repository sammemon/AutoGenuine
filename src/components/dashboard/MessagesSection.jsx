import { useEffect, useMemo, useState } from 'react'
import {
  Inbox,
  Mail,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Sparkles,
  Bot,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Flame,
  Clock,
  ExternalLink,
  Eye,
  RotateCcw,
  User,
  Shield,
  FileText,
} from 'lucide-react'
import Modal from '../Modal'
import { admin as adminAPI, chat as chatAPI } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import ChatWorkspace from '../chat/ChatWorkspace'
import { SectionHeader, DataState, ConfirmDialog, Pagination } from './ui'

function PriorityTag({ priority }) {
  if (priority === 'urgent') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wider border border-red-200">
        <Flame size={10} className="text-red-600 animate-pulse" /> URGENT
      </span>
    )
  }
  if (priority === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider border border-orange-200">
        <AlertTriangle size={10} /> HIGH
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
      {priority || 'NORMAL'}
    </span>
  )
}

export default function MessagesSection() {
  const { showToast } = useToast()
  // Tabs: 'chat' | 'escalations' | 'inquiries'
  const [tab, setTab] = useState('chat')
  const [selectedConversationId, setSelectedConversationId] = useState('')
  const [selectedEscalation, setSelectedEscalation] = useState(null)

  // Contact form messages
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Escalations queue & analytics
  const [escalations, setEscalations] = useState([])
  const [escalationsLoading, setEscalationsLoading] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [escFilter, setEscFilter] = useState('all')

  function loadEscalationsAndAnalytics() {
    setEscalationsLoading(true)
    Promise.all([
      chatAPI.getEscalations().catch(() => ({ escalations: [] })),
      chatAPI.getSupportAnalytics().catch(() => null),
    ])
      .then(([escRes, anaRes]) => {
        setEscalations(escRes.escalations || [])
        setAnalytics(anaRes)
      })
      .catch((e) => showToast(e.message || 'Failed to load support queue'))
      .finally(() => setEscalationsLoading(false))
  }

  async function handleResolveEscalation(esc) {
    const convId = esc.conversation?._id || esc.conversation
    if (!convId) return
    try {
      await chatAPI.resolveConversation(convId, { resolutionNote: 'Resolved directly by staff from Escalations Queue' })
      showToast('✅ Support ticket resolved & closed successfully')
      if (selectedEscalation?._id === esc._id) {
        setSelectedEscalation((prev) => (prev ? { ...prev, status: 'resolved', resolutionNote: 'Resolved by staff' } : prev))
      }
      loadEscalationsAndAnalytics()
    } catch (err) {
      showToast(err.message || 'Failed to resolve ticket')
    }
  }

  async function handleReopenEscalation(esc) {
    const convId = esc.conversation?._id || esc.conversation
    if (!convId) return
    try {
      await chatAPI.reopenConversation(convId, { reason: 'Reopened by staff for review' })
      showToast('🔄 Ticket reopened successfully')
      if (selectedEscalation?._id === esc._id) {
        setSelectedEscalation((prev) => (prev ? { ...prev, status: 'in_progress' } : prev))
      }
      loadEscalationsAndAnalytics()
    } catch (err) {
      showToast(err.message || 'Failed to reopen ticket')
    }
  }

  const filteredEscalations = useMemo(() => {
    if (escFilter === 'all') return escalations
    return escalations.filter((e) => e.status === escFilter)
  }, [escalations, escFilter])

  useEffect(() => {
    loadEscalationsAndAnalytics()
  }, [])

  useEffect(() => {
    if (tab !== 'inquiries' || rows.length > 0) return
    setLoading(true)
    adminAPI
      .listMessages()
      .then(setRows)
      .catch((e) => setError(e.message || 'Failed to load messages'))
      .finally(() => setLoading(false))
  }, [tab, rows.length])

  async function confirmDelete() {
    setBusy(true)
    try {
      await adminAPI.deleteMessage(toDelete._id)
      setRows((prev) => prev.filter((m) => m._id !== toDelete._id))
      showToast('Message deleted')
      setToDelete(null)
    } catch (e) {
      showToast(e.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  return (
    <>
      <SectionHeader
        title="Customer Support & Messages"
        subtitle="AI customer support engine, real-time human escalation queue, and contact enquiries."
      />

      {/* KPI Support Stat Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Bot size={13} className="text-amber-500" /> AI Resolution Rate
            </p>
            <p className="text-xl sm:text-2xl font-black text-ink">{analytics.aiResolutionRate}%</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Automated without staff</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-red-500" /> Escalations
            </p>
            <p className="text-xl sm:text-2xl font-black text-red-600">{analytics.escalated}</p>
            <p className="text-[10px] text-muted font-semibold mt-0.5">Assigned to Admin / Owner</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Flame size={13} className="text-orange-500" /> High Priority
            </p>
            <p className="text-xl sm:text-2xl font-black text-orange-600">{analytics.highPriority}</p>
            <p className="text-[10px] text-muted font-semibold mt-0.5">Urgent issues</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" /> Resolved Tickets
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">{analytics.resolved}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Completed successfully</p>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setTab('chat')}
          className={`h-10 px-4 rounded-xl text-xs font-black flex items-center gap-2 border transition-colors ${
            tab === 'chat'
              ? 'bg-brand text-white border-brand shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:text-brand'
          }`}
        >
          <MessageSquare size={15} /> Live Chat Workspace
        </button>

        <button
          onClick={() => {
            setTab('escalations')
            loadEscalationsAndAnalytics()
          }}
          className={`h-10 px-4 rounded-xl text-xs font-black flex items-center gap-2 border transition-colors relative ${
            tab === 'escalations'
              ? 'bg-brand text-white border-brand shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:text-brand'
          }`}
        >
          <AlertTriangle size={15} className="text-amber-500" /> Escalations Queue
          {escalations.filter((e) => e.status === 'pending').length > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
              {escalations.filter((e) => e.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('inquiries')}
          className={`h-10 px-4 rounded-xl text-xs font-black flex items-center gap-2 border transition-colors ${
            tab === 'inquiries'
              ? 'bg-brand text-white border-brand shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:text-brand'
          }`}
        >
          <Inbox size={15} /> Contact Enquiries
        </button>
      </div>

      {/* Tab 1: Live Chat Workspace */}
      {tab === 'chat' && (
        <ChatWorkspace compact initialConversationId={selectedConversationId} />
      )}

      {/* Tab 2: Escalations Queue */}
      {tab === 'escalations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted font-bold">
              Showing {escalations.length} total customer escalations from AI
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'all', label: `All (${escalations.length})` },
                { key: 'pending', label: `Pending (${escalations.filter((e) => e.status === 'pending').length})` },
                { key: 'in_progress', label: `In Progress (${escalations.filter((e) => e.status === 'in_progress').length})` },
                { key: 'resolved', label: `Resolved Archive (${escalations.filter((e) => e.status === 'resolved').length})` },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setEscFilter(f.key)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors ${
                    escFilter === f.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadEscalationsAndAnalytics}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:text-brand flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} className={escalationsLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          <DataState
            loading={escalationsLoading}
            error=""
            empty={filteredEscalations.length === 0}
            emptyLabel={escFilter === 'all' ? 'No support escalations found.' : `No ${escFilter.replace('_', ' ')} escalations.`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEscalations.map((esc) => (
                <div
                  key={esc._id}
                  className={`bg-white rounded-2xl border p-5 space-y-3.5 shadow-xs transition-all ${
                    esc.status === 'pending'
                      ? 'border-amber-300 ring-2 ring-amber-400/10'
                      : esc.status === 'resolved'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-sm text-ink">{esc.customerName || 'Customer'}</span>
                        <PriorityTag priority={esc.priority} />
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                          To: {esc.assignedRole === 'owner' ? 'Store Owner' : 'Admin'}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted">{esc.customerEmail}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        esc.status === 'pending'
                          ? 'bg-red-100 text-red-800 animate-pulse'
                          : esc.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {esc.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-800">
                      <span className="text-muted font-normal">Reason: </span> {esc.reason}
                    </p>
                    {esc.aiSummary && (
                      <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong>AI Diagnosis:</strong> {esc.aiSummary}
                      </p>
                    )}
                    {esc.recommendedAction && (
                      <p className="text-brand font-bold">
                        👉 <strong>Action:</strong> {esc.recommendedAction}
                      </p>
                    )}
                    {esc.resolutionNote && (
                      <p className="text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-[11px]">
                        <strong>Resolution:</strong> {esc.resolutionNote}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <Clock size={12} /> {new Date(esc.createdAt).toLocaleString()}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSelectedEscalation(esc)}
                        className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                        title="View dispute details popup"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>

                      {esc.status !== 'resolved' ? (
                        <>
                          <button
                            onClick={() => handleResolveEscalation(esc)}
                            className="h-8 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wider transition-colors flex items-center gap-1"
                            title="Mark ticket resolved & archive"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Resolve</span>
                          </button>

                          <button
                            onClick={() => {
                              setTab('chat')
                              setSelectedConversationId(esc.conversation?._id || esc.conversation)
                            }}
                            className="h-8 px-3 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-wider transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <span>Take Over &amp; Reply</span>
                            <ArrowRight size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleReopenEscalation(esc)}
                            className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                            title="Reopen closed ticket"
                          >
                            <RotateCcw size={13} />
                            <span>Reopen</span>
                          </button>

                          <button
                            onClick={() => {
                              setTab('chat')
                              setSelectedConversationId(esc.conversation?._id || esc.conversation)
                            }}
                            className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black tracking-wider transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <span>View Chat</span>
                            <MessageSquare size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DataState>
        </div>
      )}

      {/* Tab 3: Contact Form Enquiries */}
      {tab === 'inquiries' && (
        <DataState loading={loading} error={error} empty={rows.length === 0} emptyLabel="No enquiries yet">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedRows.map((m) => (
              <div key={m._id} className="bg-white rounded-xl border border-line p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{m.name}</p>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-[13px] text-brand hover:underline flex items-center gap-1 truncate"
                    >
                      <Mail size={13} /> {m.email}
                    </a>
                    {m.phone && <p className="text-[12px] text-muted mt-0.5">{m.phone}</p>}
                  </div>
                  <button
                    onClick={() => setToDelete(m)}
                    className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-red-600 hover:bg-red-50 shrink-0"
                    aria-label="Delete message"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {m.subject && <p className="mt-3 text-[13px] font-semibold text-ink">{m.subject}</p>}
                <p className="mt-1 text-[13px] text-muted whitespace-pre-wrap">{m.message}</p>
                <p className="mt-3 text-[11px] text-muted">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                </p>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            total={rows.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </DataState>
      )}

      {/* Dispute / Escalation Details Modal Popup */}
      <Modal
        open={!!selectedEscalation}
        onClose={() => setSelectedEscalation(null)}
        title="Dispute & Escalation Details"
      >
        {selectedEscalation && (
          <div className="space-y-4">
            {/* Header / Status Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-ink text-base">{selectedEscalation.customerName || 'Customer'}</span>
                  <PriorityTag priority={selectedEscalation.priority} />
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                    To: {selectedEscalation.assignedRole === 'owner' ? 'Store Owner' : 'Admin'}
                  </span>
                </div>
                <p className="text-xs text-muted">{selectedEscalation.customerEmail}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  selectedEscalation.status === 'pending'
                    ? 'bg-red-100 text-red-800'
                    : selectedEscalation.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedEscalation.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Dispute Breakdown */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted block">Escalation Reason</span>
                <p className="text-xs font-bold text-ink">{selectedEscalation.reason}</p>
              </div>

              {selectedEscalation.aiSummary && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block flex items-center gap-1">
                    <Sparkles size={12} /> AI Diagnosis & Context
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedEscalation.aiSummary}</p>
                </div>
              )}

              {selectedEscalation.recommendedAction && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand block">Recommended Action</span>
                  <p className="text-xs font-bold text-slate-800">{selectedEscalation.recommendedAction}</p>
                </div>
              )}

              {/* Resolution Notes (if resolved) */}
              {selectedEscalation.resolutionNote && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block flex items-center gap-1">
                    <CheckCircle2 size={12} /> Staff Resolution Note
                  </span>
                  <p className="text-xs text-emerald-950">{selectedEscalation.resolutionNote}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-[11px] text-muted">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold block text-slate-700">Created:</span>
                  {new Date(selectedEscalation.createdAt).toLocaleString()}
                </div>
                {selectedEscalation.resolvedAt && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <span className="font-bold block text-emerald-800">Resolved At:</span>
                    {new Date(selectedEscalation.resolvedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => {
                  const convId = selectedEscalation.conversation?._id || selectedEscalation.conversation
                  setSelectedEscalation(null)
                  setTab('chat')
                  setSelectedConversationId(convId)
                }}
                className="h-10 px-4 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-wider uppercase transition-all shadow-xs flex items-center gap-2"
              >
                <MessageSquare size={15} />
                <span>{selectedEscalation.status === 'resolved' ? 'View Full Chat Transcript' : 'Take Over & Reply Live'}</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedEscalation.status !== 'resolved' ? (
                  <button
                    onClick={() => handleResolveEscalation(selectedEscalation)}
                    className="h-10 px-4 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>Resolve Dispute</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopenEscalation(selectedEscalation)}
                    className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    <span>Reopen Dispute</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedEscalation(null)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Delete message"
        message={`Delete the message from ${toDelete?.name}?`}
      />
    </>
  )
}
