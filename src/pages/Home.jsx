import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Hero from '../components/Hero'
import FeatureBar from '../components/FeatureBar'
import CategorySection from '../components/CategorySection'
import VehicleCards from '../components/VehicleCards'
import VinSection from '../components/VinSection'
import HowItWorks from '../components/HowItWorks'
import PopularProducts from '../components/PopularProducts'
import PaymentSection from '../components/PaymentSection'
import ReturnsSection from '../components/ReturnsSection'
import WhatsappCTA from '../components/WhatsappCTA'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />
      <Hero />
      <FeatureBar />
      <CategorySection />
      <VehicleCards />
      <VinSection />
      <HowItWorks />
      <PopularProducts />
      <PaymentSection />
      <ReturnsSection />
      <WhatsappCTA />
      <Footer />
    </div>
  )
}
