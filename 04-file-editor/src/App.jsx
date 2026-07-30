import { useState, useRef, useEffect, useCallback } from 'react'

const supported = 'showOpenFilePicker' in window

function wordCount(t) {
  return t.trim().split(/\s+/).filter(Boolean).length
}

function lineCount(t) {
  return t ? t.split('\n').length : 0
}

export default function App() {
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'unsaved' | 'saving' | 'saved'
  const [autoSave, setAutoSave] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [newFileActive, setNewFileActive] = useState(false)
  const fileHandleRef = useRef(null)
  const autoSaveTimer = useRef(null)
  const contentRef = useRef('')
  contentRef.current = content

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && focusMode) setFocusMode(false)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (fileHandleRef.current) handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusMode])

  const handleSave = useCallback(async () => {
    if (!fileHandleRef.current) return
    setSaveStatus('saving')
    try {
      const writable = await fileHandleRef.current.createWritable()
      await writable.write(contentRef.current)
      await writable.close()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('unsaved')
    }
  }, [])

  function scheduleAutoSave() {
    setSaveStatus('unsaved')
    if (!autoSave || !fileHandleRef.current) return
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(handleSave, 1500)
  }

  async function openFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Text files', accept: { 'text/*': ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html', '.py'] } }],
      })
      const file = await handle.getFile()
      const text = await file.text()
      fileHandleRef.current = handle
      setFileName(file.name)
      setContent(text)
      setSaveStatus('idle')
      setNewFileActive(false)
    } catch {}
  }

  async function saveAs() {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName || 'untitled.txt',
        types: [{ description: 'Text files', accept: { 'text/plain': ['.txt', '.md'] } }],
      })
      fileHandleRef.current = handle
      setFileName(handle.name)
      await handleSave()
    } catch {}
  }

  function newFile() {
    fileHandleRef.current = null
    setFileName(null)
    setContent('')
    setSaveStatus('idle')
    setNewFileActive(true)
  }

  const statusColor = {
    idle: 'text-white/20',
    unsaved: 'text-amber-400/60',
    saving: 'text-white/30',
    saved: 'text-emerald-400/70',
  }[saveStatus]

  const statusLabel = {
    idle: fileName ? 'No changes' : '',
    unsaved: 'Unsaved',
    saving: 'Saving...',
    saved: 'Saved',
  }[saveStatus]

  if (!supported) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <p className="text-white/70">Your browser does not support the File System Access API.</p>
          <p className="text-white/30 text-sm">Try Chrome or Edge on desktop.</p>
        </div>
      </div>
    )
  }

  const hasFile = !!fileName || newFileActive

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className={`border-b border-white/[0.06] px-4 py-3 flex items-center justify-between gap-3 transition-all duration-300 ${focusMode ? 'opacity-0 pointer-events-none h-0 py-0 overflow-hidden border-0' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex-shrink-0">
            File System Access API
          </div>
          {fileName && (
            <span className="text-sm text-white/50 truncate">{fileName}</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Auto-save toggle */}
          {hasFile && fileHandleRef.current && (
            <button
              onClick={() => setAutoSave((a) => !a)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                autoSave
                  ? 'border-violet-500/40 text-violet-400 bg-violet-500/10'
                  : 'border-white/10 text-white/30 hover:text-white/60'
              }`}
            >
              Auto-save {autoSave ? 'on' : 'off'}
            </button>
          )}

          <button
            onClick={newFile}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors"
          >
            New
          </button>
          <button
            onClick={openFile}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors"
          >
            Open
          </button>
          {hasFile && !fileHandleRef.current && (
            <button
              onClick={saveAs}
              className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold transition-colors"
            >
              Save as
            </button>
          )}
          {hasFile && fileHandleRef.current && (
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold transition-colors"
            >
              Save
            </button>
          )}
        </div>
      </header>

      {/* Editor */}
      {!hasFile ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">File Editor</h1>
            <p className="text-white/30 text-sm max-w-sm">
              Open any text file from your computer. Edit it. Save it back - no upload, no download, no middleman.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openFile}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-colors text-sm"
            >
              Open a file
            </button>
            <button
              onClick={newFile}
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-white/50 hover:text-white font-semibold transition-colors text-sm"
            >
              New file
            </button>
          </div>
          <p className="text-[11px] text-white/15">Supports .txt .md .js .jsx .ts .json .css .html .py</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ height: focusMode ? '100vh' : 'calc(100vh - 49px)' }}>
          {/* Toolbar */}
          <div className={`flex items-center justify-between px-6 py-2 border-b border-white/[0.04] transition-all duration-300 ${focusMode ? 'opacity-0 pointer-events-none h-0 py-0 overflow-hidden border-0' : ''}`}>
            <span className={`text-[10px] transition-colors ${statusColor}`}>{statusLabel}</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/20">{lineCount(content)} lines</span>
              <span className="text-[10px] text-white/20">{wordCount(content)} words</span>
              <span className="text-[10px] text-white/20">{content.length} chars</span>
              <button
                onClick={() => setFocusMode((f) => !f)}
                title={focusMode ? 'Exit focus mode (Esc)' : 'Focus mode'}
                className="text-white/25 hover:text-white/60 transition-colors"
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
            </div>
          </div>

          {/* Focus mode controls */}
          {focusMode && (
            <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
              <span className={`text-[10px] ${statusColor}`}>{statusLabel}</span>
              <button
                onClick={handleSave}
                className="text-[10px] px-2 py-1 rounded bg-violet-600/80 hover:bg-violet-500 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setFocusMode(false)}
                className="text-white/20 hover:text-white/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M9 15H4.5M9 15v4.5M15 15v4.5M15 15h4.5" />
                </svg>
              </button>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); scheduleAutoSave() }}
            placeholder="Start typing..."
            spellCheck={false}
            className={`flex-1 resize-none bg-transparent text-white/80 placeholder-white/10 focus:outline-none leading-relaxed font-mono text-sm transition-all duration-300 ${
              focusMode ? 'px-16 py-16 max-w-3xl mx-auto w-full text-base font-sans' : 'px-6 py-5'
            }`}
          />

          <div className={`px-6 py-2 border-t border-white/[0.04] flex items-center justify-between transition-opacity duration-300 ${focusMode ? 'opacity-0' : ''}`}>
            <span className="text-[10px] text-white/15">Ctrl+S to save</span>
            <a href="https://ismyapp.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/10 hover:text-white/30 transition-colors">
              build-it-small by ismyapp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
