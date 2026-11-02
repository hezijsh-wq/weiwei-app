// Only public client credentials are returned. Never expose service-role keys.
module.exports = function handler(req, res) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  let configured = false;
  try {
    const parsed = new URL(url);
    configured = parsed.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname) && Boolean(key);
    if (key.startsWith('sb_secret_')) configured = false;
    if (key.startsWith('eyJ')) {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      if (payload.role !== 'anon') configured = false;
    } else if (!key.startsWith('sb_publishable_')) configured = false;
  } catch { configured = false; }
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(configured ? {configured:true, url, key} : {configured:false}));
};
