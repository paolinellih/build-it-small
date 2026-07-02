import { useState, useEffect, useRef } from 'react'

const LANGUAGES = [
  { label: 'English (US)', lang: 'en-US' },
  { label: 'English (UK)', lang: 'en-GB' },
  { label: 'Spanish', lang: 'es-ES' },
  { label: 'Portuguese (BR)', lang: 'pt-BR' },
  { label: 'French', lang: 'fr-FR' },
  { label: 'German', lang: 'de-DE' },
  { label: 'Italian', lang: 'it-IT' },
  { label: 'Japanese', lang: 'ja-JP' },
]

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function App() {
  const [supported] = useState(() => !!SpeechRecognition)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [lang, setLang] = useState('en-US')
  const [copied, setCopied] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  function start() {
    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e) => {
      let final = ''
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + ' '
        } else {
          interimText += e.results[i][0].transcript
        }
      }
      if (final) setTranscript((prev) => prev + final)
      setInterim(interimText)
    }

    recognition.onend = () => {
      setListening(false)
      setInterim('')
    }

    recognition.onerror = () => {
      setListening(false)
      setInterim('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stop() {
    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
  }

  function clear() {
    stop()
    setTranscript('')
    setInterim('')
  }

  async function copy() {
    const text = (transcript + interim).trim()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const text = (transcript + interim).trim()
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcript.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const wordCount = (transcript + interim).trim().split(/\s+/).filter(Boolean).length
  const hasContent = !!(transcript + interim).trim()

  if (!supported) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-red-400">Your browser does not support the SpeechRecognition API.</p>
          <p className="text-white/40 text-sm">Try Chrome or Edge on desktop.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            SpeechRecognition API - zero server, zero cost
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Speech to Text</h1>
          <p className="text-gray-400 text-sm">
            Your browser listens - same technology used by voice assistants, now free in every browser.
          </p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-white/40 uppercase tracking-widest whitespace-nowrap">Language</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={listening}
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-rose-500/50 disabled:opacity-50"
          >
            {LANGUAGES.map((l) => (
              <option key={l.lang} value={l.lang}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Transcript area */}
        <div
          className="min-h-48 w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm leading-relaxed cursor-text"
          onClick={() => !listening && start()}
        >
          {!hasContent && !listening && (
            <span className="text-white/20">Click here or press the button below to start speaking...</span>
          )}
          <span className="text-white">{transcript}</span>
          <span className="text-white/40">{interim}</span>
          {listening && !interim && (
            <span className="inline-flex gap-1 ml-1 align-middle">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-3 bg-rose-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Word count */}
        {hasContent && (
          <p className="text-xs text-white/20 text-right -mt-3">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </p>
        )}

        {/* Record button */}
        <div className="flex items-center gap-3">
          {!listening ? (
            <button
              onClick={start}
              className="flex-1 py-3 rounded-xl bg-rose-600 font-semibold hover:bg-rose-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"/>
              </svg>
              Start Recording
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 font-semibold hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-3 h-3 rounded-sm bg-white" />
              Stop
            </button>
          )}

          <button
            onClick={copy}
            disabled={!hasContent}
            title="Copy to clipboard"
            className="px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            {copied ? (
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          <button
            onClick={download}
            disabled={!hasContent}
            title="Download as .txt"
            className="px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <button
            onClick={clear}
            disabled={!hasContent}
            title="Clear"
            className="px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20">
          Built with the{' '}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/40"
          >
            SpeechRecognition API
          </a>
          {' '}- part of the{' '}
          <a href="https://ismyapp.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/40">
            ismyapp
          </a>
          {' '}build-it-small series
        </p>

      </div>
    </div>
  )
}
