/**
 * AutoGenuine Executive Business Report & Audit Export Engine
 * Generates official high-fidelity printable PDF reports, Word documents (.doc), and CSV spreadsheets.
 */

export function generateExecutiveReportPdf({
  title = 'AutoGenuine Executive Store Performance Report',
  subtitle = 'Official Business Analytics & Operational Intelligence',
  metrics = [],
  tables = [],
  text = '',
  timeFrame = 'Monthly',
}) {
  const reportRef = `AUDIT-REP-${Date.now().toString().slice(-6).toUpperCase()}`
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Format text into HTML paragraphs
  const formattedHtml = text
    .replace(/\n\n/g, '</p><p class="report-p">')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/###\s+(.*)/g, '<h3 class="section-title">$1</h3>')
    .replace(/##\s+(.*)/g, '<h2 class="section-title-lg">$1</h2>')

  const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${reportRef}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 40px;
      line-height: 1.6;
      font-size: 12px;
    }
    .report-wrapper {
      max-width: 850px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
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
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .report-id {
      font-family: monospace;
      font-weight: 800;
      color: #0f172a;
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      display: inline-block;
      margin-bottom: 4px;
    }
    .title-banner {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .title-banner h1 {
      font-size: 18px;
      font-weight: 900;
      margin-bottom: 4px;
      letter-spacing: -0.3px;
    }
    .title-banner p {
      font-size: 11px;
      color: #cbd5e1;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
    .metric-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
    }
    .content-box {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin: 16px 0 8px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .section-title-lg {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      margin: 20px 0 10px 0;
    }
    .report-p {
      margin-bottom: 12px;
      line-height: 1.7;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 11px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #1e293b;
    }
    td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
    }
    .seal {
      font-weight: 800;
      color: #ea580c;
    }
    @media print {
      body { padding: 0; background: transparent; }
      .report-wrapper { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      @page { margin: 15mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="report-wrapper">
    <div class="header">
      <div class="brand">
        <div class="logo-badge">AG</div>
        <div>
          <div class="brand-name">AutoGenuine Pakistan</div>
          <div class="brand-sub">Executive Business Management &amp; Analytics</div>
        </div>
      </div>
      <div class="meta-box">
        <div class="report-id">${reportRef}</div>
        <div><strong>Generated:</strong> ${dateStr}</div>
        <div><strong>Timeframe:</strong> ${timeFrame} Audit</div>
      </div>
    </div>

    <div class="title-banner">
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>

    <div class="content-box">
      ${formattedHtml}
    </div>

    <div class="footer">
      <div>AutoGenuine Inc. • Confidential Store Owner Document</div>
      <div class="seal">✓ OFFICIAL AUDIT REPORT • AUTOGENUINE AI</div>
    </div>
  </div>
</body>
</html>
`

  const printFrame = document.createElement('iframe')
  printFrame.style.position = 'fixed'
  printFrame.style.right = '0'
  printFrame.style.bottom = '0'
  printFrame.style.width = '0'
  printFrame.style.height = '0'
  printFrame.style.border = '0'

  document.body.appendChild(printFrame)

  const frameDoc = printFrame.contentWindow.document
  frameDoc.open()
  frameDoc.write(reportHtml)
  frameDoc.close()

  setTimeout(() => {
    try {
      printFrame.contentWindow.focus()
      printFrame.contentWindow.print()
    } catch (e) {
      console.warn('PDF Print frame error:', e)
    } finally {
      setTimeout(() => document.body.removeChild(printFrame), 2000)
    }
  }, 400)
}

/**
 * Direct CSV Spreadsheet Downloader
 */
export function downloadReportCsv(filename = 'autogenuine-report.csv', rows = [], headers = []) {
  if (!rows || rows.length === 0) return

  let csvContent = ''
  if (headers && headers.length > 0) {
    csvContent += headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n'
  }

  for (const row of rows) {
    if (Array.isArray(row)) {
      csvContent += row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',') + '\r\n'
    } else if (typeof row === 'object') {
      const keys = headers.length > 0 ? headers : Object.keys(row)
      csvContent += keys.map((k) => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(',') + '\r\n'
    }
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Word Document (.doc) Downloader
 */
export function downloadReportWord(filename = 'autogenuine-report.doc', text = '', title = 'AutoGenuine Business Report') {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>${title}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;font-size:11pt;}</style></head>
    <body>
      <h2>${title}</h2>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <hr/>
      <div>${text.replace(/\n/g, '<br/>')}</div>
    </body>
    </html>
  `
  const blob = new Blob(['\ufeff', content], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.doc') ? filename : `${filename}.doc`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
