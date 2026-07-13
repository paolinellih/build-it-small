import { useState, useEffect, useCallback, useRef } from 'react'
import { getAllNotes, saveNote, deleteNote } from './db'

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function App() {
  const [notes, setNotes] = useState([])
  const [selected, setSelected] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'unsaved'
  const [deleting, setDeleting] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const autoSaveTimer = useRef(null)
  const selectedRef = useRef(null)
  const titleRef = useRef('')
  const contentRef = useRef('')

  selectedRef.current = selected
  titleRef.current = title
  contentRef.current = content

  const load = useCallback(async () => {
    const all = await getAllNotes()
    setNotes(all)
    return all
  }, [])

  useEffect(() => { load() }, [load])

  // Exit focus mode on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && focusMode) setFocusMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusMode])

  const doSave = useCallback(async (t, c, sel) => {
    if (!t.trim() && !c.trim()) return
    setSaveStatus('saving')
    const note = { ...(sel || {}), title: t.trim() || 'Untitled', content: c }
    const id = await saveNote(note)
    const all = await getAllNotes()
    setNotes(all)
    const updated = all.find((n) => n.id === (sel?.id || id))
    if (updated) setSelected(updated)
    setSaveStatus('saved')
  }, [])

  function scheduleAutoSave() {
    setSaveStatus('unsaved')
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      doSave(titleRef.current, contentRef.current, selectedRef.current)
    }, 1500)
  }

  function selectNote(note) {
    clearTimeout(autoSaveTimer.current)
    setSelected(note)
    setTitle(note.title)
    setContent(note.content)
    setSaveStatus('saved')
  }

  function newNote() {
    clearTimeout(autoSaveTimer.current)
    setSelected(null)
    setTitle('')
    setContent('')
    setSaveStatus('saved')
  }

  async function handleDelete() {
    if (!selected) return
    clearTimeout(autoSaveTimer.current)
    await deleteNote(selected.id)
    await load()
    newNote()
    setDeleting(false)
  }

  function handleExport() {
    const data = JSON.stringify(notes, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notes.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = notes.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )

  const statusLabel = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'
  const statusColor = saveStatus === 'saved' ? 'text-emerald-500/50' : 'text-white/30'

  return (
    <div className={`min-h-screen bg-gray-950 text-white flex flex-col transition-all duration-500 ${focusMode ? 'bg-gray-950' : ''}`}>

      {/* Header */}
      <header className={`border-b border-white/[0.06] px-4 py-3 flex items-center justify-between gap-3 transition-opacity duration-300 ${focusMode ? 'opacity-0 pointer-events-none h-0 py-0 overflow-hidden border-0' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            IndexedDB - zero server, zero cost
          </div>
          <h1 className="text-sm font-bold hidden sm:block">Local Notes</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={notes.length === 0}
            title="Export all as JSON"
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30"
          >
            Export
          </button>
          <button
            onClick={newNote}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold transition-colors"
          >
            + New
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: focusMode ? '100vh' : 'calc(100vh - 49px)' }}>

        {/* Sidebar */}
        <aside className={`border-r border-white/[0.06] flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden ${focusMode ? 'w-0 border-0' : 'w-64'}`}>
          <div className="p-3 border-b border-white/[0.06]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/20"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-white/20 text-center py-8 px-4">
                {search ? 'No matches' : 'No notes yet. Hit + New to start.'}
              </p>
            ) : (
              filtered.map((note) => (
                <button
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors ${
                    selected?.id === note.id ? 'bg-white/[0.06]' : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-white/80 truncate">{note.title || 'Untitled'}</p>
                  <p className="text-[10px] text-white/30 mt-0.5 truncate">{note.content || 'No content'}</p>
                  <p className="text-[10px] text-white/20 mt-1">{formatDate(note.updatedAt)}</p>
                </button>
              ))
            )}
          </div>

          <div className="p-3 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/20 text-center">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'} - stored locally
            </p>
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); scheduleAutoSave() }}
              placeholder="Note title"
              className="flex-1 text-lg font-bold bg-transparent text-white placeholder-white/20 focus:outline-none"
            />
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <span className={`text-[10px] transition-colors ${statusColor}`}>{statusLabel}</span>

              {/* Focus mode toggle */}
              <button
                onClick={() => setFocusMode((f) => !f)}
                title={focusMode ? 'Exit focus mode (Esc)' : 'Focus mode'}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                {focusMode ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M9 15H4.5M9 15v4.5M15 15v4.5M15 15h4.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>

              {selected && !deleting && (
                <button
                  onClick={() => setDeleting(true)}
                  className="text-xs px-3 py-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                >
                  Delete
                </button>
              )}
              {deleting && (
                <>
                  <span className="text-xs text-white/40">Sure?</span>
                  <button onClick={handleDelete} className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">Yes</button>
                  <button onClick={() => setDeleting(false)} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">No</button>
                </>
              )}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); scheduleAutoSave() }}
            placeholder="Start writing..."
            className={`flex-1 resize-none bg-transparent text-white/80 placeholder-white/15 focus:outline-none leading-relaxed transition-all duration-300 ${
              focusMode ? 'px-16 py-12 text-base max-w-2xl mx-auto w-full' : 'px-6 py-4 text-sm'
            }`}
          />

          <div className={`px-6 py-2 border-t border-white/[0.06] flex items-center justify-between transition-opacity duration-300 ${focusMode ? 'opacity-20' : ''}`}>
            <p className="text-[10px] text-white/20">
              {wordCount(content)} words
            </p>
            <a
              href="https://ismyapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-white/15 hover:text-white/30 transition-colors"
            >
              build-it-small by ismyapp
            </a>
          </div>
        </main>

      </div>
    </div>
  )
}
