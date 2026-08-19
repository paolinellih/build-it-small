# Build it Small, Ship it Real

A series of minimal but complete web apps for developers - each one teaches a real technology used by big companies, and every project runs locally with two commands.

> Written by [Henrique Paolinelli](https://linkedin.com/in/henriquepaolinelli) - Senior Software Engineer
> Full articles at [ismyapp.com/blog](https://ismyapp.com/#blog)

---

## How to use this repo

Each folder is a self-contained project. Pick any one:

```bash
cd 01-tts-browser
npm install
npm run dev
```

That is it. No global installs, no environment variables (until the later projects that need them).

---

## The Series

| # | Project | Tech | Used by | Article |
|---|---------|------|---------|---------|
| 01 | [TTS Browser](./01-tts-browser) | Web Speech API | Alexa, Siri, Google Assistant | [Read](https://ismyapp.com/blog/tts-browser) |
| 02 | [STT Browser](./02-stt-browser) | Web Speech API | Otter.ai, Google Docs | - |
| 03 | [IndexedDB Notes](./03-indexeddb-notes) | IndexedDB | Notion, Apple Notes | - |
| 04 | [File Editor](./04-file-editor) | File System Access API | VS Code (web), CodeSandbox | - |
| 05 | [Serverless DB](./05-serverless-db) | Cloudflare D1 | Supabase, Firebase | - |
| 06 | Scheduled Jobs *(coming soon)* | Cloudflare Workers CRON | AWS Lambda, Azure Functions | - |
| 07 | Auth in 10 min *(coming soon)* | Clerk | Auth0, AWS Cognito | - |
| 08 | Send Emails *(coming soon)* | Resend | SendGrid, Mailchimp | - |
| 09 | AI Inference *(coming soon)* | Groq | OpenAI, Claude | - |
| 10 | Full Stack *(coming soon)* | Everything above | Real SaaS companies | - |

---

## Philosophy

- Every project fits in one folder
- Every project runs with `npm install && npm run dev`
- Every project is the same stack as real production apps, just smaller
- Every project links to a real company that uses the same technology at scale

---

## License

MIT - clone it, fork it, ship it, make it yours.
