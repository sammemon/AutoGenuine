// Shared order-status metadata so Overview, Orders section, and TrackOrder agree on labels/colours.
export const ORDER_STATUSES = [
  'pending',
  'processing',
  'packed',
  'dispatched',
  'out_for_delivery',
  'shipped',
  'delivered',
  'cancelled',
]

// Labels shown in the admin status dropdown
export const ORDER_STATUS_LABELS = {
  pending: 'Pending — Awaiting Store Approval',
  processing: 'Processing & Packing (Approved)',
  packed: 'Packed — Ready for Dispatch',
  dispatched: 'Dispatched from Warehouse',
  out_for_delivery: 'Out for Delivery',
  shipped: 'Shipped / In Transit',
  delivered: 'Delivered to Customer',
  cancelled: 'Cancelled (Refund & Restock)',
}

export const ORDER_TONES = {
  pending: 'amber',
  processing: 'blue',
  packed: 'brand',
  dispatched: 'brand',
  out_for_delivery: 'brand',
  shipped: 'brand',
  delivered: 'green',
  cancelled: 'red',
}

// For the customer track order page — which backend status maps to which UI stage
export const STATUS_TO_STAGE = {
  pending: 'pending',
  processing: 'processing',
  packed: 'processing',
  dispatched: 'shipped',
  out_for_delivery: 'shipped',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
}
