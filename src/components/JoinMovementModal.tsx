import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Sparkles, Vote, X } from 'lucide-react'

interface JoinMovementModalProps {
  open: boolean
  onClose: () => void
}

const benefits = [
  { icon: Heart, text: 'Support ideas and volunteer drives' },
  { icon: Vote, text: 'Vote in Quick Youth Polls' },
  { icon: Sparkles, text: 'Get your private Youth Voice ID' },
]

export default function JoinMovementModal({ open, onClose }: JoinMovementModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-[min(calc(100%-2rem),28rem)] max-w-md rounded-2xl border-0 bg-transparent p-0 shadow-none"
      aria-labelledby="join-movement-title"
      aria-describedby="join-movement-desc"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        <div
          className="absolute inset-0 bg-linear-to-br from-accent-50/90 via-white to-brand-50/50"
          aria-hidden
        />
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <span className="inline-flex rounded-2xl bg-accent-600 p-3 text-white shadow-lg shadow-accent-600/30">
            <Sparkles className="h-6 w-6" aria-hidden />
          </span>

          <h2 id="join-movement-title" className="mt-5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Join the Movement
          </h2>
          <p id="join-movement-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
            Create an account to contribute, support ideas, vote in polls, and become part of
            ForFuture.
          </p>

          <ul className="mt-5 space-y-2.5" aria-label="Member benefits">
            {benefits.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 text-sm text-slate-700 shadow-sm"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <Link to="/signup" onClick={onClose} className="btn-primary w-full">
              Create Account
            </Link>
            <Link to="/login" onClick={onClose} className="btn-secondary w-full">
              Log In
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost w-full text-slate-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
