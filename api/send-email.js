'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const fs   = require('fs');
const path = require('path');

const FROM        = process.env.FROM_EMAIL   || 'injerar@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL  || 'injerar@gmail.com';
const PHONE       = '+49 152 29547578';
const ADDRESS     = 'Brennerstraße 35 · 20099 Hamburg';

// Embed logo as base64 so Gmail always shows it without "show images" prompt
let LOGO_SRC;
try {
  const logoPath = path.join(__dirname, '..', 'logo-transparent.png');
  const logoB64  = fs.readFileSync(logoPath).toString('base64');
  LOGO_SRC = `data:image/png;base64,${logoB64}`;
} catch {
  LOGO_SRC = 'https://injera-restaurant-six.vercel.app/logo-transparent.png';
}

const ses = new SESClient({ region: process.env.AWS_REGION || 'eu-central-1' });

async function sendMail({ to, subject, html }) {
  return ses.send(new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body:    { Html: { Data: html, Charset: 'UTF-8' } },
    },
  }));
}

function formatDate(iso) {
  if (!iso) return iso;
  const [y, m, d] = iso.split('-');
  const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const days   = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const date   = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return `${days[date.getDay()]}, ${parseInt(d)}. ${months[parseInt(m)-1]} ${y}`;
}

// ─────────────────────────────────────────────────────────────
// WRAPPER
// ─────────────────────────────────────────────────────────────
function wrap(inner) {
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>INJERA Restaurant Hamburg</title>
<style>
  body, table, td { -webkit-text-size-adjust:100%; mso-line-height-rule:exactly; }
  body { margin:0; padding:0; background-color:#F0EAE0; }
  @media only screen and (max-width:600px) {
    .email-wrap  { width:100%!important; }
    .pad         { padding-left:20px!important; padding-right:20px!important; }
    .logo-img    { width:180px!important; height:auto!important; }
    .hero-text   { font-size:20px!important; }
    .info-col    { display:block!important; width:100%!important; border-right:none!important; border-bottom:1px solid rgba(201,151,58,0.2)!important; }
  }
</style>
</head>
<body bgcolor="#F0EAE0" style="margin:0;padding:0;background-color:#F0EAE0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F0EAE0">
<tr><td align="center" style="padding:28px 12px 44px;">
<table class="email-wrap" width="600" cellpadding="0" cellspacing="0" border="0"
       style="max-width:600px;width:100%;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

${inner}

</table>
</td></tr>
</table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────
// HEADER — ivory background, full logo
// ─────────────────────────────────────────────────────────────
function header(tag) {
  return `
<tr>
  <td bgcolor="#FDFAF4" style="background-color:#FDFAF4;padding:28px 40px 20px;border-bottom:3px solid #C9973A;" class="pad">
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td>
          <img src="${LOGO_SRC}" alt="INJERA Restaurant" width="220" height="auto" class="logo-img"
               style="display:block;width:220px;height:auto;border:0;max-width:100%;"/>
          <div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(33,84,106,0.55);margin-top:5px;">Eritreische &amp; Äthiopische Spezialitäten</div>
        </td>
        ${tag ? `<td align="right" style="vertical-align:bottom;">
          <div style="display:inline-block;background:#21546A;color:#FDFAF4;font-family:Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;padding:5px 12px;border-radius:2px;">${tag}</div>
        </td>` : ''}
      </tr>
    </table>
  </td>
</tr>`;
}

// ─────────────────────────────────────────────────────────────
// HERO — greeting text
// ─────────────────────────────────────────────────────────────
function hero(title, body) {
  return `
<tr>
  <td bgcolor="#FDFAF4" style="background-color:#FDFAF4;padding:32px 40px 8px;" class="pad">
    <h1 class="hero-text" style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#21546A;margin:0 0 12px;line-height:1.3;">${title}</h1>
    <p style="font-family:Georgia,serif;font-size:15px;color:rgba(46,26,14,0.72);margin:0;line-height:1.9;">${body}</p>
  </td>
</tr>`;
}

// ─────────────────────────────────────────────────────────────
// RESERVATION CARD — date / time / guests
// ─────────────────────────────────────────────────────────────
function resCard(r) {
  return `
<tr>
  <td bgcolor="#FDFAF4" style="background-color:#FDFAF4;padding:24px 40px 0;" class="pad">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="border:1px solid rgba(33,84,106,0.18);border-radius:6px;overflow:hidden;">

      <!-- Date header -->
      <tr>
        <td bgcolor="#21546A" colspan="3" style="background-color:#21546A;padding:14px 22px;">
          <div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(201,151,58,0.85);margin-bottom:3px;">Reservierungsdatum</div>
          <div style="font-family:Georgia,serif;font-size:17px;font-weight:700;color:#FDFAF4;">${formatDate(r.date)}</div>
        </td>
      </tr>

      <!-- Time + Guests -->
      <tr>
        <td width="50%" class="info-col" style="padding:18px 22px;vertical-align:middle;border-right:1px solid rgba(201,151,58,0.18);background:#FDFAF4;">
          <div style="font-family:Georgia,serif;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#C9973A;margin-bottom:6px;">Uhrzeit</div>
          <div style="font-family:Georgia,serif;font-size:32px;font-weight:700;color:#21546A;line-height:1;">${r.time}</div>
          <div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.16em;color:rgba(46,26,14,0.35);margin-top:2px;">UHR</div>
        </td>
        <td width="50%" class="info-col" style="padding:18px 22px;vertical-align:middle;background:#FDFAF4;">
          <div style="font-family:Georgia,serif;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#C9973A;margin-bottom:6px;">Personen</div>
          <div style="font-family:Georgia,serif;font-size:32px;font-weight:700;color:#21546A;line-height:1;">${r.guests}</div>
          <div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.16em;color:rgba(46,26,14,0.35);margin-top:2px;">${parseInt(r.guests) === 1 ? 'PERSON' : 'PERSONEN'}</div>
        </td>
      </tr>

      <!-- Note (if present) -->
      ${r.note ? `
      <tr>
        <td colspan="2" bgcolor="#F5F0E8" style="background-color:#F5F0E8;padding:12px 22px;border-top:1px solid rgba(201,151,58,0.15);">
          <div style="font-family:Georgia,serif;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#C9973A;margin-bottom:3px;">Anmerkung</div>
          <div style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.65);font-style:italic;">${r.note}</div>
        </td>
      </tr>` : ''}
    </table>
  </td>
</tr>`;
}

// ─────────────────────────────────────────────────────────────
// CONTACT CARD — admin only
// ─────────────────────────────────────────────────────────────
function contactCard(r) {
  const row = (label, val) => `
    <tr>
      <td style="font-family:Georgia,serif;font-size:12px;color:#C9973A;padding:6px 16px 6px 0;white-space:nowrap;vertical-align:top;letter-spacing:0.06em;">${label}</td>
      <td style="font-family:Georgia,serif;font-size:14px;color:#2E1A0E;padding:6px 0;vertical-align:top;">${val}</td>
    </tr>`;
  return `
<tr>
  <td bgcolor="#FDFAF4" style="background-color:#FDFAF4;padding:20px 40px 0;" class="pad">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="border:1px solid rgba(201,151,58,0.2);border-radius:6px;background:#F5F0E8;padding:16px 22px;">
      <tr><td>
        <div style="font-family:Georgia,serif;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#21546A;margin-bottom:12px;">Kontaktdaten</div>
        <table cellpadding="0" cellspacing="0" border="0">
          ${row('Name', r.name)}
          ${row('Telefon', `<a href="tel:${(r.phone||'').replace(/\s/g,'')}" style="color:#21546A;text-decoration:none;">${r.phone}</a>`)}
          ${r.email ? row('E-Mail', `<a href="mailto:${r.email}" style="color:#21546A;text-decoration:none;">${r.email}</a>`) : ''}
        </table>
      </td></tr>
    </table>
  </td>
</tr>`;
}

// ─────────────────────────────────────────────────────────────
// CANCEL LINK CELL — guest emails only
// ─────────────────────────────────────────────────────────────
function cancelCell(r) {
  if (!r.id) return '';
  const cancelUrl = `https://injera-restaurant-six.vercel.app/?cancel=${r.id}`;
  const hours = r.cancelHours ?? 2;
  const hint  = hours === 0
    ? 'Sie können jederzeit kostenlos stornieren.'
    : `Kostenlose Stornierung bis ${hours} Stunde${hours === 1 ? '' : 'n'} vor dem Termin.`;
  return `
<tr>
  <td bgcolor="#F5F0E8" style="background-color:#F5F0E8;padding:16px 40px;border-top:1px solid rgba(201,151,58,0.15);" class="pad">
    <p style="font-family:Georgia,serif;font-size:12px;color:rgba(46,26,14,0.45);margin:0 0 8px;">${hint}</p>
    <a href="${cancelUrl}"
       style="font-family:Georgia,serif;font-size:13px;color:#21546A;text-decoration:underline;">
      Reservierung stornieren
    </a>
  </td>
</tr>`;
}

// ─────────────────────────────────────────────────────────────
// SIGNATURE
// ─────────────────────────────────────────────────────────────
function signatureCell() {
  return `
<tr>
  <td bgcolor="#FDFAF4" style="background-color:#FDFAF4;padding:24px 40px 32px;" class="pad">
    <div style="height:1px;background:linear-gradient(90deg,rgba(201,151,58,0.5),rgba(201,151,58,0.1));margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:14px;color:rgba(46,26,14,0.5);margin:0 0 2px;">Herzliche Grüße,</p>
    <p style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#21546A;margin:0;">Ihr INJERA Team</p>
  </td>
</tr>`;
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
const footerRow = `
<tr>
  <td bgcolor="#F5F0E8" style="background-color:#F5F0E8;padding:20px 40px 24px;text-align:center;border-top:1px solid rgba(201,151,58,0.2);" class="pad">
    <p style="font-family:Georgia,serif;font-size:12px;color:rgba(46,26,14,0.5);margin:0 0 5px;letter-spacing:0.04em;">${ADDRESS}</p>
    <p style="font-family:Georgia,serif;font-size:12px;margin:0 0 5px;">
      <a href="tel:${PHONE.replace(/\s/g,'')}" style="color:#21546A;text-decoration:none;">${PHONE}</a>
    </p>
    <p style="font-family:Georgia,serif;font-size:11px;color:rgba(46,26,14,0.3);margin:10px 0 0;letter-spacing:0.06em;text-transform:uppercase;">Eritreische &amp; Äthiopische Spezialitäten</p>
  </td>
</tr>`;

// ─────────────────────────────────────────────────────────────
// GAST — Bestätigung
// ─────────────────────────────────────────────────────────────
function guestConfirmedHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
    ${header('Reservierungsbestätigung')}
    ${hero(
      `Ihr Tisch ist reserviert, ${firstName}!`,
      `Vielen Dank für Ihre Reservierung im INJERA Restaurant. Wir freuen uns darauf, Sie bei uns begrüßen zu dürfen.`
    )}
    ${resCard(r)}
    ${cancelCell(r)}
    ${signatureCell()}
    ${footerRow}
  `);
}

// ─────────────────────────────────────────────────────────────
// GAST — Anfrage (pending)
// ─────────────────────────────────────────────────────────────
function guestPendingHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
    ${header('Reservierungsanfrage')}
    ${hero(
      `Danke für Ihre Anfrage, ${firstName}!`,
      `Ihre Anfrage ist eingegangen. Da Ihre Gruppe eine besondere Tischkombination erfordert, prüfen wir die Verfügbarkeit und melden uns schnellstmöglich mit einer Bestätigung.`
    )}
    ${resCard(r)}
    ${cancelCell(r)}
    ${signatureCell()}
    ${footerRow}
  `);
}

// ─────────────────────────────────────────────────────────────
// GAST — Statusänderung
// ─────────────────────────────────────────────────────────────
function guestStatusUpdateHTML(r, status) {
  const confirmed = status === 'confirmed';
  const firstName = r.name.split(' ')[0];
  return wrap(`
    ${header(confirmed ? 'Reservierungsbestätigung' : 'Reservierung abgesagt')}
    ${hero(
      confirmed ? `Ihr Tisch ist bestätigt, ${firstName}!` : `Liebe/r ${firstName},`,
      confirmed
        ? `Ihre Reservierung im INJERA Restaurant ist offiziell bestätigt. Wir freuen uns auf Ihren Besuch!`
        : `leider müssen wir Ihre Reservierung absagen und entschuldigen uns aufrichtig. Für einen neuen Termin rufen Sie uns bitte an: <a href="tel:${PHONE.replace(/\s/g,'')}" style="color:#21546A;">${PHONE}</a>`
    )}
    ${resCard(r)}
    ${signatureCell()}
    ${footerRow}
  `);
}

// ─────────────────────────────────────────────────────────────
// ADMIN — Neue Buchung
// ─────────────────────────────────────────────────────────────
function adminNewBookingHTML(r) {
  const isPending = r.status === 'pending';
  return wrap(`
    ${header(isPending ? '⚠ Neue Anfrage' : 'Neue Reservierung')}
    ${hero(
      r.name,
      isPending
        ? `Eine neue Tischreservierungsanfrage ist eingegangen. Bitte bestätigen oder absagen Sie diese im Admin-Panel.`
        : `Eine neue Tischreservierung wurde automatisch bestätigt.`
    )}
    ${resCard(r)}
    ${contactCard(r)}
    ${signatureCell()}
    ${footerRow}
  `);
}

// ─────────────────────────────────────────────────────────────
// ADMIN — Statusänderung
// ─────────────────────────────────────────────────────────────
function adminStatusChangeHTML(r, status) {
  const confirmed = status === 'confirmed';
  return wrap(`
    ${header(confirmed ? '✓ Bestätigt' : '✕ Abgesagt')}
    ${hero(
      r.name,
      confirmed
        ? `Die Reservierung wurde bestätigt. Eine Bestätigungs-E-Mail wurde an den Gast gesendet.`
        : `Die Reservierung wurde abgesagt. Eine Absage-E-Mail wurde an den Gast gesendet.`
    )}
    ${resCard(r)}
    ${contactCard(r)}
    ${signatureCell()}
    ${footerRow}
  `);
}

// ─────────────────────────────────────────────────────────────
// TEST
// ─────────────────────────────────────────────────────────────
function testEmailHTML() {
  const ts = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  return wrap(`
    ${header('Systemtest')}
    ${hero('E-Mail-System aktiv ✓', `Das Benachrichtigungssystem des INJERA Restaurants funktioniert korrekt.<br/><br/>Gesendet: <strong style="color:#21546A;">${ts}</strong>`)}
    ${signatureCell()}
    ${footerRow}
  `);
}

// ─────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────
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
          : `🍽 Neue Reservierung: ${r.name} · ${formatDate(r.date)} · ${r.time} · ${r.guests} Pers.`,
        html: adminNewBookingHTML(r),
      }));
      if (r.email) {
        promises.push(sendMail({
          to: r.email,
          subject: isPending
            ? `Reservierungsanfrage — INJERA Restaurant · ${formatDate(r.date)}`
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
