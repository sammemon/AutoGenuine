/**
 * AutoGenuine Official PDF Invoice Generator
 * Opens a styled, printable invoice window and triggers browser PDF save/print.
 */
export function generatePdfInvoice(order, sessionId = '') {
  if (!order) return

  const orderRef = order.orderRef || `ORD-${String(order._id || '').slice(-6).toUpperCase()}`
  const dateStr = new Date(order.paidAt || order.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const items = order.items || []
  const subtotal = order.total || 0
  const paymentMethod = (order.paymentMethod || 'Stripe 3D-Secure').toUpperCase()
  const transactionRef = order.stripePaymentIntentId || order.transactionReference || sessionId || 'STRIPE-PAID'

  const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${orderRef} - AutoGenuine OEM Parts</title>
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

    .invoice-card {
      max-width: 800px;
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
      margin-bottom: 30px;
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
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .invoice-title-block {
      text-align: right;
    }

    .invoice-badge {
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
      margin-bottom: 6px;
    }

    .invoice-num {
      font-size: 18px;
      font-weight: 900;
      font-family: monospace;
      color: #0f172a;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }

    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
    }

    .meta-label {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }

    .meta-val-strong {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .meta-val {
      font-size: 12px;
      color: #475569;
      line-height: 1.4;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }

    th {
      background: #0f172a;
      color: white;
      text-align: left;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th:first-child { border-radius: 8px 0 0 8px; }
    th:last-child { border-radius: 0 8px 8px 0; text-align: right; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }

    td {
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }

    td:last-child { text-align: right; font-weight: 700; }
    td:nth-child(3), td:nth-child(4) { text-align: right; }

    .part-name {
      font-weight: 700;
      color: #0f172a;
    }

    .part-sku {
      font-size: 10px;
      color: #64748b;
      font-family: monospace;
      margin-top: 2px;
    }

    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      gap: 20px;
    }

    .notes-box {
      flex: 1;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 11px;
      color: #92400e;
    }

    .totals-box {
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
      color: #475569;
    }

    .total-row.grand {
      border-top: 2px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }

    .grand-amount {
      color: #ea580c;
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
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <div class="logo-badge">AG</div>
        <div>
          <div class="brand-name">AUTOGENUINE</div>
          <div class="brand-sub">100% OEM Certified Spare Parts</div>
        </div>
      </div>
      <div class="invoice-title-block">
        <div class="invoice-badge">✓ Paid &amp; Verified</div>
        <div class="invoice-num">#${orderRef}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${dateStr}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <div class="meta-label">Billed &amp; Delivered To:</div>
        <div class="meta-val-strong">${order.customerName || 'Valued Customer'}</div>
        <div class="meta-val">${order.shippingAddress || 'Standard Delivery Address'}</div>
        <div class="meta-val" style="font-weight: 700; color: #0f172a;">${order.city || ''}</div>
        <div class="meta-val">Phone: ${order.customerPhone || 'N/A'}</div>
        <div class="meta-val">Email: ${order.customerEmail || 'N/A'}</div>
      </div>

      <div class="meta-box">
        <div class="meta-label">Payment &amp; Verification:</div>
        <div class="meta-val-strong">Gateway: ${paymentMethod}</div>
        <div class="meta-val">Status: <strong style="color: #059669;">COMPLETED (3D-SECURE)</strong></div>
        <div class="meta-val" style="font-family: monospace; font-size: 11px; word-break: break-all; margin-top: 4px;">
          Ref: ${transactionRef}
        </div>
        ${order.vehicleInfo ? `<div class="meta-val" style="margin-top: 4px; color: #0284c7; font-weight: 600;">Vehicle: ${order.vehicleInfo}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>OEM Part Description</th>
          <th>Unit Price</th>
          <th>Qty</th>
          <th>Amount (PKR)</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (it, i) => `
          <tr>
            <td style="color: #94a3b8; font-weight: 700;">${i + 1}</td>
            <td>
              <div class="part-name">${it.name}</div>
              <div class="part-sku">SKU: ${it.partSlug || 'OEM-PART'}</div>
            </td>
            <td>Rs ${(it.price || 0).toLocaleString()}</td>
            <td style="font-weight: 700;">${it.qty}</td>
            <td>Rs ${((it.price || 0) * (it.qty || 1)).toLocaleString()}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="notes-box">
        <div style="font-weight: 800; margin-bottom: 4px;">🛡️ 100% Genuine Fitment Guarantee</div>
        This official invoice confirms genuine OEM dispatch. All parts include AutoGenuine's 7-day inspection and exchange warranty.
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal</span>
          <span>Rs ${subtotal.toLocaleString()}</span>
        </div>
        <div class="total-row">
          <span>Express Delivery</span>
          <span style="color: #059669; font-weight: 700;">FREE</span>
        </div>
        <div class="total-row grand">
          <span>Total Paid</span>
          <span class="grand-amount">Rs ${subtotal.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      Thank you for shopping with AutoGenuine OEM Parts • Nationwide Dispatch &amp; Live Tracking Support<br>
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
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
  }
}
