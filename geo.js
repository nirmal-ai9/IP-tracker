// Vercel Serverless Function: user-initiated approximate IP geolocation.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const clean = v => typeof v === 'string' && v.trim() ? v.trim() : null;
const first = v => v ? v.split(',')[0].trim() : null;

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // On Vercel, forwarded and geo headers are supplied by the platform proxy.
  const ip = first(req.headers['x-forwarded-for']) || clean(req.headers['x-real-ip']);
  const geo = {
    city: clean(req.headers['x-vercel-ip-city']),
    region: clean(req.headers['x-vercel-ip-country-region']),
    country: clean(req.headers['x-vercel-ip-country']),
    latitude: clean(req.headers['x-vercel-ip-latitude']),
    longitude: clean(req.headers['x-vercel-ip-longitude']),
    timezone: clean(req.headers['x-vercel-ip-timezone'])
  };
  if (ip && (geo.country || geo.city || geo.latitude || geo.longitude)) {
    return res.status(200).json({ ip, ...geo, source: 'Vercel request metadata', note: 'Approximate IP-based location; not GPS.' });
  }

  // Optional third-party fallback; the queried IP is sent to ipwho.is.
  if (process.env.GEO_FALLBACK !== 'false') {
    try {
      const url = ip ? `https://ipwho.is/${encodeURIComponent(ip)}` : 'https://ipwho.is/';
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json();
        if (d.success !== false) return res.status(200).json({
          ip: clean(d.ip) || ip || null, city: clean(d.city), region: clean(d.region), country: clean(d.country),
          latitude: typeof d.latitude === 'number' ? d.latitude : null,
          longitude: typeof d.longitude === 'number' ? d.longitude : null,
          timezone: clean(d.timezone && d.timezone.id), isp: clean(d.connection && d.connection.isp),
          source: 'ipwho.is fallback', note: 'Approximate IP-based location; not GPS.'
        });
      }
    } catch (_) { /* return partial metadata below */ }
  }
  return res.status(200).json({ ip: ip || null, ...geo, source: 'Partial request metadata', note: 'Some fields unavailable; location may be inaccurate.' });
};
