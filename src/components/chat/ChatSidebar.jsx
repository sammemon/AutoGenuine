import { Search, MessageCircle, Sparkles, Loader2 } from 'lucide-react'

export default function ChatSidebar({
  activeTab,
  setActiveTab,
  ticketFilter,
  setTicketFilter,
  searchQuery,
  setSearchQuery,
  ticketCounts,
  loading,
  filteredConversations,
  activeId,
  setActiveId,
  setMobileShowChat,
  setShowNewChatModal,
  currentUserId,
  onlineUsers,
  isStaff,
  formatTime,
  getUserId,
  UserAvatar,
  RoleBadge,
  navigate,
}) {
  return (
    <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
      {/* Search & Filter Header */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-medium"
          />
        </div>

        {/* Support Ticket Filter Tabs (Staff Only) */}
        {isStaff && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 text-xs font-bold text-slate-600">
            <button
              onClick={() => setTicketFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                ticketFilter === 'all'
                  ? 'bg-white text-ink shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${ticketFilter === 'all' ? 'bg-brand text-white' : 'bg-slate-200 text-slate-700'}`}>
                {ticketCounts.all}
              </span>
            </button>

            <button
              onClick={() => setTicketFilter('active')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                ticketFilter === 'active'
                  ? 'bg-white text-emerald-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <span>Active</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${ticketFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {ticketCounts.active}
              </span>
            </button>

            <button
              onClick={() => setTicketFilter('resolved')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                ticketFilter === 'resolved'
                  ? 'bg-white text-blue-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <span>Resolved</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${ticketFilter === 'resolved' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {ticketCounts.resolved}
              </span>
            </button>

            <button
              onClick={() => setTicketFilter('closed')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${
                ticketFilter === 'closed'
                  ? 'bg-white text-slate-900 shadow-2xs font-black'
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
  )
}
