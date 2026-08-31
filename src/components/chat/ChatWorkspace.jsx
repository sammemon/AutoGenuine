import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import {
  Check,
  CheckCheck,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Package,
  ExternalLink,
  Users,
  UserPlus,
  Clock,
  Sparkles,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  Download,
  FileText,
  RotateCcw,
  Lock,
} from 'lucide-react'
import { chat as chatAPI, upload as uploadAPI, SOCKET_BASE } from '../../services/api'
import { useAuth, initials } from '../../context/AuthContext'
import { useNav } from '../../context/NavContext'
import { useToast } from '../../context/ToastContext'
import { resolveImageUrl } from '../../utils/imageUrl'
import FormattedMessage from './FormattedMessage'
import { generateChatTranscriptPdf, downloadChatTranscriptWord } from '../../utils/generateChatTranscriptPdf'

function getUserId(u) {
  if (!u) return ''
  if (typeof u === 'string') return u
  return String(u.id || u._id || '')
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatMessageTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function RoleBadge({ role }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider border border-purple-200">
        <Sparkles size={9} /> Store Owner
      </span>
    )
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider border border-blue-200">
        <ShieldCheck size={9} /> Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
      Customer
    </span>
  )
}

function UserAvatar({ user: u, online, size = 'w-10 h-10', textSize = 'text-xs' }) {
  const isOwner = u?.role === 'owner'
  const isAdmin = u?.role === 'admin'

  return (
    <div className={`relative ${size} shrink-0`}>
      <div
        className={`w-full h-full rounded-full flex items-center justify-center font-black ${textSize} text-white shadow-2xs overflow-hidden ${
          isOwner
            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
            : isAdmin
            ? 'bg-gradient-to-tr from-blue-600 to-cyan-600'
            : 'bg-gradient-to-tr from-orange-500 to-amber-500'
        }`}
      >
        {u?.avatar ? (
          <img src={resolveImageUrl(u.avatar)} alt="" className="w-full h-full object-cover" />
        ) : (
          initials(u?.name || 'User')
        )}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white transition-all ${
          online ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-300'
        }`}
        title={online ? 'Online now' : 'Offline'}
      />
    </div>
  )
}

export default function ChatWorkspace({
  initialConversationId = '',
  initialParticipantId = '',
  initialOrderRef = '',
  initialProductSlug = '',
  compact = false,
}) {
  const { user } = useAuth()
  const { navigate } = useNav()
  const { showToast } = useToast()
  const currentUserId = getUserId(user)
  const isStaff = user?.role === 'admin' || user?.role === 'owner'
  const isOwner = user?.role === 'owner'

  const socketRef = useRef(null)
  const messageEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  const [conversations, setConversations] = useState([])
  const [ownerAllConversations, setOwnerAllConversations] = useState([])
  const [staffList, setStaffList] = useState([])
  const [customerList, setCustomerList] = useState([])
  const [activeId, setActiveId] = useState(initialConversationId || '')
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [search, setSearch] = useState('')
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState({})

  function handleToggleSpeechInput() {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      showToast('Voice input is not supported in this browser. Try Google Chrome.')
      return
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'ur-PK, en-US'

      recognition.onstart = () => {
        setIsListening(true)
        showToast('🎙️ Listening... speak now in English or Urdu!')
      }

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join('')
        setDraft(transcript)
      }

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('Speech start error:', err)
      setIsListening(false)
    }
  }

  // Tabs: 'inquiries' | 'staff' | 'audit'
  const [activeTab, setActiveTab] = useState(isStaff ? 'inquiries' : 'inquiries')
  // Mini Category for tickets: 'all' | 'active' | 'resolved' | 'closed'
  const [ticketFilter, setTicketFilter] = useState('all')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatSearch, setNewChatSearch] = useState('')

  // Attachment state
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [zoomImage, setZoomImage] = useState('')

  // Mobile sidebar toggle
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const activeConversation = useMemo(() => {
    const all = [...conversations, ...ownerAllConversations]
    return all.find((c) => String(c._id) === String(activeId)) || null
  }, [conversations, ownerAllConversations, activeId])

  const otherParticipant = useMemo(() => {
    if (!activeConversation) return {}
    const parts = activeConversation.participants || []
    return parts.find((p) => getUserId(p) !== currentUserId) || parts[0] || {}
  }, [activeConversation, currentUserId])

  // Base list of conversations before sub-filters
  const baseTabConversations = useMemo(() => {
    let list = activeTab === 'audit' && isStaff ? ownerAllConversations : conversations

    if (isStaff && activeTab === 'inquiries') {
      list = list.filter((c) => {
        const other = (c.participants || []).find((p) => getUserId(p) !== currentUserId)
        return other?.role === 'user' || !other?.role || c.isSupport
      })
    } else if (isStaff && activeTab === 'staff') {
      list = list.filter((c) => {
        const other = (c.participants || []).find((p) => getUserId(p) !== currentUserId)
        return (other?.role === 'admin' || other?.role === 'owner') && !c.isSupport
      })
    }
    return list
  }, [activeTab, isStaff, ownerAllConversations, conversations, currentUserId])

  // Ticket category counts
  const ticketCounts = useMemo(() => {
    let active = 0
    let resolved = 0
    let closed = 0
    for (const c of baseTabConversations) {
      if (c.supportStatus === 'resolved') {
        resolved++
      } else if (c.supportStatus === 'closed') {
        closed++
      } else {
        active++
      }
    }
    return { all: baseTabConversations.length, active, resolved, closed }
  }, [baseTabConversations])

  // Filtered by ticket mini-category & search
  const filteredConversations = useMemo(() => {
    let list = baseTabConversations

    if (ticketFilter === 'active') {
      list = list.filter((c) => c.supportStatus !== 'resolved' && c.supportStatus !== 'closed')
    } else if (ticketFilter === 'resolved') {
      list = list.filter((c) => c.supportStatus === 'resolved')
    } else if (ticketFilter === 'closed') {
      list = list.filter((c) => c.supportStatus === 'closed')
    }

    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((c) => {
      const names = (c.participants || []).map((p) => p.name || p.email || '').join(' ')
      return names.toLowerCase().includes(q) || c.orderRef?.toLowerCase().includes(q)
    })
  }, [baseTabConversations, ticketFilter, search])

  const upsertConversation = useCallback((next) => {
    setConversations((prev) => {
      const merged = [next, ...prev.filter((c) => String(c._id) !== String(next._id))]
      return merged.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || b.createdAt || 0) -
          new Date(a.lastMessage?.createdAt || a.createdAt || 0)
      )
    })
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const promises = [
        chatAPI.listConversations({}),
        chatAPI.getOnlineUsers().catch(() => ({ onlineUsers: [] })),
        chatAPI.getStaffUsers().catch(() => ({ staff: [] })),
      ]
      if (isStaff) {
        promises.push(chatAPI.getCustomerUsers().catch(() => ({ customers: [] })))
        promises.push(chatAPI.getOwnerAllConversations().catch(() => ({ conversations: [] })))
      }

      const [convRes, onlineRes, staffRes, customerRes, ownerRes] = await Promise.all(promises)

      const loaded = convRes.conversations || []
      setConversations(loaded)
      setOnlineUsers(new Set((onlineRes.onlineUsers || []).map(String)))
      setStaffList(staffRes.staff || [])
      if (customerRes?.customers) setCustomerList(customerRes.customers || [])
      if (ownerRes?.conversations) setOwnerAllConversations(ownerRes.conversations || [])

      if (!activeId && !initialConversationId && loaded.length > 0) {
        setActiveId(String(loaded[0]._id))
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    }
  }, [activeId, initialConversationId, isStaff])

  // Mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    loadConversations()
      .then(async () => {
        if (cancelled) return

        if (initialConversationId) {
          setActiveId(String(initialConversationId))
          setMobileShowChat(true)
          return
        }

        if (initialParticipantId) {
          const { conversation } = await chatAPI.getOrCreateConversation({
            participantId: initialParticipantId,
            orderRef: initialOrderRef,
            productSlug: initialProductSlug,
          })
          if (!cancelled && conversation) {
            upsertConversation(conversation)
            setActiveId(String(conversation._id))
            setMobileShowChat(true)
          }
        }
      })
      .catch((err) => showToast(err.message || 'Failed to load chat'))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [initialConversationId, initialParticipantId, initialOrderRef, initialProductSlug, loadConversations, showToast, upsertConversation])

  // Socket
  useEffect(() => {
    if (!currentUserId) return
    const token = localStorage.getItem('autogenuine_token')
    const socket = io(SOCKET_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('receive_message', (message) => {
      const msgConvId = String(message.conversation)
      const senderUid = getUserId(message.sender)

      setMessages((prev) => {
        if (message.tempId && prev.some((m) => m.tempId === message.tempId)) {
          return prev.map((m) => (m.tempId === message.tempId ? message : m))
        }
        if (prev.some((m) => String(m._id) === String(message._id))) return prev
        return [...prev, message]
      })

      if (msgConvId === String(activeId) && senderUid !== currentUserId) {
        chatAPI.markRead(activeId).catch(() => {})
        socket.emit('message_read', { conversationId: activeId })
      }
    })

    socket.on('conversation_updated', (updatedConv) => {
      upsertConversation(updatedConv)
      if (isOwner) {
        setOwnerAllConversations((prev) => [
          updatedConv,
          ...prev.filter((c) => String(c._id) !== String(updatedConv._id)),
        ])
      }
    })

    socket.on('messages_marked_read', ({ conversationId, userId: readerId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m.conversation) === String(conversationId)) {
            const hasRead = (m.readBy || []).some((r) => getUserId(r.user || r) === String(readerId))
            if (!hasRead) {
              return {
                ...m,
                readBy: [...(m.readBy || []), { user: readerId, readAt: new Date().toISOString() }],
              }
            }
          }
          return m
        })
      )
    })

    socket.on('typing_start', ({ conversationId, userName }) =>
      setTypingUsers((prev) => ({ ...prev, [conversationId]: userName || 'Someone' }))
    )

    socket.on('typing_stop', ({ conversationId }) =>
      setTypingUsers((prev) => {
        const next = { ...prev }
        delete next[conversationId]
        return next
      })
    )

    socket.on('user_online', ({ userId: uid }) =>
      setOnlineUsers((prev) => new Set([...prev, String(uid)]))
    )

    socket.on('user_offline', ({ userId: uid }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(String(uid))
        return next
      })
    )

    socket.on('message_error', ({ error }) => showToast(error || 'Message delivery failed'))

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [activeId, currentUserId, isOwner, showToast, upsertConversation])

  const loadMessages = useCallback(
    async (conversationId, before = '') => {
      if (!conversationId) return
      setMessagesLoading(true)
      try {
        const res = await chatAPI.getMessages(conversationId, { before, limit: 30 })
        setMessages((prev) => (before ? [...(res.messages || []), ...prev] : res.messages || []))
        setHasMore(Boolean(res.hasMore))

        await chatAPI.markRead(conversationId).catch(() => {})
        socketRef.current?.emit('join_conversation', { conversationId })
        socketRef.current?.emit('message_read', { conversationId })

        setConversations((prev) =>
          prev.map((c) => (String(c._id) === String(conversationId) ? { ...c, myUnread: 0 } : c))
        )
      } catch (err) {
        showToast(err.message || 'Failed to load messages')
      } finally {
        setMessagesLoading(false)
      }
    },
    [showToast]
  )

  useEffect(() => {
    if (!activeId) return
    setMessages([])
    loadMessages(activeId)
    return () => socketRef.current?.emit('leave_conversation', { conversationId: activeId })
  }, [activeId, loadMessages])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, activeId])

  async function handleSendMessage(e) {
    e?.preventDefault?.()
    const cleanDraft = draft.trim()
    if (!cleanDraft && !selectedFile) return
    if (!activeId) return

    setSending(true)
    const tempId = `temp-${Date.now()}`

    let attachments = []
    if (selectedFile) {
      setUploadingFile(true)
      try {
        const uploadRes = await uploadAPI.image(selectedFile)
        attachments = [{ url: uploadRes.url || uploadRes.imageUrl, filename: selectedFile.name }]
      } catch (uploadErr) {
        showToast(uploadErr.message || 'File upload failed')
        setUploadingFile(false)
        setSending(false)
        return
      }
      setUploadingFile(false)
    }

    const optimisticMessage = {
      _id: tempId,
      tempId,
      conversation: activeId,
      sender: user,
      senderName: user.name,
      senderRole: user.role,
      type: attachments.length > 0 ? 'image' : 'text',
      text: cleanDraft,
      attachments,
      createdAt: new Date().toISOString(),
      readBy: [{ user: currentUserId, readAt: new Date().toISOString() }],
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setDraft('')
    setSelectedFile(null)
    setFilePreview('')

    socketRef.current?.emit('typing_stop', { conversationId: activeId })

    try {
      const res = await chatAPI.sendMessage({
        conversationId: activeId,
        text: cleanDraft,
        type: attachments.length > 0 ? 'image' : 'text',
        attachments,
        tempId,
      })

      if (res?.message) {
        setMessages((prev) => prev.map((m) => (m.tempId === tempId ? res.message : m)))
      }
    } catch (err) {
      showToast(err.message || 'Failed to send message')
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId))
    } finally {
      setSending(false)
    }
  }

  async function startChatWithUser(targetUser) {
    try {
      const { conversation } = await chatAPI.getOrCreateConversation({
        participantId: targetUser._id,
      })
      if (conversation) {
        upsertConversation(conversation)
        setActiveId(String(conversation._id))
        setShowNewChatModal(false)
        setMobileShowChat(true)
      }
    } catch (err) {
      showToast(err.message || 'Failed to start chat')
    }
  }

  async function handleResolveActiveConversation() {
    if (!activeId) return
    try {
      await chatAPI.resolveConversation(activeId, { resolutionNote: `Resolved by ${user.name} (${user.role})` })
      showToast('✅ Ticket / dispute resolved')
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeId)
            ? { ...c, supportStatus: 'resolved', resolvedByName: user.name }
            : c
        )
      )
      setOwnerAllConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeId)
            ? { ...c, supportStatus: 'resolved', resolvedByName: user.name }
            : c
        )
      )
      loadConversations()
    } catch (err) {
      showToast(err.message || 'Failed to resolve conversation')
    }
  }

  async function handleCloseActiveConversation() {
    if (!activeId) return
    try {
      await chatAPI.closeConversation(activeId, { closeNote: `Closed by ${user.name} (${user.role})` })
      showToast('🔒 Ticket closed & archived')
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeId)
            ? { ...c, supportStatus: 'closed', resolvedByName: user.name }
            : c
        )
      )
      setOwnerAllConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeId)
            ? { ...c, supportStatus: 'closed', resolvedByName: user.name }
            : c
        )
      )
      loadConversations()
    } catch (err) {
      showToast(err.message || 'Failed to close conversation')
    }
  }

  async function handleReopenActiveConversation() {
    if (!activeId) return
    try {
      await chatAPI.reopenConversation(activeId, { reason: `Reopened by ${user.name}` })
      showToast('🔄 Conversation reopened')
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeId)
            ? { ...c, supportStatus: 'human_active' }
            : c
        )
      )
      setOwnerAllConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeId)
            ? { ...c, supportStatus: 'human_active' }
            : c
        )
      )
      loadConversations()
    } catch (err) {
      showToast(err.message || 'Failed to reopen conversation')
    }
  }

  async function handleDeleteActiveConversation() {
    if (!activeId) return
    const removedId = activeId
    try {
      await chatAPI.clearConversation(removedId)
      showToast('🗑️ Conversation deleted successfully')
      setShowDeleteModal(false)
      setActiveId('')
      setMessages([])
      setConversations((prev) => prev.filter((c) => String(c._id) !== String(removedId)))
      setOwnerAllConversations((prev) => prev.filter((c) => String(c._id) !== String(removedId)))
      loadConversations()
    } catch (err) {
      showToast(err.message || 'Failed to delete conversation')
    }
  }

  const availableContacts = useMemo(() => {
    const list = isStaff ? (activeTab === 'staff' ? staffList : customerList) : staffList
    const q = newChatSearch.trim().toLowerCase()
    return list.filter((u) => {
      if (getUserId(u) === currentUserId) return false
      if (!q) return true
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    })
  }, [isStaff, activeTab, staffList, customerList, currentUserId, newChatSearch])

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col ${compact ? 'h-[620px]' : 'h-[80vh] min-h-[580px]'}`}>
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar: Human Conversation List ────────────────── */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center font-black shadow-xs">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-ink uppercase tracking-wider">Messages</h2>
                  <p className="text-[10px] text-muted font-semibold">Direct Human Store Chat</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="h-7 px-2.5 rounded-lg bg-brand text-white text-[11px] font-bold flex items-center gap-1 hover:bg-brand-600 transition-colors shadow-2xs"
                  title="New conversation"
                >
                  <UserPlus size={13} /> New
                </button>
                <button
                  onClick={loadConversations}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand hover:border-brand transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Staff Tabs */}
            {isStaff && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-2.5">
                <button
                  onClick={() => {
                    setActiveTab('inquiries')
                    setTicketFilter('all')
                  }}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white text-ink shadow-2xs' : 'text-slate-600 hover:text-ink'}`}
                >
                  Customers
                </button>
                <button
                  onClick={() => {
                    setActiveTab('staff')
                    setTicketFilter('all')
                  }}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'staff' ? 'bg-white text-ink shadow-2xs' : 'text-slate-600 hover:text-ink'}`}
                >
                  Staff Direct
                </button>
                <button
                  onClick={() => {
                    setActiveTab('audit')
                    setTicketFilter('all')
                  }}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'audit' ? 'bg-white text-ink shadow-2xs' : 'text-slate-600 hover:text-ink'}`}
                >
                  All Store Chats
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            {/* Mini Category Filter Pills for Active / Resolved / Closed Tickets */}
            {(activeTab === 'audit' || (isStaff && activeTab === 'inquiries')) && (
              <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl mt-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setTicketFilter('all')}
                  className={`flex-1 min-w-[50px] py-1 px-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
                    ticketFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  <span>All</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${ticketFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {ticketCounts.all}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('active')}
                  className={`flex-1 min-w-[65px] py-1 px-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
                    ticketFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>Active</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${ticketFilter === 'active' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {ticketCounts.active}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('resolved')}
                  className={`flex-1 min-w-[70px] py-1 px-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
                    ticketFilter === 'resolved'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
                  }`}
                >
                  <span>Resolved</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${ticketFilter === 'resolved' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    {ticketCounts.resolved}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('closed')}
                  className={`flex-1 min-w-[62px] py-1 px-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
                    ticketFilter === 'closed'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  <span>Closed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${ticketFilter === 'closed' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {ticketCounts.closed}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading && (
              <div className="p-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-brand" />
                <span>Loading conversations...</span>
              </div>
            )}

            {!loading && filteredConversations.length === 0 && (
              <div className="p-8 text-center text-xs text-muted space-y-2">
                <MessageCircle size={28} className="mx-auto text-slate-300" />
                <p className="font-bold text-ink">
                  {ticketFilter === 'all'
                    ? 'No conversations yet'
                    : `No ${ticketFilter} tickets found`}
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="text-xs text-brand font-bold hover:underline"
                >
                  Start a direct chat with store staff
                </button>
              </div>
            )}

            {filteredConversations.map((c) => {
              const isSelected = String(c._id) === String(activeId)
              const hasUnread = (c.myUnread || 0) > 0
              const other = (c.participants || []).find((p) => getUserId(p) !== currentUserId) || c.participants?.[0]
              const isOnline = onlineUsers.has(getUserId(other))
              const isOfficialAiBotChat = Boolean(c.isSupport && c.aiHandled)
              const isCustomerView = !isStaff
              const isResolved = c.supportStatus === 'resolved'
              const isClosed = c.supportStatus === 'closed'

              const chatTitle = (isOfficialAiBotChat && isCustomerView)
                ? (c.orderRef ? `AutoGenuine AI • Order #${c.orderRef}` : 'AutoGenuine AI Assistant')
                : (other?.name || other?.email || 'Direct Conversation')

              return (
                <button
                  key={c._id}
                  onClick={() => {
                    setActiveId(String(c._id))
                    setMobileShowChat(true)
                  }}
                  className={`w-full text-left p-3.5 transition-all flex items-start gap-3 border-l-4 ${
                    isSelected
                      ? 'bg-white border-l-brand shadow-xs'
                      : 'bg-transparent border-l-transparent hover:bg-slate-100/60'
                  }`}
                >
                  {isOfficialAiBotChat && isCustomerView ? (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0 ring-2 ring-amber-400/20">
                      <Sparkles size={18} />
                    </div>
                  ) : (
                    <UserAvatar user={other} online={isOnline} />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="text-xs font-black text-ink truncate flex items-center gap-1">
                        {isOfficialAiBotChat && <Sparkles size={12} className="text-amber-500 shrink-0" />}
                        <span className="truncate">{chatTitle}</span>
                      </p>
                      <span className="text-[10px] text-muted font-semibold shrink-0">
                        {formatTime(c.lastMessage?.createdAt || c.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-1 mb-1.5 font-medium">
                      {c.lastMessage?.text || (isOfficialAiBotChat ? 'AI Support Session' : 'Conversation started')}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isOfficialAiBotChat ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black uppercase tracking-wider border border-amber-200">
                          ✨ AutoGenuine AI
                        </span>
                      ) : (
                        <RoleBadge role={other?.role} />
                      )}
                      {c.orderRef && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          #{c.orderRef}
                        </span>
                      )}
                      {isResolved ? (
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold border border-blue-200">
                          ✅ Resolved
                        </span>
                      ) : isClosed ? (
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold border border-slate-300">
                          🔒 Closed
                        </span>
                      ) : (c.isSupport || c.escalated) ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Ticket
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {hasUnread && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[9px] font-black flex items-center justify-center shrink-0">
                      {c.myUnread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Quick AI Support Floating Prompt */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <button
              onClick={() => navigate('support')}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black tracking-wider transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles size={14} /> OPEN AI SUPPORT CHATBOT
            </button>
          </div>
        </div>

        {/* ── Right Panel: Chat Active View ────────────────── */}
        <div className={`flex-1 flex flex-col bg-slate-50/30 min-w-0 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation && otherParticipant ? (
            <>
              {/* Chat Top Header */}
              <div className="px-4 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-ink rounded-lg"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  {activeConversation.isSupport && activeConversation.aiHandled && !isStaff ? (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0 ring-2 ring-amber-400/20">
                      <Sparkles size={20} />
                    </div>
                  ) : (
                    <UserAvatar
                      user={otherParticipant}
                      online={onlineUsers.has(getUserId(otherParticipant))}
                    />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-black text-ink truncate">
                        {activeConversation.isSupport && activeConversation.aiHandled && !isStaff
                          ? 'AutoGenuine AI Support'
                          : otherParticipant.name || otherParticipant.email || 'Direct Conversation'}
                      </h3>
                      {activeConversation.isSupport && activeConversation.aiHandled ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black uppercase tracking-wider border border-amber-200">
                          ✨ AutoGenuine AI
                        </span>
                      ) : (
                        <RoleBadge role={otherParticipant.role} />
                      )}
                    </div>

                    <p className="text-[11px] text-muted flex items-center gap-2 truncate">
                      {activeConversation.isSupport && activeConversation.aiHandled && !isStaff ? (
                        <span className="text-emerald-600 font-bold">● Active 24/7</span>
                      ) : (
                        <span>{onlineUsers.has(getUserId(otherParticipant)) ? 'Active now' : 'Offline'}</span>
                      )}
                      {activeConversation.orderRef && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => navigate('track', { ref: activeConversation.orderRef })}
                            className="text-brand hover:underline flex items-center gap-0.5 font-bold"
                          >
                            <Package size={11} /> Order #{activeConversation.orderRef} <ExternalLink size={9} />
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Support Ticket Actions for Staff */}
                  {isStaff && (activeConversation.isSupport || activeConversation.escalated || activeTab === 'audit') && (
                    <>
                      {activeConversation.supportStatus === 'closed' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 text-[10px] font-black uppercase flex items-center gap-1 border border-slate-300">
                            <Lock size={11} className="text-slate-600" /> Closed
                          </span>
                          <button
                            onClick={handleReopenActiveConversation}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                            title="Reopen conversation"
                          >
                            <RotateCcw size={12} /> Reopen
                          </button>
                        </div>
                      ) : activeConversation.supportStatus === 'resolved' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[10px] font-black uppercase flex items-center gap-1 border border-blue-200">
                            <CheckCircle2 size={12} className="text-blue-600" /> Resolved
                          </span>
                          <button
                            onClick={handleCloseActiveConversation}
                            className="h-8 px-2.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                            title="Close & archive ticket"
                          >
                            <Lock size={12} /> Close Ticket
                          </button>
                          <button
                            onClick={handleReopenActiveConversation}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                            title="Reopen conversation"
                          >
                            <RotateCcw size={12} /> Reopen
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleResolveActiveConversation}
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black tracking-wider transition-colors flex items-center gap-1 shadow-xs"
                            title="Mark ticket resolved"
                          >
                            <CheckCircle2 size={13} /> Resolve
                          </button>
                          <button
                            onClick={handleCloseActiveConversation}
                            className="h-8 px-2.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                            title="Close & archive ticket"
                          >
                            <Lock size={12} /> Close Ticket
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Delete / Clear Chat from My View Button */}
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 text-[11px] font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="Delete this chat from your view"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline">Delete Chat</span>
                  </button>

                  <button
                    onClick={() => navigate('support', { orderRef: activeConversation.orderRef })}
                    className="h-8 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-black tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles size={13} className="text-amber-600" /> Open AI Assistant
                  </button>
                </div>
              </div>

              {/* AI Escalation Summary Banner (If transferred from AI) */}
              {activeConversation.aiSummary && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 p-3 px-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-900 flex items-center gap-1 text-[11px]">
                        <Sparkles size={13} className="text-amber-600" /> AI Diagnostic Summary
                      </span>
                      {activeConversation.priority && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-black uppercase">
                          {activeConversation.priority} Priority
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-[11px]">
                      {activeConversation.aiSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {hasMore && (
                  <div className="text-center pb-2">
                    <button
                      onClick={() => loadMessages(activeId, messages[0]?._id)}
                      disabled={messagesLoading}
                      className="px-3 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:text-brand transition-colors"
                    >
                      {messagesLoading ? 'Loading earlier messages...' : 'Load earlier messages'}
                    </button>
                  </div>
                )}

                {messages.map((m) => {
                  const isMe = getUserId(m.sender) === currentUserId && !m.isAI && m.senderRole !== 'ai'
                  const isSystem = m.type === 'system' || m.senderRole === 'system'

                  if (isSystem) {
                    return (
                      <div key={m._id || m.tempId} className="text-center my-2 animate-fade-in">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                          {m.text}
                        </span>
                      </div>
                    )
                  }

                  const isAI = m.isAI || m.senderRole === 'ai'
                  const senderUser = typeof m.sender === 'object' && m.sender ? m.sender : (isMe ? user : otherParticipant)
                  const senderRole = m.senderRole || senderUser?.role || 'user'

                  return (
                    <div
                      key={m._id || m.tempId}
                      className={`flex items-start gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {isAI ? (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0 mt-0.5">
                          <Sparkles size={16} />
                        </div>
                      ) : (
                        <UserAvatar
                          user={senderUser}
                          size="w-8 h-8"
                          textSize="text-[11px]"
                        />
                      )}

                      <div className={`space-y-1 min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {isAI ? (
                            <>
                              <span className="text-xs font-black text-ink">AutoGenuine AI</span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                                Specialist
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-bold text-ink truncate">
                                {isMe ? 'You' : (m.senderName || senderUser?.name || 'User')}
                              </span>
                              {senderRole === 'owner' && !isMe && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                                  👑 Store Owner
                                </span>
                              )}
                              {senderRole === 'admin' && !isMe && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                                  ⚡ Admin
                                </span>
                              )}
                            </>
                          )}
                          <span className="text-[10px] text-muted">{formatMessageTime(m.createdAt)}</span>
                        </div>

                        {/* Attachments */}
                        {m.attachments?.length > 0 && (
                          <div className="grid grid-cols-1 gap-2">
                            {m.attachments.map((att, idx) => (
                              <img
                                key={idx}
                                src={att.url}
                                alt="Attachment"
                                onClick={() => setZoomImage(att.url)}
                                className="max-w-xs max-h-60 rounded-xl object-cover cursor-pointer border border-slate-200 hover:opacity-95 transition-opacity"
                              />
                            ))}
                          </div>
                        )}

                        {m.text && (
                          <div
                            className={`p-3.5 rounded-2xl shadow-2xs ${
                              isMe
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-tr-sm'
                                : 'bg-white border border-slate-200/90 text-ink rounded-tl-sm'
                            }`}
                          >
                            <FormattedMessage
                              text={m.text}
                              isAI={m.isAI || m.senderRole === 'ai'}
                              productData={m.aiMetadata?.productData}
                              onOrderClick={(ref) => navigate('track', { ref })}
                            />
                          </div>
                        )}

                        {/* Read receipts */}
                        {isMe && (
                          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pr-1">
                            {(m.readBy || []).length > 1 ? (
                              <span className="flex items-center gap-0.5 text-brand font-bold">
                                <CheckCheck size={12} /> Read
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Check size={12} /> Sent
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Typing Indicator */}
                {typingUsers[activeId] && (
                  <div className="text-[11px] text-muted italic flex items-center gap-1.5 pl-2">
                    <Clock size={11} /> {typingUsers[activeId]} is typing...
                  </div>
                )}

                <div ref={messageEndRef} />
              </div>

              {/* Resolved / Closed / Reopen Requested Support Ticket Action Banner */}
              {(activeConversation.supportStatus === 'resolved' || activeConversation.supportStatus === 'closed' || activeConversation.supportStatus === 'reopen_requested') && (
                <div className={`border-t p-3.5 px-4 flex items-center justify-between gap-3 flex-wrap animate-fade-in ${
                  activeConversation.supportStatus === 'closed'
                    ? 'bg-slate-100/90 border-slate-300'
                    : activeConversation.supportStatus === 'reopen_requested'
                    ? 'bg-amber-50/90 border-amber-200'
                    : 'bg-emerald-50/90 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      activeConversation.supportStatus === 'closed'
                        ? 'bg-slate-200 border-slate-300 text-slate-700'
                        : activeConversation.supportStatus === 'reopen_requested'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                    }`}>
                      {activeConversation.supportStatus === 'closed' ? <Lock size={16} /> : activeConversation.supportStatus === 'reopen_requested' ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                    </div>
                    <div className="text-xs min-w-0">
                      <p className="font-bold text-ink truncate">
                        {activeConversation.supportStatus === 'closed'
                          ? '🔒 Support ticket closed & archived.'
                          : activeConversation.supportStatus === 'reopen_requested'
                          ? '⏳ Reopen Request Submitted • Awaiting Staff Approval'
                          : '✅ This support dispute / ticket is resolved & archived.'}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {activeConversation.supportStatus === 'reopen_requested'
                          ? 'Our support team has been alerted and will review your reopen request.'
                          : (activeConversation.resolutionNote || (activeConversation.supportStatus === 'closed' ? 'Closed by support staff' : 'Resolved by support team'))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => generateChatTranscriptPdf(activeConversation, messages)}
                      className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Download printable PDF chat transcript"
                    >
                      <Download size={13} />
                      <span>PDF Transcript</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadChatTranscriptWord(activeConversation, messages)}
                      className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Download Word (.doc) chat transcript"
                    >
                      <FileText size={13} />
                      <span>Word (.doc)</span>
                    </button>

                    {isStaff ? (
                      <button
                        type="button"
                        onClick={handleReopenActiveConversation}
                        className="h-8 px-3.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-black tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
                        title="Approve & reopen this ticket"
                      >
                        <RotateCcw size={13} />
                        <span>{activeConversation.supportStatus === 'reopen_requested' ? 'Approve & Reopen' : 'Reopen Ticket'}</span>
                      </button>
                    ) : (
                      <>
                        {activeConversation.supportStatus !== 'reopen_requested' && (
                          <button
                            type="button"
                            onClick={handleReopenActiveConversation}
                            className="h-8 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-black tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
                            title="Submit request to reopen ticket"
                          >
                            <RotateCcw size={13} />
                            <span>Request Reopen</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleDeleteActiveConversation}
                          className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-bold transition-colors flex items-center gap-1"
                          title="Dismiss and remove from your inbox"
                        >
                          <Trash2 size={13} />
                          <span>Close &amp; Dismiss</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Message Input Bottom Box (Only enabled when conversation is active) */}
              {['resolved', 'closed'].includes(activeConversation.supportStatus) ? (
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/80 text-slate-800 text-xs font-bold mb-2">
                    <Lock size={14} className="text-slate-600 shrink-0" />
                    <span>This support ticket is closed and resolved.</span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                    Messaging is disabled for resolved tickets. If you need further assistance, you can submit a request to reopen this ticket.
                  </p>
                  {!isStaff && (
                    <button
                      type="button"
                      onClick={handleReopenActiveConversation}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shadow-xs active:scale-95"
                    >
                      <RotateCcw size={14} />
                      <span>Request to Reopen Ticket</span>
                    </button>
                  )}
                </div>
              ) : activeConversation.supportStatus === 'reopen_requested' ? (
                <div className="p-4 bg-amber-50 border-t border-amber-200 text-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
                    <RotateCcw size={14} className="text-amber-600 shrink-0 animate-spin" />
                    <span>Reopen Request Submitted</span>
                  </div>
                  <p className="text-xs text-amber-700 max-w-md mx-auto font-medium">
                    Your request to reopen this support ticket has been sent to store staff. Messaging will unlock as soon as staff approves it.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200">
                {filePreview && (
                  <div className="relative inline-block mb-2">
                    <img src={filePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setFilePreview('')
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedFile(file)
                        setFilePreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:text-brand hover:border-brand flex items-center justify-center transition-colors shrink-0"
                    title="Attach image"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={
                        isListening
                          ? '🎙️ Listening... speak in English or Urdu now!'
                          : 'Type your message...'
                      }
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value)
                        socketRef.current?.emit('typing_start', { conversationId: activeId })
                      }}
                      onBlur={() => socketRef.current?.emit('typing_stop', { conversationId: activeId })}
                      className={`w-full h-11 pl-4 pr-11 rounded-xl border text-xs sm:text-sm transition-all ${
                        isListening
                          ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-400/30'
                          : 'border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand'
                      }`}
                    />

                    {/* Microphone Dictation Button */}
                    <button
                      type="button"
                      onClick={handleToggleSpeechInput}
                      title={isListening ? 'Stop listening' : 'Voice input (Speak message)'}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isListening
                          ? 'bg-orange-500 text-white animate-pulse shadow-xs'
                          : 'hover:bg-slate-200/70 text-slate-500 hover:text-amber-600'
                      }`}
                    >
                      {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={sending || uploadingFile || (!draft.trim() && !selectedFile)}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 shrink-0"
                  >
                    {sending || uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span className="hidden sm:inline">SEND</span>
                  </button>
                </div>
              </form>
            )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-base font-black text-ink mb-1">Select a Conversation</h3>
              <p className="text-xs max-w-sm mb-4">
                Choose a conversation from the sidebar or click "New" to start a direct message with store staff.
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="h-10 px-5 rounded-xl bg-brand text-white text-xs font-black flex items-center gap-2 shadow-xs"
              >
                <UserPlus size={14} /> New Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── New Conversation Modal ──────────────────────── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-ink flex items-center gap-2">
                <UserPlus size={18} className="text-brand" /> Start Direct Chat
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff or customers..."
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl">
              {availableContacts.length === 0 && (
                <p className="p-4 text-center text-xs text-muted">No contacts found</p>
              )}
              {availableContacts.map((u) => (
                <button
                  key={u._id}
                  onClick={() => startChatWithUser(u)}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <UserAvatar user={u} online={onlineUsers.has(getUserId(u))} size="w-9 h-9" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-ink truncate">{u.name}</p>
                    <p className="text-[11px] text-muted truncate">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Conversation Modal ────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 size={20} />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="font-black text-ink text-base">Delete Conversation</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Remove this chat from your inbox? It will disappear from your view, while remaining securely stored in the store audit records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteActiveConversation}
                className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
              >
                Delete from Inbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Zoom Image Modal ─────────────────────────────── */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={zoomImage} alt="Enlarged view" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      )}
    </div>
  )
}
