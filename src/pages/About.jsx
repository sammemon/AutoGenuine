import { ArrowLeft, ShieldCheck, Truck, Award, Users, Wrench, PackageCheck } from 'lucide-react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useNav } from '../context/NavContext'

const stats = [
  { value: '25,000+', label: 'Genuine parts in stock' },
  { value: '15,000+', label: 'Happy customers' },
  { value: '48 hrs', label: 'Average Lagos delivery' },
  { value: '100%', label: 'OEM-verified fitment' },
]

const values = [
  {
    icon: ShieldCheck,
    title: 'Genuine, Always',
    body: 'Every part is sourced from authorised OEM suppliers. No counterfeits, no aftermarket surprises — just parts built for your car.',
  },
  {
    icon: Wrench,
    title: 'VIN-Verified Fitment',
    body: 'We match parts to your exact vehicle using VIN and chassis data, so what you order is what fits — first time.',
  },
  {
    icon: Truck,
    title: 'Fast Nigeria-Wide Delivery',
    body: 'Same-day dispatch in Lagos and reliable nationwide shipping, with tracking on every order.',
  },
  {
    icon: Award,
    title: 'Warranty-Backed',
    body: 'Genuine parts come with manufacturer warranty and our 30-day return promise for total peace of mind.',
  },
]

export default function About() {
  const { navigate } = useNav()

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

        {/* Intro */}
        <div className="max-w-3xl">
          <p className="text-brand text-[11px] font-bold tracking-widest mb-3">ABOUT AUTOGENUINE</p>
          <h1 className="text-ink font-black text-3xl md:text-[2.5rem] leading-tight tracking-tight uppercase">
            Nigeria's home for genuine auto parts
          </h1>
          <p className="mt-5 text-muted text-[16px] leading-relaxed">
            AutoGenuine started with a simple frustration: finding real, fit-for-purpose car parts in
            Nigeria was too hard. Counterfeits, guesswork on fitment, and long waits were the norm.
            We built a marketplace that fixes all three — genuine OEM parts, VIN-verified fitment, and
            fast delivery you can track.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg p-6 shadow-sm text-center">
              <p className="font-black text-ink text-2xl md:text-3xl">{s.value}</p>
              <p className="text-muted text-[13px] mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="grid md:grid-cols-2 gap-8 mt-14 items-start">
          <div>
            <h2 className="text-ink font-black text-2xl tracking-tight uppercase mb-4">Our story</h2>
            <p className="text-muted text-[15px] leading-relaxed">
              Based in Lagos, we work directly with authorised distributors for Toyota and other major
              brands. Every part in our catalogue is checked against manufacturer specifications before
              it ever reaches your garage.
            </p>
            <p className="text-muted text-[15px] leading-relaxed mt-4">
              What began as a small parts desk is now a trusted name for mechanics, fleet owners, and
              everyday drivers across the country who refuse to gamble with fake components.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Users size={22} className="text-brand" />
              <h3 className="text-ink font-bold text-lg">Who we serve</h3>
            </div>
            <ul className="space-y-3">
              {['Independent mechanics & workshops', 'Fleet & logistics operators', 'Dealerships sourcing genuine stock', 'Everyday drivers who want it done right'].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-ink text-[14px]">
                  <PackageCheck size={17} className="text-brand shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Values */}
        <div className="mt-14">
          <h2 className="text-ink font-black text-2xl tracking-tight uppercase mb-6">Why choose us</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="w-11 h-11 rounded-md bg-brand/10 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-brand" />
                </div>
                <h3 className="text-ink font-bold text-[16px] mb-2">{title}</h3>
                <p className="text-muted text-[14px] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 bg-ink rounded-lg p-8 md:p-10 text-center">
          <h2 className="text-white font-black text-2xl md:text-3xl tracking-tight uppercase">Ready to find your part?</h2>
          <p className="text-white/70 text-[15px] mt-3 max-w-lg mx-auto">
            Browse our verified catalogue or reach out — our team is here to help you get the right fit.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap mt-6">
            <button
              onClick={() => navigate('vehicles')}
              className="h-11 px-6 rounded-md bg-brand text-white text-xs font-bold tracking-widest hover:bg-brand-600 transition-colors"
            >
              SHOP BY VEHICLE
            </button>
            <button
              onClick={() => navigate('contact')}
              className="h-11 px-6 rounded-md bg-white text-ink text-xs font-bold tracking-widest hover:bg-cream transition-colors"
            >
              CONTACT US
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
