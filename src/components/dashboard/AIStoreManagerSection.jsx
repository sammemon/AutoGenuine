import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  Trash2,
  X,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Package,
  Layers,
  FileText,
  DollarSign,
  ShieldAlert,
  Mic,
  MicOff,
  ExternalLink,
  ChevronRight,
  History,
  Check,
  Tag,
  Zap,
  Activity,
  Boxes,
  Download,
  FileSpreadsheet,
  FileCode,
  Sliders,
  Play,
  CheckSquare,
  Bot,
  Power,
  RefreshCw,
} from 'lucide-react'
import { aiStoreManager as aiAPI, upload as uploadAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNav } from '../../context/NavContext'
import FormattedMessage from '../chat/FormattedMessage'
import { generateExecutiveReportPdf, downloadReportCsv, downloadReportWord } from '../../utils/generateExecutiveReportPdf'

export default function AIStoreManagerSection({ setSection }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { navigate } = useNav()

  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isAITyping, setIsAITyping] = useState(false)

  // Uploaded media & file attachments
  const [uploadedImage, setUploadedImage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [spreadsheetFile, setSpreadsheetFile] = useState(null)
  const [spreadsheetData, setSpreadsheetData] = useState([])

  // Action history drawer
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [actionHistory, setActionHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Auto-Pilot (Owner Away) modal state
  const [showAutoPilotModal, setShowAutoPilotModal] = useState(false)
  const [autoPilotSettings, setAutoPilotSettings] = useState({
    enabled: false,
    autoConfirmOrders: true,
    autoDispatchOrders: false,
    maxAutoOrderValue: 250000,
    autoRestockAlertThreshold: 5,
    aiAutoCustomerSupport: true,
    dailyDigestSummary: true,
    logs: [],
  })
  const [savingAutoPilot, setSavingAutoPilot] = useState(false)
  const [runningAutoPilot, setRunningAutoPilot] = useState(false)

  // Speech recognition & DOM refs
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const spreadsheetInputRef = useRef(null)

  // Quick executive prompt chips
  const EXECUTIVE_PROMPTS = [
    { label: "📈 Today's Sales Pace", prompt: "How are today's sales and revenue compared to yesterday?", icon: TrendingUp },
    { label: "🔥 Top-Selling Parts", prompt: "What are our best-selling OEM parts and products this month?", icon: Zap },
    { label: "⚠️ Low Stock & Restock", prompt: "Which products are critical low on stock and how much should we reorder?", icon: AlertTriangle },
    { label: "🚚 Orders Needing Dispatch", prompt: "Show me all orders currently waiting in pending or processing status.", icon: ShoppingBag },
    { label: "📉 Slow-Moving Inventory", prompt: "Identify slow-moving products with high inventory and no sales in 30 days.", icon: Boxes },
    { label: "📑 Complete Business Report", prompt: "Generate a complete executive business performance report.", icon: FileText },
  ]

  // Load existing session and Auto-Pilot status on mount
  useEffect(() => {
    let cancelled = false
    setInitialLoading(true)

    Promise.all([
      aiAPI.getConversation().catch(() => ({})),
      aiAPI.getAutoPilot().catch(() => ({})),
    ])
      .then(([convRes, autoRes]) => {
        if (cancelled) return
        if (convRes?.conversation) {
          setConversationId(convRes.conversation._id)
          setMessages(convRes.conversation.messages || [])
        } else {
          setMessages([
            {
              _id: 'init-greeting',
              role: 'assistant',
              text: `👋 Greetings **${user?.name || 'Store Owner'}**. Welcome to the **AutoGenuine Executive AI Operations Command**.\n\nI am connected to your live store database with real-time analytics, bulk data ingestion, and autonomous operations:\n\n* 📊 **Sales Intelligence**: Real-time revenue summaries, growth rates, and period-over-period comparisons\n* 📄 **Direct PDF & CSV Reports**: Instant official audit downloads and spreadsheet exports\n* 📑 **Bulk Spreadsheet Ingestion**: Upload CSV or Excel product lists to automatically catalog and price parts\n* 🤖 **Autonomous Auto-Pilot**: Configure the store to run autonomously and fulfill orders while you are away\n\nHow may I assist your business strategy today?`,
              toolsUsed: [],
              createdAt: new Date().toISOString(),
            },
          ])
        }

        if (autoRes?.autoPilot) {
          setAutoPilotSettings((prev) => ({ ...prev, ...autoRes.autoPilot }))
        }
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isAITyping])

  function handleToggleSpeechInput() {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      showToast('Voice input is not supported in this browser. Try Chrome.')
      return
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US, ur-PK'

      recognition.onstart = () => {
        setIsListening(true)
        showToast('🎙️ Listening... speak your management request')
      }
      recognition.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join('')
        setDraft(transcript)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('Speech error:', err)
      setIsListening(false)
    }
  }

  async function handleImageUpload(file) {
    if (!file) return
    setUploadingImage(true)
    try {
      const res = await uploadAPI.image(file)
      if (res.url) {
        setUploadedImage(res.url)
        showToast('📷 Image attached. Gemini Vision will analyze details on send.')
      }
    } catch (err) {
      showToast(err.message || 'Image upload failed.')
    } finally {
      setUploadingImage(false)
    }
  }

  function handleSpreadsheetUpload(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        const lines = content.split(/\r?\n/).filter((l) => l.trim())
        if (lines.length <= 1) {
          showToast('File contains insufficient data rows.')
          return
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
        const parsedRows = []

        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
          if (cells.length === 0 || !cells[0]) continue

          const rowObj = {}
          headers.forEach((h, idx) => {
            rowObj[h] = cells[idx] || ''
          })

          parsedRows.push({
            name: rowObj.name || rowObj.title || rowObj.part || rowObj['product name'] || cells[0] || `Part #${i}`,
            categorySlug: (rowObj.category || rowObj.categoryslug || rowObj.type || 'general').toLowerCase().replace(/\s+/g, '-'),
            price: Number(rowObj.price || rowObj.cost || rowObj.mrp || 5000),
            stock: Number(rowObj.stock || rowObj.qty || rowObj.quantity || 10),
            fits: rowObj.fits || rowObj.fitment || rowObj.vehicle || '',
            oemNumber: rowObj.oem || rowObj.oemnumber || rowObj['oem part #'] || '',
            sku: rowObj.sku || `SKU-AUTO-${i}`,
          })
        }

        setSpreadsheetFile({ name: file.name, rowsCount: parsedRows.length })
        setSpreadsheetData(parsedRows)
        setDraft(`Please review and import the attached spreadsheet (${file.name}) containing ${parsedRows.length} automotive products into our catalog.`)
        showToast(`📊 Loaded ${parsedRows.length} items from ${file.name}!`)
      } catch (err) {
        showToast('Failed to parse spreadsheet file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  async function handleSend(customPrompt) {
    const text = (customPrompt || draft).trim()
    if ((!text && !uploadedImage && !spreadsheetFile) || loading) return

    const currentImg = uploadedImage
    const currentSpreadsheet = spreadsheetData
    const currentFileName = spreadsheetFile?.name || ''

    setDraft('')
    setUploadedImage('')
    setSpreadsheetFile(null)
    setSpreadsheetData([])
    setLoading(true)
    setIsAITyping(true)

    // Construct enriched prompt if spreadsheet attached
    let finalPrompt = text
    if (currentSpreadsheet.length > 0) {
      finalPrompt = `${text}\n\n[SPREADSHEET_DATA_JSON]:\n${JSON.stringify({
        sourceFileName: currentFileName,
        products: currentSpreadsheet.slice(0, 30),
      })}`
    }

    // Optimistic user turn
    const optId = `temp-${Date.now()}`
    const optMsg = {
      _id: optId,
      role: 'user',
      text: text || (currentImg ? 'Analyze uploaded image and create a product draft' : 'Process spreadsheet file'),
      imageUrl: currentImg,
      sourceFileName: currentFileName,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optMsg])

    try {
      const res = await aiAPI.chat({
        prompt: finalPrompt,
        imageUrl: currentImg,
        conversationId,
      })

      if (res.conversationId) setConversationId(res.conversationId)

      if (res.text) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `ai-${Date.now()}`,
            role: 'assistant',
            text: res.text,
            toolsUsed: res.toolsUsed || [],
            actionProposals: res.actionProposals || [],
            productDraft: res.productDraft || null,
            createdAt: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      showToast(err.message || 'AI Store Manager request failed.')
      setMessages((prev) => [
        ...prev,
        {
          _id: `err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Operational Notice**: ${err.message || 'I encountered an error connecting to store services. Please try again.'}`,
          toolsUsed: [],
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setIsAITyping(false)
      setLoading(false)
    }
  }

  async function handleExecuteAction(actionId) {
    if (!actionId) return
    try {
      const res = await aiAPI.executeAction(actionId)
      showToast('✅ Business action executed and recorded to Audit Log!')

      setMessages((prev) =>
        prev.map((m) => {
          if (!m.actionProposals) return m
          return {
            ...m,
            actionProposals: m.actionProposals.map((a) =>
              String(a.actionId) === String(actionId) ? { ...a, status: 'executed' } : a
            ),
          }
        })
      )
    } catch (err) {
      showToast(err.message || 'Failed to execute action.')
    }
  }

  async function handleRejectAction(actionId) {
    if (!actionId) return
    try {
      await aiAPI.rejectAction(actionId, 'Rejected by Store Owner')
      showToast('Action proposal rejected.')
      setMessages((prev) =>
        prev.map((m) => {
          if (!m.actionProposals) return m
          return {
            ...m,
            actionProposals: m.actionProposals.map((a) =>
              String(a.actionId) === String(actionId) ? { ...a, status: 'rejected' } : a
            ),
          }
        })
      )
    } catch (err) {
      showToast(err.message || 'Failed to reject action.')
    }
  }

  function loadActionHistory() {
    setHistoryLoading(true)
    aiAPI
      .getHistory()
      .then((res) => setActionHistory(res.actions || []))
      .catch((err) => showToast(err.message || 'Failed to load history.'))
      .finally(() => setHistoryLoading(false))
  }

  async function handleSaveAutoPilot() {
    setSavingAutoPilot(true)
    try {
      const res = await aiAPI.updateAutoPilot(autoPilotSettings)
      if (res.autoPilot) {
        setAutoPilotSettings(res.autoPilot)
      }
      showToast(
        autoPilotSettings.enabled
          ? '🚀 Auto-Pilot Mode activated! Store will run autonomously.'
          : 'Auto-Pilot Mode disabled.'
      )
      setShowAutoPilotModal(false)
    } catch (err) {
      showToast(err.message || 'Failed to update Auto-Pilot settings.')
    } finally {
      setSavingAutoPilot(false)
    }
  }

  async function handleRunAutoPilotNow() {
    setRunningAutoPilot(true)
    try {
      const res = await aiAPI.runAutoPilotNow()
      showToast(`Auto-Pilot cycle completed: ${res.result?.actionsExecuted || 0} automated actions executed!`)
      if (res.result?.logs) {
        setAutoPilotSettings((prev) => ({
          ...prev,
          logs: [...(res.result.logs || []), ...(prev.logs || [])].slice(0, 50),
        }))
      }
    } catch (err) {
      showToast(err.message || 'Auto-Pilot cycle failed.')
    } finally {
      setRunningAutoPilot(false)
    }
  }

  function handleDownloadReportPdf(msgText) {
    generateExecutiveReportPdf({
      title: 'AutoGenuine Store Executive Audit & Business Report',
      subtitle: 'Official Report generated by AutoGenuine AI Store Operations Manager',
      text: msgText || 'No report text available.',
      timeFrame: 'Store Operations',
    })
  }

  function handleOrderClick(orderRef) {
    if (!orderRef) return
    showToast(`Filtering orders for #${orderRef}...`)
    setSection('orders', { search: orderRef })
  }

  return (
    <div className="space-y-4 font-sans">
      {/* ── Executive Header Banner ────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 rounded-3xl p-5 text-white shadow-xl border border-amber-500/30 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-orange-500/20 shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                AutoGenuine AI Store Operations
              </h2>

              {/* AutoPilot Status Badge */}
              <button
                type="button"
                onClick={() => setShowAutoPilotModal(true)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all shadow-sm ${
                  autoPilotSettings.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    autoPilotSettings.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>Auto-Pilot: {autoPilotSettings.enabled ? 'ACTIVE (AWAY MODE)' : 'STANDBY'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Sales analytics, spreadsheet bulk ingestion, instant PDF/CSV exports &amp; autonomous store fulfillment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto-Pilot Config Button */}
          <button
            type="button"
            onClick={() => setShowAutoPilotModal(true)}
            className="h-9 px-3.5 rounded-xl border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm backdrop-blur-xs"
          >
            <Bot size={15} className="text-amber-400" />
            <span>Auto-Pilot Settings</span>
          </button>

          {/* Action History Button */}
          <button
            type="button"
            onClick={() => {
              setShowHistoryDrawer(true)
              loadActionHistory()
            }}
            className="h-9 px-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm backdrop-blur-xs"
          >
            <History size={14} className="text-amber-400" />
            <span>Action Audit Log</span>
          </button>

          {/* New Session Button */}
          <button
            type="button"
            onClick={() => {
              setMessages([
                {
                  _id: `greeting-${Date.now()}`,
                  role: 'assistant',
                  text: 'New session started. How can I assist your business operations, report generation, or bulk catalog import today?',
                  toolsUsed: [],
                  createdAt: new Date().toISOString(),
                },
              ])
              setConversationId('')
              showToast('Started new AI Store Manager session')
            }}
            className="h-9 px-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm backdrop-blur-xs"
          >
            <RotateCcw size={13} />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* ── Main Chat Stream Container ─────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg flex flex-col min-h-[640px] h-[74vh] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {initialLoading && (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-orange-500" />
              <span className="font-bold">Connecting to AutoGenuine AI Engine...</span>
            </div>
          )}

          {messages.map((m) => {
            const isAI = m.role === 'assistant' || m.role === 'system'

            if (isAI) {
              return (
                <div key={m._id} className="flex items-start gap-3.5 max-w-4xl mr-auto animate-fade-in">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-amber-950 text-amber-400 flex items-center justify-center font-black shadow-md shrink-0 mt-0.5 border border-amber-500/30">
                    <Sparkles size={18} />
                  </div>

                  <div className="space-y-3 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">AI Store Manager</span>
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
                          Executive Operations
                        </span>
                      </div>

                      {/* 1-Click PDF & CSV Download Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadReportPdf(m.text)}
                          title="Generate and download official PDF report"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-900 border border-slate-200 text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Download size={12} className="text-orange-600" />
                          <span>PDF Report</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadReportWord('autogenuine-report.doc', m.text, 'AutoGenuine Store Audit Report')}
                          title="Export as Microsoft Word document"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 border border-slate-200 text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <FileText size={12} className="text-blue-600" />
                          <span>Word Doc</span>
                        </button>
                      </div>
                    </div>

                    {/* Tool Badges */}
                    {m.toolsUsed?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.toolsUsed.map((tool, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold shadow-2xs"
                          >
                            <Zap size={11} className="text-orange-500" />
                            <span>{tool.replace(/_/g, ' ')}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Text Message Content */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3">
                      <FormattedMessage text={m.text} onOrderClick={handleOrderClick} isAI={true} />
                    </div>

                    {/* Interactive Product Draft Preview Card */}
                    {m.productDraft && (
                      <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-300 shadow-md space-y-4 animate-scale-in">
                        <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                          <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                            🚗 Product Listing Draft
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                            Owner Approval Required
                          </span>
                        </div>

                        <div className="flex items-start gap-4">
                          {m.productDraft.image ? (
                            <img
                              src={m.productDraft.image}
                              alt=""
                              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 bg-white shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                              <Package size={28} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <h4 className="font-black text-sm sm:text-base text-slate-900">{m.productDraft.name}</h4>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 font-bold">
                              <span className="text-orange-600 font-black text-sm">
                                Rs {Number(m.productDraft.price || 0).toLocaleString()}
                              </span>
                              <span>•</span>
                              <span>Category: <strong className="text-slate-900">{m.productDraft.categorySlug}</strong></span>
                              <span>•</span>
                              <span>Initial Stock: <strong className="text-slate-900">{m.productDraft.stock} units</strong></span>
                            </div>
                            {m.productDraft.fits && (
                              <p className="text-xs text-slate-500 font-medium">Fitment: {m.productDraft.fits}</p>
                            )}
                          </div>
                        </div>

                        {m.productDraft.description && (
                          <div className="text-xs text-slate-700 bg-white/90 p-3.5 rounded-2xl border border-amber-200/80 leading-relaxed space-y-1 font-medium">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              AI Generated Description
                            </span>
                            <p>{m.productDraft.description}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Action Approval Proposal Cards */}
                    {m.actionProposals?.map((action, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-3xl border shadow-md space-y-3.5 animate-scale-in ${
                          action.status === 'executed'
                            ? 'bg-emerald-50/80 border-emerald-300'
                            : action.status === 'rejected'
                            ? 'bg-slate-100 border-slate-300 opacity-60'
                            : action.riskLevel === 'high'
                            ? 'bg-rose-50/90 border-rose-300'
                            : 'bg-amber-50/90 border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                              action.riskLevel === 'high'
                                ? 'bg-rose-200 text-rose-900'
                                : action.riskLevel === 'medium'
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-emerald-200 text-emerald-900'
                            }`}
                          >
                            {action.riskLevel === 'high' ? <ShieldAlert size={13} /> : <AlertTriangle size={13} />}
                            <span>{action.riskLevel} Risk Proposal</span>
                          </span>

                          <span className="text-xs font-black capitalize text-slate-800">
                            Status: <strong className="uppercase">{action.status.replace('_', ' ')}</strong>
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900">{action.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">{action.description}</p>
                        </div>

                        {/* Bulk Ingestion Preview Table */}
                        {action.actionType === 'bulk_import_products' && action.payload?.products && (
                          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white text-xs">
                            <div className="bg-slate-900 text-white px-3 py-2 font-bold text-[11px] flex items-center justify-between">
                              <span>Spreadsheet Preview ({action.payload.products.length} items)</span>
                              <button
                                type="button"
                                onClick={() =>
                                  downloadReportCsv(
                                    'catalog-import.csv',
                                    action.payload.products,
                                    ['name', 'categorySlug', 'price', 'stock', 'fits', 'oemNumber', 'sku']
                                  )
                                }
                                className="text-amber-400 hover:text-amber-300 text-[10px] flex items-center gap-1"
                              >
                                <Download size={11} /> Export CSV
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                              {action.payload.products.slice(0, 10).map((p, pIdx) => (
                                <div key={pIdx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                                  <div className="min-w-0">
                                    <p className="font-black text-slate-900 truncate">{p.name}</p>
                                    <p className="text-[10px] text-slate-500">Category: {p.categorySlug} • Fitment: {p.fits || 'Universal'}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="font-black text-orange-600">Rs {Number(p.price).toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-500">{p.stock} in stock</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Proposal Actions */}
                        {action.status === 'pending_approval' && (
                          <div className="flex items-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleExecuteAction(action.actionId)}
                              className="h-9 px-5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-black tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                            >
                              <Check size={15} />
                              <span>
                                {action.actionType === 'bulk_import_products'
                                  ? 'Approve & Import All to Store'
                                  : 'Approve & Execute'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectAction(action.actionId)}
                              className="h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {action.status === 'executed' && (
                          <div className="flex items-center gap-2 text-xs font-black text-emerald-800 bg-emerald-100/80 p-2.5 rounded-xl border border-emerald-300 w-fit">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            <span>Successfully executed &amp; recorded to Audit Log</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            // User Turn
            return (
              <div key={m._id} className="flex items-start gap-3 max-w-2xl ml-auto justify-end animate-fade-in">
                <div className="space-y-1.5 text-right min-w-0">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-black text-slate-700">
                      You ({user?.role === 'owner' ? 'Owner' : user?.role === 'admin' ? 'Admin' : 'User'})
                    </span>
                  </div>

                  {m.imageUrl && (
                    <div className="p-1.5 rounded-2xl bg-white border border-slate-200 inline-block shadow-md">
                      <img src={m.imageUrl} alt="" className="max-w-[240px] max-h-[160px] rounded-xl object-cover" />
                    </div>
                  )}

                  {m.sourceFileName && (
                    <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-300 inline-flex items-center gap-2 text-amber-950 text-xs font-bold shadow-2xs">
                      <FileSpreadsheet size={16} className="text-emerald-600" />
                      <span>Attached Spreadsheet: {m.sourceFileName}</span>
                    </div>
                  )}

                  {m.text && (
                    <div className="p-4 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs sm:text-sm text-left shadow-md leading-relaxed">
                      {m.text}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {isAITyping && (
            <div className="flex items-center gap-2.5 text-xs text-amber-900 font-bold bg-amber-50/90 p-3 rounded-2xl border border-amber-200 w-fit animate-pulse shadow-2xs">
              <Sparkles size={16} className="animate-spin text-orange-500" />
              <span>Analyzing store database, calculating inventory velocity &amp; compiling report...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Executive Prompt Chips Bar ─────────────────────── */}
        <div className="p-3 px-5 bg-slate-100/90 border-t border-slate-200/90 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1">
            <Activity size={12} className="text-orange-500" />
            Quick Operations:
          </span>
          {EXECUTIVE_PROMPTS.map((qp, idx) => {
            const Icon = qp.icon
            return (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleSend(qp.prompt)}
                className="px-3 py-1.5 rounded-xl border border-slate-200/80 hover:border-orange-500 hover:text-orange-600 bg-white text-xs font-bold text-slate-700 whitespace-nowrap transition-all shadow-2xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Icon size={12} className="text-orange-500" />
                <span>{qp.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Bottom Input, Photo & Spreadsheet Form ─────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5"
        >
          {/* Uploaded Image / Spreadsheet Attachment Previews */}
          <div className="flex items-center gap-3 flex-wrap">
            {uploadedImage && (
              <div className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-2xl border border-amber-200 w-fit shadow-2xs">
                <img src={uploadedImage} alt="Attachment" className="w-10 h-10 rounded-xl object-cover border border-amber-300" />
                <div className="text-xs">
                  <p className="font-black text-slate-900">Vehicle / Part Photo</p>
                  <p className="text-[10px] text-slate-600">Gemini Vision extraction ready</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedImage('')}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {spreadsheetFile && (
              <div className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 w-fit shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="text-xs">
                  <p className="font-black text-slate-900 truncate max-w-[200px]">{spreadsheetFile.name}</p>
                  <p className="text-[10px] text-emerald-700 font-bold">{spreadsheetFile.rowsCount} Products Ready to Ingest</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSpreadsheetFile(null)
                    setSpreadsheetData([])
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* File Upload Triggers */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageUpload(e.target.files[0])
              }}
            />

            <input
              type="file"
              ref={spreadsheetInputRef}
              accept=".csv, .txt, .json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleSpreadsheetUpload(e.target.files[0])
              }}
            />

            {/* Add Photo Button */}
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              title="Upload vehicle or part photo to create draft"
              className="h-12 px-3.5 rounded-2xl border border-slate-200 hover:border-orange-500 bg-slate-50 hover:bg-white text-slate-700 hover:text-orange-600 transition-all flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 shadow-2xs"
            >
              {uploadingImage ? <Loader2 size={16} className="animate-spin text-orange-500" /> : <ImageIcon size={16} />}
              <span className="hidden sm:inline">Photo</span>
            </button>

            {/* Upload Spreadsheet Button */}
            <button
              type="button"
              onClick={() => spreadsheetInputRef.current?.click()}
              title="Upload CSV / Excel catalog file to ingest products"
              className="h-12 px-3.5 rounded-2xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-white text-slate-700 hover:text-emerald-700 transition-all flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 shadow-2xs"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              <span className="hidden sm:inline">CSV / Excel</span>
            </button>

            {/* Natural Language Prompt Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  isListening
                    ? '🎙️ Listening... speak your management request now'
                    : 'Ask anything: "Generate weekly sales report", "Import CSV", "Restock brake pads"...'
                }
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={loading}
                className={`w-full h-12 pl-4 pr-12 rounded-2xl border text-xs sm:text-sm font-medium transition-all ${
                  isListening
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-400/30'
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-brand focus:ring-2 focus:ring-orange-500/20'
                }`}
              />

              {/* Voice Input Mic */}
              <button
                type="button"
                onClick={handleToggleSpeechInput}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isListening ? 'bg-orange-500 text-white animate-pulse shadow-sm' : 'text-slate-400 hover:text-orange-500 hover:bg-slate-200/60'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || (!draft.trim() && !uploadedImage && !spreadsheetFile)}
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              <span className="hidden sm:inline">EXECUTE</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── Auto-Pilot (Owner Away) Configuration Modal ─────────── */}
      {showAutoPilotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base">Autonomous Auto-Pilot (Owner Away Mode)</h3>
                  <p className="text-xs text-slate-300">
                    Keeps your store fulfilling orders and monitoring inventory when you are away
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAutoPilotModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Master Toggle */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-amber-950">Enable Autonomous Store Operations</h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    When active, AI background workers run every 15 minutes to process orders and restock alerts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPilotSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-14 h-8 rounded-full p-1 transition-colors relative flex items-center ${
                    autoPilotSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      autoPilotSettings.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Automation Rules */}
              <div className="space-y-4">
                <h4 className="font-black text-sm text-slate-900 border-b pb-2">Automation Rules &amp; Limits</h4>

                {/* Auto Confirm Orders */}
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="space-y-1">
                    <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      Auto-Confirm Valid Pending Orders
                    </label>
                    <p className="text-slate-600 text-[11px]">
                      Automatically advances verified customer orders to 'Processing' without waiting for manual confirmation.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPilotSettings.autoConfirmOrders}
                    onChange={(e) => setAutoPilotSettings((p) => ({ ...p, autoConfirmOrders: e.target.checked }))}
                    className="w-5 h-5 accent-orange-600 rounded cursor-pointer shrink-0 mt-1"
                  />
                </div>

                {/* Max Order Value Cap */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-900 text-xs">
                      Max Automated Order Value (PKR Cap)
                    </label>
                    <span className="font-black text-orange-600 text-xs">
                      Rs {Number(autoPilotSettings.maxAutoOrderValue || 250000).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Orders exceeding this amount will pause for your manual review to prevent fraud.
                  </p>
                  <input
                    type="range"
                    min="50000"
                    max="1000000"
                    step="25000"
                    value={autoPilotSettings.maxAutoOrderValue || 250000}
                    onChange={(e) => setAutoPilotSettings((p) => ({ ...p, maxAutoOrderValue: Number(e.target.value) }))}
                    className="w-full accent-orange-600"
                  />
                </div>

                {/* Auto Dispatch Courier */}
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="space-y-1">
                    <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <ShoppingBag size={15} className="text-blue-600" />
                      Auto-Assign Courier &amp; Mark Dispatched
                    </label>
                    <p className="text-slate-600 text-[11px]">
                      Automatically assigns packed orders to Express Dispatch (TCS / Leopards).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPilotSettings.autoDispatchOrders}
                    onChange={(e) => setAutoPilotSettings((p) => ({ ...p, autoDispatchOrders: e.target.checked }))}
                    className="w-5 h-5 accent-orange-600 rounded cursor-pointer shrink-0 mt-1"
                  />
                </div>

                {/* Low Stock Threshold */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <label className="font-black text-slate-900 text-xs">
                      Proactive Low-Stock Safety Threshold
                    </label>
                    <p className="text-slate-500 text-[11px]">
                      Trigger automatic restock notifications when inventory falls below:
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={autoPilotSettings.autoRestockAlertThreshold || 5}
                      onChange={(e) =>
                        setAutoPilotSettings((p) => ({ ...p, autoRestockAlertThreshold: Number(e.target.value) }))
                      }
                      className="w-16 h-8 text-center rounded-xl border font-bold text-xs"
                    />
                    <span className="text-xs font-bold text-slate-600">units</span>
                  </div>
                </div>

                {/* Away Mode & Pending Backlog Threshold */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <label className="font-black text-amber-950 text-xs flex items-center gap-1.5">
                        <Clock size={15} className="text-amber-600" />
                        Staff Away Mode &amp; Order Backlog Auto-Trigger
                      </label>
                      <p className="text-amber-800 text-[11px]">
                        When staff is away (1-2 days) and pending orders accumulate, Auto-Pilot automatically processes them to "Processing" and emails Store Owner &amp; Admins to inspect &amp; pack.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPilotSettings.awayModeEnabled !== false}
                      onChange={(e) => setAutoPilotSettings((p) => ({ ...p, awayModeEnabled: e.target.checked }))}
                      className="w-5 h-5 accent-orange-600 rounded cursor-pointer shrink-0 mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-amber-200/60">
                    <span className="text-[11px] font-bold text-amber-900">
                      Auto-Trigger Threshold (Pending Orders Backlog):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="3"
                        max="50"
                        value={autoPilotSettings.minPendingThreshold || 10}
                        onChange={(e) =>
                          setAutoPilotSettings((p) => ({ ...p, minPendingThreshold: Math.max(1, Number(e.target.value)) }))
                        }
                        className="w-16 h-8 text-center rounded-xl border border-amber-300 font-extrabold text-xs text-amber-900 bg-white"
                      />
                      <span className="text-xs font-bold text-amber-800">orders</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Activity Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="font-black text-xs text-slate-900">Recent Autonomous Activity (While Away)</h4>
                  <button
                    type="button"
                    onClick={handleRunAutoPilotNow}
                    disabled={runningAutoPilot}
                    className="text-orange-600 hover:text-orange-700 text-[11px] font-bold flex items-center gap-1"
                  >
                    {runningAutoPilot ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    <span>Test Run Cycle Now</span>
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2">
                  {(!autoPilotSettings.logs || autoPilotSettings.logs.length === 0) && (
                    <p className="text-[11px] text-slate-500 text-center py-4">No automated events logged yet.</p>
                  )}
                  {autoPilotSettings.logs?.slice(0, 8).map((log, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAutoPilotModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAutoPilot}
                disabled={savingAutoPilot}
                className="px-6 py-2 rounded-xl bg-slate-950 hover:bg-black text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2"
              >
                {savingAutoPilot ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Auto-Pilot Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action History Slide-over Drawer ───────────────────── */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 space-y-4 animate-slide-left">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <History size={20} className="text-orange-600" />
                <h3 className="font-black text-base text-slate-900">AI Action Audit Trail</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {historyLoading && (
                <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-orange-500" />
                  <span>Loading audit log...</span>
                </div>
              )}

              {!historyLoading && actionHistory.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">No AI operations recorded yet.</p>
              )}

              {actionHistory.map((act) => (
                <div key={act._id} className="p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2 bg-slate-50/70 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs">{act.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        act.status === 'executed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : act.status === 'rejected'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">{act.description}</p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {new Date(act.createdAt).toLocaleString()} • Confirmed by: {act.approvedByName || 'Store Staff'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
