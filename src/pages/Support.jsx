import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Package,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  UserCheck,
  AlertTriangle,
  MessageCircle,
  Truck,
  CreditCard,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  Download,
  FileText,
  Clock,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import Header from '../components/Header'
import AnnouncementBar from '../components/AnnouncementBar'
import Footer from '../components/Footer'
import { useAuth, initials } from '../context/AuthContext'
import { useNav } from '../context/NavContext'
import { useToast } from '../context/ToastContext'
import { chat as chatAPI } from '../services/api'
import FormattedMessage from '../components/chat/FormattedMessage'
import { generateChatTranscriptPdf, downloadChatTranscriptWord } from '../utils/generateChatTranscriptPdf'

export default function Support() {
  const { user, isAuthed, loading: authLoading } = useAuth()
  const { params, navigate } = useNav()
  const { showToast } = useToast()

  const orderRef = params?.orderRef || ''
  const productSlug = params?.productSlug || ''
  const categoryParam = params?.category || (orderRef ? 'order_support' : productSlug ? 'product_support' : 'general_support')

  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [isAITyping, setIsAITyping] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const [escalationData, setEscalationData] = useState(null)
  const [targetStaff, setTargetStaff] = useState(null)

  // Save prompt modal for temporary AI usage
  const [showSavePromptModal, setShowSavePromptModal] = useState(false)
  const [pendingDestination, setPendingDestination] = useState('')

  const messageEndRef = useRef(null)
  const recognitionRef = useRef(null)

  async function handleToggleSavePermanent() {
    if (!conversation?._id) return
    const nextSaved = !conversation.savedPermanently
    try {
      const res = await chatAPI.setRetention(conversation._id, {
        action: nextSaved ? 'save_permanent' : 'make_temporary',
        days: 3,
      })
      if (res.conversation) {
        setConversation(res.conversation)
      } else {
        setConversation((prev) => ({
          ...prev,
          savedPermanently: nextSaved,
          isTemporary: !nextSaved,
        }))
      }
      showToast(nextSaved ? '💾 Chat saved permanently to history' : '⏳ Marked as temporary (auto-expires in 3 days)')
    } catch (err) {
      showToast(err.message || 'Failed to update chat retention')
    }
  }

  function handleRequestExit(destination) {
    // If conversation exists, has interaction, and is not yet permanently saved, prompt
    if (conversation && messages.length >= 2 && !conversation.savedPermanently) {
      setPendingDestination(destination)
      setShowSavePromptModal(true)
    } else {
      navigate(destination)
    }
  }

  async function handleConfirmPermanent() {
    if (conversation?._id) {
      try {
        await chatAPI.setRetention(conversation._id, { action: 'save_permanent' })
        showToast('💾 AI chat history saved permanently')
      } catch (err) {
        console.warn('Retention save error:', err)
      }
    }
    setShowSavePromptModal(false)
    navigate(pendingDestination || 'home')
  }

  async function handleConfirmTemporary() {
    if (conversation?._id) {
      try {
        await chatAPI.setRetention(conversation._id, { action: 'make_temporary', days: 3 })
        showToast('⏳ AI chat kept as temporary (auto-removes in 3 days)')
      } catch (err) {
        console.warn('Retention temp error:', err)
      }
    }
    setShowSavePromptModal(false)
    navigate(pendingDestination || 'home')
  }

  async function handleConfirmDiscard() {
    if (conversation?._id) {
      try {
        await chatAPI.setRetention(conversation._id, { action: 'discard' })
        showToast('🗑️ Temporary AI session discarded')
      } catch (err) {
        console.warn('Retention discard error:', err)
      }
    }
    setShowSavePromptModal(false)
    navigate(pendingDestination || 'home')
  }

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

  useEffect(() => {
    if (!authLoading && !isAuthed) {
      navigate('login')
      return
    }

    let cancelled = false
    setLoading(true)

    chatAPI
      .startSupportChat({
        orderRef,
        productSlug,
        category: categoryParam,
      })
      .then((res) => {
        if (cancelled) return
        setConversation(res.conversation)
        setMessages(res.messages || [])
      })
      .catch((err) => {
        if (!cancelled) showToast(err.message || 'Failed to start AI support')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthed, orderRef, productSlug, categoryParam, navigate, showToast])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isAITyping])

  async function handleSend(textToSend) {
    const text = (textToSend || draft).trim()
    if (!text || sending) return

    setDraft('')
    setSending(true)
    setIsAITyping(true)

    // Optimistic user message
    const tempId = `temp-${Date.now()}`
    const optMsg = {
      _id: tempId,
      sender: user,
      senderName: user?.name || 'You',
      senderRole: 'user',
      text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optMsg])

    const typingTimer = setTimeout(() => setIsAITyping(false), 9000)

    try {
      const res = await chatAPI.sendSupportAIMessage({
        conversationId: conversation?._id,
        text,
        orderRef: orderRef || conversation?.orderRef || '',
        productSlug: productSlug || conversation?.productSlug || '',
      })

      if (res.userMessage && res.aiMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== tempId),
          res.userMessage,
          res.aiMessage,
        ])
      }
      if (res.conversation) {
        setConversation(res.conversation)
      }
      if (res.shouldEscalate) {
        setEscalationData(res.escalation)
        setTargetStaff(res.targetStaffUser)
        showToast('Your request has been routed to human support.')
      }
    } catch (err) {
      showToast(err.message || 'Failed to get AI response')
    } finally {
      clearTimeout(typingTimer)
      setIsAITyping(false)
      setSending(false)
    }
  }

  async function handleManualHumanTransfer() {
    setSending(true)
    try {
      const res = await chatAPI.escalateConversation(conversation?._id, {
        reason: 'Customer requested direct human messaging',
        target: 'owner',
        category: categoryParam,
        priority: 'high',
      })
      setEscalationData(res.escalation)
      setTargetStaff(res.staffUser)
      showToast('Connecting you with Store Owner...')
    } catch (err) {
      showToast(err.message || 'Failed to transfer')
    } finally {
      setSending(false)
    }
  }

  const QUICK_PROMPTS = [
    ...(orderRef ? [{ label: `📦 Where is my order #${orderRef}?`, text: `Where is my order #${orderRef}? What is the delivery status?` }] : []),
    ...(productSlug ? [{ label: `⚙️ Check ${productSlug} compatibility`, text: `Is part ${productSlug} in stock and what does it fit?` }] : []),
    { label: '🚚 Delivery Policy', text: 'What is your nationwide shipping time and fee?' },
    { label: '🔄 7-Day Return Policy', text: 'How does your 7-day return and warranty policy work?' },
    { label: '💳 Payment Methods', text: 'What payment methods do you accept?' },
    { label: '👤 Speak with Human Agent', text: 'I want to speak with a human support agent please.' },
  ]

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans text-ink">
      <AnnouncementBar />
      <Header />

      <main className="container-content px-4 md:px-6 py-6 flex-1 w-full max-w-4xl mx-auto flex flex-col">
        {/* Top Breadcrumb & Actions */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => handleRequestExit('home')}
            className="text-xs font-bold text-slate-600 hover:text-brand flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Store
          </button>

          <div className="flex items-center gap-3">
            {/* AI Session Retention State Toggle */}
            {conversation && (
              <button
                type="button"
                onClick={handleToggleSavePermanent}
                className={`h-8 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                  conversation.savedPermanently
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
                title="Click to switch between permanent save and 3-day temporary storage"
              >
                {conversation.savedPermanently ? (
                  <>
                    <Save size={13} className="text-emerald-600" />
                    <span>Saved Permanently</span>
                  </>
                ) : (
                  <>
                    <Clock size={13} className="text-amber-600 animate-pulse" />
                    <span>Temporary (3 Days) • <span className="underline font-black">Save</span></span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => handleRequestExit('messages')}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1.5"
            >
              <MessageCircle size={14} /> Go to Direct Human Messages
            </button>
          </div>
        </div>

        {/* AI Support Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col flex-1 min-h-[600px] h-[78vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black tracking-wide">AutoGenuine AI Support</h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    ● Live 24/7
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Instant answers for orders, deliveries, genuine OEM parts, and store policies
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {conversation && (
                <button
                  type="button"
                  onClick={handleToggleSavePermanent}
                  className={`hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-all border ${
                    conversation.savedPermanently
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                  title="Toggle permanent chat history save"
                >
                  {conversation.savedPermanently ? <Save size={13} /> : <Clock size={13} />}
                  <span>{conversation.savedPermanently ? 'Saved' : 'Save Chat'}</span>
                </button>
              )}

              {messages.length > 0 && (
                <button
                  onClick={() => generateChatTranscriptPdf(conversation || { orderRef }, messages)}
                  className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                  title="Download printable PDF transcript"
                >
                  <Download size={14} /> Transcript
                </button>
              )}

              {/* Transfer to Human Button */}
              <button
                onClick={handleManualHumanTransfer}
                className="hidden sm:flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-xs"
              >
                <UserCheck size={14} /> Talk to Human Agent
              </button>
            </div>
          </div>

          {/* Active Context Banner */}
          {(orderRef || productSlug) && (
            <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 text-xs flex items-center justify-between gap-2">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Package size={14} className="text-amber-600" />
                {orderRef ? `Inquiring about Order #${orderRef}` : `Inquiring about Part: ${productSlug}`}
              </span>
              {orderRef && (
                <button
                  onClick={() => navigate('track', { ref: orderRef })}
                  className="text-brand hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  View Tracking <ExternalLink size={10} />
                </button>
              )}
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
            {loading && (
              <div className="p-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-brand" />
                <span>Connecting to AI Support Assistant...</span>
              </div>
            )}

            {messages.map((m) => {
              const isAI = m.isAI || m.senderRole === 'ai'
              const isMe = !isAI

              if (isAI) {
                return (
                  <div key={m._id || m.tempId} className="flex items-start gap-3 max-w-2xl mr-auto animate-fade-in">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0 mt-0.5">
                      <Sparkles size={16} />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-ink">AutoGenuine AI</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                          Specialist
                        </span>
                      </div>

                      {/* Tool pills */}
                      {m.aiMetadata?.toolsUsed?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {m.aiMetadata.toolsUsed.map((t, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold shadow-2xs">
                              ⚡ {t.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="p-4 rounded-2xl rounded-tl-sm bg-white border border-slate-200/90 shadow-xs">
                        <FormattedMessage
                          text={m.text}
                          isAI
                          productData={m.aiMetadata?.productData}
                          onOrderClick={(ref) => navigate('track', { ref })}
                        />
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={m._id || m.tempId} className="flex items-start gap-3 max-w-xl ml-auto flex-row-reverse animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0 mt-0.5">
                    {initials(user?.name || 'You')}
                  </div>

                  <div className="p-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap shadow-xs">
                    {m.text}
                  </div>
                </div>
              )
            })}

            {/* AI Typing Indicator */}
            {isAITyping && (
              <div className="flex items-center gap-2.5 text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3.5 rounded-2xl max-w-md mr-auto animate-pulse shadow-xs">
                <Sparkles size={16} className="text-amber-600 animate-spin" />
                <span className="font-bold">AutoGenuine AI is analyzing order &amp; inventory...</span>
              </div>
            )}

            {/* Escalation Handover Card */}
            {escalationData && (
              <div className="max-w-xl mx-auto my-4 p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-lg space-y-3 animate-fade-in text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <UserCheck size={24} />
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-base text-ink">Ready to Connect with Human Support</h3>
                  <p className="text-xs text-slate-600">
                    We have diagnosed your problem and prepared full context for our{' '}
                    <strong>{escalationData.target === 'owner' ? 'Store Owner' : 'Admin Support'}</strong>.
                  </p>
                </div>

                {escalationData.reason && (
                  <p className="text-xs font-bold text-slate-800 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                    Reason: {escalationData.reason}
                  </p>
                )}

                <button
                  onClick={() => {
                    navigate('messages', {
                      conversationId: conversation?._id || '',
                      participantId: targetStaff?._id || '',
                      orderRef: orderRef || conversation?.orderRef || '',
                    })
                  }}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Open Direct Messages with Store Team</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          {!escalationData && messages.length < 6 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted shrink-0">Quick Ask:</span>
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.text)}
                  disabled={sending}
                  className="px-3 py-1 rounded-full border border-slate-200 hover:border-brand hover:text-brand bg-slate-50 text-[11px] font-bold text-slate-700 whitespace-nowrap transition-colors"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  isListening
                    ? '🎙️ Listening... speak in English or Urdu now!'
                    : 'Ask AI anything about your order, tracking, genuine parts, or payment...'
                }
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={sending}
                className={`w-full h-12 pl-4 pr-12 rounded-2xl border text-xs sm:text-sm transition-all ${
                  isListening
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-400/30'
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-brand'
                }`}
              />

              {/* Voice Microphone Dictation Button */}
              <button
                type="button"
                onClick={handleToggleSpeechInput}
                title={isListening ? 'Stop listening' : 'Voice input (Speak to AI)'}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-orange-500 text-white animate-pulse shadow-sm'
                    : 'hover:bg-slate-200/70 text-slate-500 hover:text-amber-600'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shrink-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span className="hidden sm:inline">ASK AI</span>
            </button>
          </form>
        </div>

        {/* Retention / Save Confirmation Modal upon exiting AI Support */}
        {showSavePromptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-scale-in">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <Sparkles size={24} />
                </div>
                <button
                  onClick={() => setShowSavePromptModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-ink">Save AI Chat History?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Would you like to store this AI session permanently in your conversation records, or keep it as a temporary session (auto-removed after 2–3 days)?
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmPermanent}
                  className="w-full h-11 px-4 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs group"
                >
                  <Save size={15} className="group-hover:scale-110 transition-transform" />
                  <span>SAVE PERMANENTLY</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmTemporary}
                  className="w-full h-11 px-4 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Clock size={15} className="text-amber-700" />
                  <span>KEEP AS TEMPORARY (3 DAYS)</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="w-full h-10 px-4 rounded-xl bg-slate-50 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Trash2 size={14} />
                  <span>Discard &amp; Delete Now</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
