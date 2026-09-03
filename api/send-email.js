'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const FROM        = process.env.FROM_EMAIL   || 'injerar@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL  || 'injerar@gmail.com';
const PHONE       = '+49 152 29547578';
const ADDRESS     = 'Brennerstraße 35 · 20099 Hamburg';
const WEBSITE     = 'https://injera-restaurant-six.vercel.app';

const ses = new SESClient({ region: process.env.AWS_REGION || 'eu-central-1' });

async function sendMail({ to, subject, html }) {
  const cmd = new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body:    { Html:    { Data: html,    Charset: 'UTF-8' } },
    },
  });
  return ses.send(cmd);
}

function formatDate(iso) {
  if (!iso) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// ── Outer wrapper ─────────────────────────────────────────────────────────────
function wrap(body) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <title>INJERA Restaurant Hamburg</title>
</head>
<body bgcolor="#F5F0E8" style="margin:0;padding:0;background-color:#F5F0E8;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F0E8" style="background-color:#F5F0E8;">
<tr><td align="center" style="padding:32px 16px 48px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
${body}
</table>
</td></tr>
</table>
</body></html>`;
}

// ── Logo header ───────────────────────────────────────────────────────────────
function logoRow() {
  return `
<tr><td bgcolor="#21546A" style="background-color:#21546A;padding:24px 40px 20px;border-radius:4px 4px 0 0;">
  <table cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align:middle;">
        <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;letter-spacing:0.2em;color:#C9973A;">INJERA</div>
        <div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-top:2px;">R E S T A U R A N T</div>
      </td>
    </tr>
  </table>
</td></tr>`;
}

// ── Info rows ─────────────────────────────────────────────────────────────────
function infoRows(r) {
  const row = (label, value) => `
  <tr>
    <td style="font-family:Georgia,serif;font-size:15px;color:#C9973A;padding:6px 0;white-space:nowrap;width:110px;">${label}</td>
    <td style="font-family:Georgia,serif;font-size:15px;color:#2E1A0E;padding:6px 0 6px 12px;font-weight:bold;">${value}</td>
  </tr>`;
  return `
<tr><td bgcolor="#FDFAF4" style="background-color:#FDFAF4;border-left:1px solid rgba(201,151,58,0.2);border-right:1px solid rgba(201,151,58,0.2);padding:4px 40px 16px;">
  <table cellpadding="0" cellspacing="0">
    ${row('Datum:', formatDate(r.date))}
    ${row('Uhrzeit:', r.time + ' Uhr')}
    ${row('Personen:', r.guests)}
  </table>
</td></tr>`;
}

// ── Footer ────────────────────────────────────────────────────────────────────
const footerRow = `
<tr><td bgcolor="#F5F0E8" style="background-color:#F5F0E8;border:1px solid rgba(201,151,58,0.18);border-top:none;border-radius:0 0 4px 4px;padding:20px 40px 28px;text-align:center;">
  <div style="width:40px;height:1px;background:rgba(201,151,58,0.35);margin:0 auto 18px;"></div>
  <p style="font-family:Georgia,serif;font-size:13px;color:rgba(46,26,14,0.5);margin:4px 0;">${ADDRESS}</p>
  <p style="font-family:Georgia,serif;font-size:13px;margin:4px 0;"><a href="tel:${PHONE.replace(/\s/g,'')}" style="color:#21546A;text-decoration:none;">${PHONE}</a></p>
</td></tr>`;

// Body cell wrapper
const bodyCell = (content, pt, pb) =>
  `<tr><td bgcolor="#FDFAF4" style="background-color:#FDFAF4;border-left:1px solid rgba(201,151,58,0.2);border-right:1px solid rgba(201,151,58,0.2);padding:${pt||36}px 40px ${pb||36}px;">${content}</td></tr>`;

// ── Contact rows (admin only) ─────────────────────────────────────────────────
function contactRows(r) {
  const row = (label, value) => `
  <tr>
    <td style="font-family:Georgia,serif;font-size:14px;color:#C9973A;padding:5px 0;white-space:nowrap;width:110px;">${label}</td>
    <td style="font-family:Georgia,serif;font-size:14px;color:#2E1A0E;padding:5px 0 5px 12px;">${value}</td>
  </tr>`;
  return `
<tr><td bgcolor="#FDFAF4" style="background-color:#FDFAF4;border-left:1px solid rgba(201,151,58,0.2);border-right:1px solid rgba(201,151,58,0.2);padding:0 40px 20px;">
  <div style="height:1px;background:rgba(201,151,58,0.12);margin-bottom:12px;"></div>
  <table cellpadding="0" cellspacing="0">
    ${row('Telefon:', `<a href="tel:${r.phone.replace(/\s/g,'')}" style="color:#21546A;text-decoration:none;">${r.phone}</a>`)}
    ${r.email ? row('E-Mail:', `<a href="mailto:${r.email}" style="color:#21546A;text-decoration:none;">${r.email}</a>`) : ''}
    ${r.note ? row('Hinweis:', r.note) : ''}
  </table>
</td></tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAST: Reservierung bestätigt
// ─────────────────────────────────────────────────────────────────────────────
function guestConfirmedHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#21546A;margin:0 0 16px;line-height:1.4;">Wir freuen uns auf Sie, ${firstName}!</p>
    <p style="font-family:Georgia,serif;font-size:15px;color:rgba(46,26,14,0.7);margin:0;line-height:1.8;">Vielen Dank für Ihre Reservierung im INJERA Restaurant. Ihr Tisch ist reserviert — wir freuen uns auf Ihren Besuch.</p>
  `, 36, 16)}

  ${infoRows(r)}

  ${bodyCell(`
    <div style="height:1px;background:rgba(201,151,58,0.18);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.5);margin:0 0 4px;">Herzliche Grüße</p>
    <p style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.45);margin:0;">Ihr INJERA Team</p>
  `, 0, 36)}

  ${footerRow}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// GAST: Anfrage eingegangen (pending — große Gruppe)
// ─────────────────────────────────────────────────────────────────────────────
function guestPendingHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#21546A;margin:0 0 16px;line-height:1.4;">Danke für Ihre Anfrage, ${firstName}!</p>
    <p style="font-family:Georgia,serif;font-size:15px;color:rgba(46,26,14,0.7);margin:0;line-height:1.8;">Wir prüfen die Verfügbarkeit für Ihre Gruppe und melden uns so schnell wie möglich mit einer Bestätigung.</p>
  `, 36, 16)}

  ${infoRows(r)}

  ${bodyCell(`
    <div style="height:1px;background:rgba(201,151,58,0.18);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.5);margin:0 0 4px;">Herzliche Grüße</p>
    <p style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.45);margin:0;">Ihr INJERA Team</p>
  `, 0, 36)}

  ${footerRow}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// GAST: Statusänderung (bestätigt / abgesagt)
// ─────────────────────────────────────────────────────────────────────────────
function guestStatusUpdateHTML(r, status) {
  const confirmed = status === 'confirmed';
  const firstName = r.name.split(' ')[0];
  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#21546A;margin:0 0 16px;line-height:1.4;">${confirmed ? `Ihr Tisch ist bestätigt, ${firstName}!` : `Liebe/r ${firstName},`}</p>
    <p style="font-family:Georgia,serif;font-size:15px;color:rgba(46,26,14,0.7);margin:0;line-height:1.8;">${
      confirmed
        ? 'Ihre Reservierung im INJERA Restaurant ist offiziell bestätigt. Wir freuen uns darauf, Sie bald bei uns begrüßen zu dürfen.'
        : `leider müssen wir Ihre Reservierung absagen und entschuldigen uns aufrichtig. Für einen neuen Termin rufen Sie uns bitte an:<br><br><a href="tel:${PHONE.replace(/\s/g,'')}" style="color:#21546A;text-decoration:none;">${PHONE}</a>`
    }</p>
  `, 36, 16)}

  ${infoRows(r)}

  ${bodyCell(`
    <div style="height:1px;background:rgba(201,151,58,0.18);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.5);margin:0 0 4px;">Herzliche Grüße</p>
    <p style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.45);margin:0;">Ihr INJERA Team</p>
  `, 0, 36)}

  ${footerRow}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Neue Buchung
// ─────────────────────────────────────────────────────────────────────────────
function adminNewBookingHTML(r) {
  const isPending = r.status === 'pending';
  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C9973A;margin:0 0 10px;">${isPending ? '⚠ Neue Anfrage — Bestätigung erforderlich' : 'Neue Reservierung'}</p>
    <p style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#21546A;margin:0;">${r.name}</p>
  `, 36, 16)}

  ${infoRows(r)}
  ${contactRows(r)}

  ${bodyCell(`<div style="height:1px;background:rgba(201,151,58,0.12);"></div>`, 8, 8)}

  ${footerRow}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Statusänderung
// ─────────────────────────────────────────────────────────────────────────────
function adminStatusChangeHTML(r, status) {
  const confirmed = status === 'confirmed';
  const color = confirmed ? '#21546A' : '#C0392B';
  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${color};margin:0 0 10px;">${confirmed ? '✓ Reservierung bestätigt' : '✕ Reservierung abgesagt'}</p>
    <p style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#21546A;margin:0;">${r.name}</p>
  `, 36, 16)}

  ${infoRows(r)}
  ${contactRows(r)}

  ${bodyCell(`<div style="height:1px;background:rgba(201,151,58,0.12);"></div>`, 8, 8)}

  ${footerRow}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test-E-Mail
// ─────────────────────────────────────────────────────────────────────────────
function testEmailHTML() {
  const ts = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:Georgia,serif;font-size:16px;color:#21546A;margin:0 0 12px;font-weight:700;">E-Mail-System aktiv.</p>
    <p style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.55);margin:0;line-height:1.8;">Das Benachrichtigungssystem des INJERA Restaurants funktioniert korrekt.<br/>Gesendet: ${ts}</p>
  `, 36, 36)}

  ${footerRow}`);
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, reservation, to } = req.body || {};

  try {
    if (type === 'test') {
      const target = to || ADMIN_EMAIL;
      await sendMail({ to: target, subject: 'INJERA Restaurant — E-Mail-System Test', html: testEmailHTML() });
      return res.status(200).json({ ok: true, sent: 1, to: target });
    }

    if (!type || !reservation) return res.status(400).json({ error: 'type und reservation erforderlich' });
    const r = reservation;
    const promises = [];

    if (type === 'new') {
      const isPending = r.status === 'pending';
      promises.push(sendMail({
        to: ADMIN_EMAIL,
        subject: isPending
          ? `⚠ Anfrage: ${r.name} · ${formatDate(r.date)} · ${r.time} · ${r.guests} Pers.`
          : `Neue Reservierung: ${r.name} · ${formatDate(r.date)} · ${r.time} · ${r.guests} Pers.`,
        html: adminNewBookingHTML(r),
      }));
      if (r.email) {
        promises.push(sendMail({
          to: r.email,
          subject: isPending
            ? `Ihre Reservierungsanfrage — INJERA Restaurant · ${formatDate(r.date)}`
            : `Reservierungsbestätigung — INJERA Restaurant · ${formatDate(r.date)}`,
          html: isPending ? guestPendingHTML(r) : guestConfirmedHTML(r),
        }));
      }
    } else if (type === 'status') {
      if (r.email) {
        promises.push(sendMail({
          to: r.email,
          subject: r.status === 'confirmed'
            ? `Reservierungsbestätigung — INJERA Restaurant · ${formatDate(r.date)}`
            : `Ihre Reservierung — INJERA Restaurant · ${formatDate(r.date)}`,
          html: guestStatusUpdateHTML(r, r.status),
        }));
      }
      promises.push(sendMail({
        to: ADMIN_EMAIL,
        subject: `${r.status === 'confirmed' ? '✓' : '✕'} ${r.name} · ${r.status === 'confirmed' ? 'Bestätigt' : 'Abgesagt'} · ${formatDate(r.date)} · ${r.time}`,
        html: adminStatusChangeHTML(r, r.status),
      }));
    }

    const results = await Promise.allSettled(promises);
    const sent    = results.filter(p => p.status === 'fulfilled').length;
    const errors  = results.filter(p => p.status === 'rejected').map(p => p.reason?.message);
    if (errors.length) console.error('E-Mail Fehler:', errors);
    res.status(200).json({ ok: true, sent, errors: errors.length ? errors : undefined });

  } catch (err) {
    console.error('send-email error:', err);
    res.status(500).json({ error: err.message });
  }
};
