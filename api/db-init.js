'use strict';

const PROJECT_REF = 'aotalenadjmvfiwcbddl';

const SETUP_SQL = `
DO $$
BEGIN
  -- settings Tabelle
  CREATE TABLE IF NOT EXISTS settings (
    key   text primary key,
    value jsonb not null
  );
  ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='anon_read_settings'
  ) THEN
    CREATE POLICY "anon_read_settings" ON settings FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='auth_all_settings'
  ) THEN
    CREATE POLICY "auth_all_settings" ON settings FOR ALL TO authenticated USING (true);
  END IF;
END $$;
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    return res.status(503).json({
      ok: false,
      error: 'SUPABASE_ACCESS_TOKEN nicht gesetzt',
      hint: 'Supabase Dashboard → Account → Access Tokens → neuen Token erstellen → als Vercel-Env-Var hinzufügen'
    });
  }

  try {
    const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SETUP_SQL }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(500).json({ ok: false, error: data.message || `HTTP ${r.status}`, detail: data });
    }

    return res.status(200).json({ ok: true, message: 'DB setup erfolgreich' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
