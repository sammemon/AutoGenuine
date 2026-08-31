import { useEffect } from 'react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChatWorkspace from '../components/chat/ChatWorkspace'
import { useAuth } from '../context/AuthContext'
import { useNav } from '../context/NavContext'

export default function Messages() {
  const { isAuthed, loading } = useAuth()
  const { params, navigate } = useNav()

  useEffect(() => {
    if (!loading && !isAuthed) navigate('login')
  }, [isAuthed, loading, navigate])

  if (loading || !isAuthed) return null

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="container-content px-4 md:px-6 py-6 flex-1 w-full">
        <ChatWorkspace
          initialConversationId={params.conversationId}
          initialParticipantId={params.participantId}
          initialOrderRef={params.orderRef}
          initialProductSlug={params.productSlug}
        />
      </main>
      <Footer />
    </div>
  )
}
