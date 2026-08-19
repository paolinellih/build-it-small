export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, author, content, created_at FROM notes ORDER BY id DESC LIMIT 100'
  ).all()
  return Response.json(results)
}

export async function onRequestPost({ request, env }) {
  const { author, content } = await request.json()
  if (!content || !content.trim()) {
    return Response.json({ error: 'content is required' }, { status: 400 })
  }
  const { results } = await env.DB.prepare(
    'INSERT INTO notes (author, content) VALUES (?, ?) RETURNING id, author, content, created_at'
  ).bind(author?.trim() || 'Anonymous', content.trim()).all()
  return Response.json(results[0], { status: 201 })
}
