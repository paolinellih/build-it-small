export async function onRequestDelete({ params, env }) {
  await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(params.id).run()
  return new Response(null, { status: 204 })
}
