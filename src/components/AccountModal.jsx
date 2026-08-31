import { UserCircle2, LogIn, UserPlus } from 'lucide-react'
import Modal from './Modal'
import { useNav } from '../context/NavContext'
import { useAuth } from '../context/AuthContext'

export default function AccountModal({ open, onClose }) {
  const { navigate } = useNav()
  const { isAuthed } = useAuth()

  function go(path) {
    onClose()
    navigate(path)
  }

  if (isAuthed) return null

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8 text-center">
        <span className="inline-flex w-14 h-14 rounded-full bg-cream items-center justify-center text-brand mx-auto">
          <UserCircle2 size={28} />
        </span>
        <h3 className="mt-4 font-black text-xl text-ink">Your AutoGenuine account</h3>
        <p className="mt-1.5 text-muted text-[14px]">Sign in to track orders, or create an account to check out faster next time.</p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={() => go('login')}
            className="flex items-center justify-center gap-2 h-12 rounded-md bg-ink text-white text-xs font-bold tracking-widest hover:bg-ink-soft transition-colors"
          >
            <LogIn size={15} /> SIGN IN
          </button>
          <button
            onClick={() => go('register')}
            className="flex items-center justify-center gap-2 h-12 rounded-md border border-line text-xs font-bold tracking-widest hover:border-brand hover:text-brand transition-colors"
          >
            <UserPlus size={15} /> CREATE ACCOUNT
          </button>
        </div>
      </div>
    </Modal>
  )
}
