import { useState, useEffect, useCallback } from 'react'
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
  const [saved, setSaved] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const all = await getAllNotes()
    setNotes(all)
    return all
  }, [])

  useEffect(() => { load() }, [load])

  function selectNote(note) {
    setSelected(note)
    setTitle(note.title)
    setContent(note.content)
    setSaved(true)
  }

  function newNote() {
    setSelected(null)
    setTitle('')
    setContent('')
    setSaved(true)
  }

  async function handleSave() {
    if (!title.trim() && !content.trim()) return
    const note = { ...(selected || {}), title: title.trim() || 'Untitled', content }
    const id = await saveNote(note)
    const all = await load()
    const updated = all.find((n) => n.id === (selected?.id || id))
    if (updated) setSelected(updated)
    setSaved(true)
  }

  async function handleDelete() {
    if (!selected) return
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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between gap-3">
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

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 49px)' }}>

        {/* Sidebar */}
        <aside className="w-64 border-r border-white/[0.06] flex flex-col flex-shrink-0">
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
              onChange={(e) => { setTitle(e.target.value); setSaved(false) }}
              placeholder="Note title"
              className="flex-1 text-lg font-bold bg-transparent text-white placeholder-white/20 focus:outline-none"
            />
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {!saved && (
                <span className="text-[10px] text-white/30">unsaved</span>
              )}
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
              <button
                onClick={handleSave}
                disabled={saved && !!selected}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold transition-colors disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setSaved(false) }}
            placeholder="Start writing..."
            className="flex-1 resize-none px-6 py-4 bg-transparent text-sm text-white/80 placeholder-white/15 focus:outline-none leading-relaxed"
          />

          <div className="px-6 py-2 border-t border-white/[0.06] flex items-center justify-between">
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
