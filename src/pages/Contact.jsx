import { useState } from 'react'
import { ArrowLeft, User, Mail, Phone, MessageSquare, Send, MapPin, Clock, MessageCircle } from 'lucide-react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useNav } from '../context/NavContext'
import { useToast } from '../context/ToastContext'
import { useStoreSettings } from '../context/StoreSettingsContext'
import { contact as contactAPI } from '../services/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emptyForm = { name: '', email: '', phone: '', subject: '', message: '' }

export default function Contact() {
  const { navigate } = useNav()
  const { showToast } = useToast()
  const { settings, whatsappNumber, whatsappDisplay, supportPhone, supportEmail } = useStoreSettings()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const contactInfo = [
    { icon: MapPin, label: 'Visit us', value: settings.address || '42 Main Boulevard, Gulberg III, Lahore, Pakistan' },
    { icon: Phone, label: 'Call us', value: supportPhone || '+92 321 3498203', href: `tel:${supportPhone || '+923213498203'}` },
    { icon: Mail, label: 'Email us', value: supportEmail || 'support@autogenuine.com', href: `mailto:${supportEmail || 'support@autogenuine.com'}` },
    { icon: Clock, label: 'Opening hours', value: 'Mon–Sat, 8:00am – 8:00pm' },
  ]

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Please enter your name'
    if (!form.email.trim()) next.email = 'Please enter your email'
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (!form.subject.trim()) next.subject = 'Please add a subject'
    if (!form.message.trim()) next.message = 'Please write your message'
    else if (form.message.trim().length < 10) next.message = 'Message is too short (min 10 characters)'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showToast('Please fix the highlighted fields')
      return
    }

    setLoading(true)
    try {
      await contactAPI.submit(form)
      showToast('Thanks! Your message has been sent. We\'ll reply within 24 hours.')
      setForm(emptyForm)
    } catch (err) {
      showToast(err.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = 'w-full border rounded-md h-11 pl-10 pr-4 text-sm focus:outline-none transition-colors'
  const errBorder = (k) => (errors[k] ? 'border-red-400 focus:border-red-500' : 'border-line focus:border-brand')

  return (
    <div className="min-h-screen bg-cream">
      <AnnouncementBar />
      <Header />

      <div className="container-content px-6 py-12">
        <button
          onClick={() => navigate('home')}
          className="inline-flex items-center gap-1.5 text-ink text-[13px] font-semibold hover:text-brand transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to home
        </button>

        <div className="max-w-2xl">
          <p className="text-brand text-[11px] font-bold tracking-widest mb-3">GET IN TOUCH</p>
          <h1 className="text-ink font-black text-3xl md:text-[2.5rem] leading-tight tracking-tight uppercase">
            Contact us
          </h1>
          <p className="mt-4 text-muted text-[16px] leading-relaxed">
            Questions about a part, an order, or fitment? Send us a message and our team will get back to
            you within 24 hours.
          </p>
        </div>

        <div className="grid md:grid-cols-[1.4fr,1fr] gap-6 mt-10 items-start">
          {/* Form */}
          <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">FULL NAME</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      className={`${inputBase} ${errBorder('name')}`}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">EMAIL</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      className={`${inputBase} ${errBorder('email')}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[12px] mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">PHONE (OPTIONAL)</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      className={`${inputBase} border-line focus:border-brand`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">SUBJECT</label>
                  <div className="relative">
                    <MessageSquare size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setField('subject', e.target.value)}
                      className={`${inputBase} ${errBorder('subject')}`}
                    />
                  </div>
                  {errors.subject && <p className="text-red-500 text-[12px] mt-1">{errors.subject}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">MESSAGE</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setField('message', e.target.value)}
                  rows={5}
                  className={`w-full border rounded-md p-4 text-sm focus:outline-none transition-colors resize-y ${errBorder('message')}`}
                />
                {errors.message && <p className="text-red-500 text-[12px] mt-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-md bg-brand text-white text-xs font-bold tracking-widest hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={15} /> {loading ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="space-y-4">
            {contactInfo.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="bg-white rounded-lg p-5 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
                  <Icon size={19} className="text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-widest text-muted">{label.toUpperCase()}</p>
                  {href ? (
                    <a href={href} className="text-ink text-[14px] font-medium hover:text-brand transition-colors break-words">{value}</a>
                  ) : (
                    <p className="text-ink text-[14px] font-medium break-words">{value}</p>
                  )}
                </div>
              </div>
            ))}

            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-md bg-ink text-white text-xs font-bold tracking-widest hover:bg-ink-soft transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> CHAT ON WHATSAPP
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
