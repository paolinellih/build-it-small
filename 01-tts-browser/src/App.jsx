import { useState, useEffect, useRef } from 'react'

const SAMPLES = [
  {
    label: 'English',
    lang: 'en-US',
    text: 'The Web Speech API lets your browser speak any text out loud, with no server, no API key, and no cost.',
  },
  {
    label: 'Spanish',
    lang: 'es-ES',
    text: 'La API de Voz del navegador convierte texto en voz sin necesidad de servidor ni clave de API. Es tecnologia del futuro, disponible hoy.',
  },
  {
    label: 'Portuguese',
    lang: 'pt-BR',
    text: 'A API de Fala do navegador transforma texto em voz sem servidor e sem custo. A mesma tecnologia usada pela Alexa e pelo Google Assistente.',
  },
  {
    label: 'French',
    lang: 'fr-FR',
    text: "L'API Web Speech permet a votre navigateur de lire n'importe quel texte a voix haute, sans serveur, sans cle API et sans frais.",
  },
  {
    label: 'German',
    lang: 'de-DE',
    text: 'Die Web Speech API ermoglicht es Ihrem Browser, jeden Text laut vorzulesen - ohne Server, ohne API-Schlussel und ohne Kosten.',
  },
]

export default function App() {
  const [text, setText] = useState(SAMPLES[0].text)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [supported, setSupported] = useState(true)
  const utteranceRef = useRef(null)

  useEffect(() => {
    if (!window.speechSynthesis) {
      setSupported(false)
      return
    }

    function loadVoices() {
      setVoices(window.speechSynthesis.getVoices())
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  function speak() {
    if (!text.trim()) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch

    if (selectedVoice) {
      utterance.voice = voices.find((v) => v.name === selectedVoice) || null
    }

    utterance.onstart = () => { setSpeaking(true); setPaused(false) }
    utterance.onend = () => { setSpeaking(false); setPaused(false) }
    utterance.onerror = () => { setSpeaking(false); setPaused(false) }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  function togglePause() {
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }

  function stop() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  if (!supported) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <p className="text-red-400 text-center">
          Your browser does not support the Web Speech API.<br />
          Try Chrome, Edge, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Web Speech API - zero server, zero cost
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Text to Speech</h1>
          <p className="text-gray-400 text-sm">
            Your browser speaks - same technology used by Alexa, Siri, and Google Assistant.
          </p>
        </div>

        {/* Sample text buttons - one per language */}
        <div className="flex flex-wrap gap-2 justify-center">
          {SAMPLES.map((s) => (
            <button
              key={s.lang}
              onClick={() => {
                setText(s.text)
                const match = voices.find((v) => v.lang.startsWith(s.lang.slice(0, 2)))
                if (match) setSelectedVoice(match.name)
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Text area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type anything here and hit Speak..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 resize-y text-sm leading-relaxed"
        />

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Voice selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 uppercase tracking-widest">Voice</label>
            <select
              value={selectedVoice || ''}
              onChange={(e) => setSelectedVoice(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Browser default</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
              Speed - {rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Pitch */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40 uppercase tracking-widest">
              Pitch - {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {!speaking ? (
            <button
              onClick={speak}
              disabled={!text.trim()}
              className="flex-1 py-3 rounded-xl bg-indigo-600 font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Speak
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className="flex-1 py-3 rounded-xl bg-yellow-600 font-semibold hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
              >
                {paused ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Resume
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    Pause
                  </>
                )}
              </button>
              <button
                onClick={stop}
                className="px-6 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-600/30 transition-colors"
              >
                Stop
              </button>
            </>
          )}
        </div>

        {/* Speaking indicator */}
        {speaking && !paused && (
          <div className="flex items-center justify-center gap-2 text-sm text-indigo-400">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            Speaking...
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-white/20">
          Built with the{' '}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/40"
          >
            Web Speech API
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
