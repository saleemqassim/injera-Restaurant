// Supabase Edge Function: send-push-order
// Database Webhook: INSERT auf bestellungen → Push an alle Geräte
// Keys werden als Env-Variablen gesetzt (nicht im Code):
//   supabase secrets set VAPID_PUBLIC=... VAPID_PRIVATE=... VAPID_SUBJECT=mailto:injerar@gmail.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function makeVapidJwt(endpoint: string, pubKey: string, privKeyB64: string, subject: string) {
  const header  = { alg: 'ES256', typ: 'JWT' };
  const payload = { aud: new URL(endpoint).origin, exp: Math.floor(Date.now()/1000)+43200, sub: subject };
  const enc = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const unsigned = `${enc(header)}.${enc(payload)}`;
  const keyBytes = Uint8Array.from(atob(privKeyB64.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name:'ECDSA', namedCurve:'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return `${unsigned}.${sigB64}`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  const body = await req.json().catch(() => null);
  const order = body?.record || body;
  if (!order?.id) return new Response('no order', { status: 400 });

  const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC')!;
  const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE')!;
  const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:injerar@gmail.com';

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: subs } = await db.from('push_subscriptions').select('endpoint, keys');
  if (!subs?.length) return new Response('no subscribers');

  const fmtEuro = (c: number) => (c/100).toFixed(2).replace('.',',') + ' €';
  const payload = JSON.stringify({
    title: `🛍 Neue Bestellung #${order.id}`,
    body:  `${order.name||'Unbekannt'} · ${fmtEuro(order.total||0)} · Tippen zum Drucken`,
    orderId: String(order.id),
  });

  const results = await Promise.allSettled(subs.map(async (s: any) => {
    const jwt = await makeVapidJwt(s.endpoint, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT);
    return fetch(s.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC}`, 'Content-Type': 'application/json', 'TTL': '86400' },
      body: payload,
    });
  }));

  const ok = results.filter(r => r.status === 'fulfilled').length;
  return new Response(JSON.stringify({ sent: ok, total: subs.length }));
});
