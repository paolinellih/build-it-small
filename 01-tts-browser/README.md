# 01 - Text to Speech in the Browser

A minimal Text to Speech app using the native **Web Speech API** - no server, no API key, no cost.

> Part of the [build-it-small series](https://ismyapp.com/blog) by [Henrique Paolinelli](https://linkedin.com/in/henriquepaolinelli)

## Live Demo

[tts.ismyapp.com](https://tts.ismyapp.com) *(coming soon)*

## What it does

- Type any text and click **Speak**
- Choose from all voices installed on your OS/browser
- Control speed (0.5x to 2x) and pitch
- Pause, resume, and stop mid-sentence

## The tech

The entire feature is one browser API - no packages needed:

```js
const utterance = new SpeechSynthesisUtterance('Hello world')
utterance.rate = 1.2
utterance.voice = speechSynthesis.getVoices()[0]
speechSynthesis.speak(utterance)
```

That is it. The same technology powers:
- **Amazon Alexa** - voice responses
- **Apple Siri** - text read-back
- **Google Assistant** - spoken answers
- **Audible** - narrated articles feature

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Make it yours

Ideas to extend this project:
- Add a file upload to read `.txt` files aloud
- Save favourite voice settings to `localStorage`
- Add a word-highlight effect as each word is spoken (use `SpeechSynthesisUtterance.onboundary`)
- Turn it into a browser extension
- Add language auto-detection using the browser's `navigator.language`

## Deploy free on GitHub Pages

1. Push this folder to a GitHub repo
2. Go to **Settings - Pages**
3. Set source to **GitHub Actions**
4. Add this workflow at `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Your app will be live at `https://yourusername.github.io/tts-browser`
