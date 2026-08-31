import { lazy, Suspense } from 'react'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { NavProvider, useNav } from './context/NavContext'
import { AuthProvider } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import { StoreSettingsProvider } from './context/StoreSettingsContext'
import { NotificationProvider } from './context/NotificationContext'
import CartDrawer from './components/CartDrawer'
import CustomerOrderToast from './components/CustomerOrderToast'
import ErrorBoundary from './components/ErrorBoundary'

// Dynamic imports for code-splitting
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Vehicles = lazy(() => import('./pages/Vehicles'))
const Category = lazy(() => import('./pages/Category'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const Settings = lazy(() => import('./pages/Settings'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Messages = lazy(() => import('./pages/Messages'))
const Support = lazy(() => import('./pages/Support'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const PaymentCancelled = lazy(() => import('./pages/PaymentCancelled'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

function PageFallback() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-3 border-brand border-t-transparent animate-spin" />
    </div>
  )
}

function Router() {
  const { page } = useNav()

  return (
    <Suspense fallback={<PageFallback />}>
      {(() => {
        if (page === 'login') return <Login />
        if (page === 'register') return <Register />
        if (page === 'vehicles') return <Vehicles />
        if (page === 'category') return <Category />
        if (page === 'orders') return <MyOrders />
        if (page === 'track') return <TrackOrder />
        if (page === 'settings') return <Settings />
        if (page === 'about') return <About />
        if (page === 'contact') return <Contact />
        if (page === 'dashboard') return <Dashboard />
        if (page === 'messages') return <Messages />
        if (page === 'support') return <Support />
        if (page === 'payment-success') return <PaymentSuccess />
        if (page === 'payment-cancelled') return <PaymentCancelled />
        if (page === 'reset-password') return <ResetPassword />
        return <Home />
      })()}
    </Suspense>
  )
}

function App() {
  return (
    <ToastProvider>
      <StoreSettingsProvider>
        <LocaleProvider>
          <AuthProvider>
            <NotificationProvider>
              <NavProvider>
                <CartProvider>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                  <CartDrawer />
                  <CustomerOrderToast />
                </CartProvider>
              </NavProvider>
            </NotificationProvider>
          </AuthProvider>
        </LocaleProvider>
      </StoreSettingsProvider>
    </ToastProvider>
  )
}

export default App
