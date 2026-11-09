// Entrega al panel de los novios las respuestas del formulario "confirmaciones".
// Variables en Netlify (Site configuration > Environment variables):
//   NETLIFY_TOKEN  -> token personal de Netlify (User settings > Applications > Personal access tokens)
//   PANEL_SITE_ID  -> el Site ID del sitio (Site configuration > General)

const API = 'https://api.netlify.com/api/v1';

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export default async () => {
  const token = process.env.NETLIFY_TOKEN;
  const siteId = process.env.PANEL_SITE_ID || process.env.SITE_ID;
  if (!token || !siteId) return json({ error: 'config' }, 500);
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const rForms = await fetch(`${API}/sites/${siteId}/forms`, { headers });
    if (!rForms.ok) return json({ error: 'netlify' }, 502);
    const form = (await rForms.json()).find((f) => f.name === 'confirmaciones');
    if (!form) return json({ respuestas: [] });

    let todas = [];
    for (let page = 1; page <= 20; page++) {
      const r = await fetch(`${API}/forms/${form.id}/submissions?per_page=100&page=${page}`, { headers });
      if (!r.ok) return json({ error: 'netlify' }, 502);
      const lote = await r.json();
      todas = todas.concat(lote);
      if (lote.length < 100) break;
    }

    return json({
      respuestas: todas.map((s) => {
        const d = s.data || {};
        return {
          fecha: s.created_at,
          nombre: String(d.nombre || '').trim(),
          asiste: String(d.asistencia || '').startsWith('Sí'),
          personas: parseInt(d.personas, 10) || 0,
          mensaje: String(d.mensaje || '').trim()
        };
      })
    });
  } catch (e) {
    return json({ error: 'netlify' }, 502);
  }
};
