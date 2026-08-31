/**
 * AutoGenuine Official Chat Transcript & Dispute Export Engine
 * Generates high-fidelity printable PDF and Word (.doc) transcripts for dispute archives.
 */

export function generateChatTranscriptPdf(conversation, messages = []) {
  if (!conversation) return

  const ticketRef = conversation.orderRef
    ? `TICKET-#${conversation.orderRef}`
    : `TICKET-#${String(conversation._id || '').slice(-6).toUpperCase()}`

  const dateStr = new Date(conversation.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const participantsList = (conversation.participants || [])
    .map((p) => `${p.name || 'User'} (${(p.role || 'customer').toUpperCase()})`)
    .join(', ')

  const statusLabel = (conversation.supportStatus || 'RESOLVED').toUpperCase().replace(/_/g, ' ')

  const transcriptHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chat Transcript - ${ticketRef}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 40px;
      line-height: 1.5;
      font-size: 13px;
    }

    .transcript-card {
      max-width: 820px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #f1f5f9;
      margin-bottom: 24px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-badge {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: 20px;
    }

    .brand-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .ticket-badge {
      text-align: right;
    }

    .status-pill {
      display: inline-block;
      padding: 4px 12px;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .ticket-id {
      font-size: 16px;
      font-weight: 900;
      font-family: monospace;
      color: #0f172a;
    }

    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 28px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      font-size: 12px;
    }

    .meta-item strong {
      color: #475569;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 2px;
    }

    .messages-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 30px;
    }

    .msg-row {
      display: flex;
      flex-direction: column;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .msg-row.customer {
      background: #ffffff;
      border-color: #cbd5e1;
    }

    .msg-row.ai {
      background: #fffbeb;
      border-color: #fde68a;
    }

    .msg-row.staff {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .msg-row.system {
      background: #f8fafc;
      border-color: #e2e8f0;
      text-align: center;
      font-style: italic;
      color: #64748b;
      padding: 8px 12px;
      font-size: 11px;
    }

    .msg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .msg-author {
      font-weight: 800;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .author-role {
      font-size: 9px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .role-ai { background: #fef3c7; color: #b45309; }
    .role-customer { background: #e2e8f0; color: #334155; }
    .role-admin { background: #dcfce7; color: #15803d; }
    .role-owner { background: #ede9fe; color: #6b21a8; }

    .msg-time {
      font-size: 10px;
      color: #94a3b8;
      font-mono;
    }

    .msg-text {
      font-size: 12px;
      color: #1e293b;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }

    @media print {
      body { padding: 0; background: none; }
      .transcript-card { border: none; box-shadow: none; padding: 0; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="transcript-card">
    <div class="header">
      <div class="brand">
        <div class="logo-badge">AG</div>
        <div>
          <div class="brand-name">AUTOGENUINE OEM SUPPORT</div>
          <div class="brand-sub">Official Customer Support &amp; Dispute Transcript</div>
        </div>
      </div>
      <div class="ticket-badge">
        <div class="status-pill">${statusLabel}</div>
        <div class="ticket-id">${ticketRef}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${dateStr}</div>
      </div>
    </div>

    <div class="meta-box">
      <div class="meta-item">
        <strong>Participants:</strong>
        ${participantsList || 'Valued Customer & Staff'}
      </div>
      <div class="meta-item">
        <strong>Channel / Origin:</strong>
        ${conversation.isSupport ? 'AI Support Bot & Staff Escalation' : 'Direct Support Channel'}
      </div>
      ${conversation.resolvedByName ? `
      <div class="meta-item">
        <strong>Resolved By:</strong>
        ${conversation.resolvedByName}
      </div>` : ''}
      ${conversation.resolutionNote ? `
      <div class="meta-item">
        <strong>Resolution Note:</strong>
        ${conversation.resolutionNote}
      </div>` : ''}
    </div>

    <div class="messages-container">
      ${messages
        .map((m) => {
          const isSystem = m.type === 'system'
          const isAi = m.isAI || m.senderRole === 'ai' || m.senderName?.includes('AI')
          const isStaff = m.senderRole === 'admin' || m.senderRole === 'owner'
          const authorRole = isAi ? 'AI Support' : isStaff ? (m.senderRole === 'owner' ? 'Store Owner' : 'Admin') : 'Customer'
          const roleClass = isAi ? 'role-ai' : isStaff ? (m.senderRole === 'owner' ? 'role-owner' : 'role-admin') : 'role-customer'
          const cardClass = isSystem ? 'system' : isAi ? 'ai' : isStaff ? 'staff' : 'customer'

          if (isSystem) {
            return `
            <div class="msg-row system">
              ${m.text}
            </div>`
          }

          return `
          <div class="msg-row ${cardClass}">
            <div class="msg-header">
              <div class="msg-author">
                ${m.senderName || (isAi ? 'AutoGenuine AI' : 'Customer')}
                <span class="author-role ${roleClass}">${authorRole}</span>
              </div>
              <span class="msg-time">${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="msg-text">${m.text || ''}</div>
          </div>`
        })
        .join('')}
    </div>

    <div class="footer">
      Official AutoGenuine Support Document • Dispute &amp; Escalation Audit Archive<br>
      WhatsApp Helpdesk: +92 321 3498203 • autogenuine.com
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
`

  const printWindow = window.open('', '_blank', 'width=850,height=900')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(transcriptHtml)
    printWindow.document.close()
  }
}

/**
 * Word (.doc / text) Transcript Downloader
 */
export function downloadChatTranscriptWord(conversation, messages = []) {
  if (!conversation) return

  const ticketRef = conversation.orderRef
    ? `TICKET-#${conversation.orderRef}`
    : `TICKET-#${String(conversation._id || '').slice(-6).toUpperCase()}`

  const header = `=====================================================
            AUTOGENUINE OEM PARTS
         OFFICIAL SUPPORT CHAT TRANSCRIPT
=====================================================
Ticket Reference:   ${ticketRef}
Date Created:       ${new Date(conversation.createdAt || Date.now()).toLocaleString()}
Status:             ${(conversation.supportStatus || 'RESOLVED').toUpperCase()}
Resolved By:        ${conversation.resolvedByName || 'Staff'}
Resolution Note:    ${conversation.resolutionNote || 'Resolved'}
=====================================================

CONVERSATION LOG:
-----------------------------------------------------
`

  const body = messages
    .map((m) => {
      const time = new Date(m.createdAt).toLocaleString()
      const author = m.senderName || (m.isAI ? 'AutoGenuine AI' : 'User')
      const role = m.senderRole?.toUpperCase() || (m.isAI ? 'AI' : 'CUSTOMER')
      return `[${time}] ${author} (${role}):\n${m.text}\n`
    })
    .join('\n-----------------------------------------------------\n')

  const footer = `\n=====================================================
End of Support Transcript • AutoGenuine OEM Parts
Helpdesk: +92 321 3498203
=====================================================`

  const fullText = header + body + footer

  const blob = new Blob([fullText], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `AutoGenuine_Transcript_${ticketRef.replace(/#/g, '')}.doc`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
