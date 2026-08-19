import { useState, useEffect, useRef } from 'react'

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso + 'Z').getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function App() {
  const [notes, setNotes] = useState(null)
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(null)
  const contentRef = useRef(null)

  async function loadNotes() {
    try {
      const res = await fetch('/api/notes')
      if (!res.ok) throw new Error('Request failed')
      setNotes(await res.json())
      setError(null)
    } catch {
      setError('Could not reach the database. Is `npm run dev` still running?')
    }
  }

  useEffect(() => {
    loadNotes()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content }),
      })
      if (!res.ok) throw new Error('Request failed')
      const note = await res.json()
      setNotes((prev) => [note, ...(prev || [])])
      setContent('')
      contentRef.current?.focus()
      setError(null)
    } catch {
      setError('Could not save that note.')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    } catch {
      loadNotes()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg space-y-8">

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Cloudflare D1
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Serverless Guestbook</h1>
          <p className="text-white/30 text-sm max-w-sm mx-auto">
            {isLocal
              ? 'Every note here lives in a real SQL database, not in this browser. Reload the page and it is still there - deploy this to see it work across devices.'
              : 'Every note here lives in a real SQL database at the edge, not in this browser. Reload, switch devices, ask a friend to open this page - same notes.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Name (optional)"
            maxLength={40}
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/40 transition-colors"
          />
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Leave a note..."
            rows={3}
            maxLength={280}
            className="w-full resize-none bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/40 transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/15">{content.length}/280</span>
            <button
              type="submit"
              disabled={!content.trim() || posting}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:hover:bg-amber-600 font-semibold transition-colors text-sm"
            >
              {posting ? 'Saving...' : 'Save to D1'}
            </button>
          </div>
        </form>

        {error && (
          <p className="text-xs text-rose-400/80 text-center">{error}</p>
        )}

        <div className="space-y-2">
          {notes === null ? (
            <p className="text-center text-white/20 text-sm">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-white/20 text-sm">No notes yet. Be the first.</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="group flex items-start justify-between gap-3 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white/80 whitespace-pre-wrap break-words">{note.content}</p>
                  <p className="text-[10px] text-white/25 mt-1">
                    {note.author || 'Anonymous'} - {timeAgo(note.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-rose-400 transition-all flex-shrink-0 text-xs"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="text-center">
          <a href="https://ismyapp.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/10 hover:text-white/30 transition-colors">
            build-it-small by ismyapp
          </a>
        </div>
      </div>
    </div>
  )
}
