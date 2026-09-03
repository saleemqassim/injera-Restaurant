'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const FROM        = process.env.FROM_EMAIL   || 'injerar@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL  || 'injerar@gmail.com';
const PHONE       = '+49 152 29547578';
const ADDRESS     = 'Brennerstraße 35 · 20099 Hamburg';
const WEBSITE     = 'https://injera-restaurant-six.vercel.app';
const LOGO_URL    = `${WEBSITE}/logo-seal-nobg.png`;

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
  const date   = new Date(y, m - 1, d);
  return `${days[date.getDay()]}, ${parseInt(d)}. ${months[parseInt(m) - 1]} ${y}`;
}

// ═══════════════════════════════════════════════════════════
// WRAPPER — outer table, controls max-width + background
// ═══════════════════════════════════════════════════════════
function wrap(inner) {
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>INJERA Restaurant Hamburg</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
  body, #bodyTable { margin:0!important; padding:0!important; background-color:#F0EAE0!important; }
  @media only screen and (max-width:600px) {
    .outer-wrap { width:100%!important; }
    .pad-cell  { padding-left:20px!important; padding-right:20px!important; }
    .info-card { padding:20px!important; }
    .logo-img  { width:56px!important; height:56px!important; }
    .hero-title { font-size:22px!important; }
  }
</style>
</head>
<body bgcolor="#F0EAE0" style="margin:0;padding:0;background-color:#F0EAE0;-webkit-font-smoothing:antialiased;">
<table id="bodyTable" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F0EAE0" style="background-color:#F0EAE0;">
<tr><td align="center" style="padding:32px 12px 48px;">

  <table class="outer-wrap" width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;">

    ${inner}

  </table>
</td></tr>
</table>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════
// HEADER — teal background, seal logo + INJERA wordmark
// ═══════════════════════════════════════════════════════════
function header(subtitle) {
  return `
<!-- HEADER -->
<tr>
  <td bgcolor="#21546A" style="background-color:#21546A;border-radius:6px 6px 0 0;padding:28px 40px 24px;" class="pad-cell">
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="68" style="vertical-align:middle;padding-right:16px;">
          <img src="${LOGO_URL}" alt="INJERA" width="64" height="64" class="logo-img"
               style="display:block;width:64px;height:64px;border:0;border-radius:50%;background:rgba(255,255,255,0.08);" />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;letter-spacing:0.14em;color:#FDFAF4;line-height:1;">INJERA</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(201,151,58,0.9);margin-top:4px;">Restaurant Hamburg</div>
          ${subtitle ? `<div style="font-family:Georgia,'Times New Roman',serif;font-size:12px;color:rgba(255,255,255,0.5);margin-top:8px;padding-top:8px;border-top:1px solid rgba(201,151,58,0.2);letter-spacing:0.05em;">${subtitle}</div>` : ''}
        </td>
      </tr>
    </table>
  </td>
</tr>
<!-- GOLD LINE -->
<tr><td bgcolor="#C9973A" height="3" style="background-color:#C9973A;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

// ═══════════════════════════════════════════════════════════
// RESERVATION INFO CARD — date, time, guests
// ═══════════════════════════════════════════════════════════
function infoCard(r) {
  return `
<!-- INFO CARD -->
<tr>
  <td bgcolor="#FDFAF4" style="background-color:#FDFAF4;padding:0 40px;" class="pad-cell">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="border:1px solid rgba(201,151,58,0.25);border-radius:4px;overflow:hidden;margin:24px 0 0;">
      <!-- Date row -->
      <tr bgcolor="#21546A" style="background-color:#21546A;">
        <td colspan="3" style="padding:12px 20px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(201,151,58,0.8);margin-bottom:2px;">Reservierung</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#FDFAF4;font-weight:700;">${formatDate(r.date)}</div>
        </td>
      </tr>
      <!-- Time / Guests -->
      <tr>
        <td width="50%" style="padding:16px 20px;vertical-align:middle;border-right:1px solid rgba(201,151,58,0.2);">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#C9973A;margin-bottom:4px;">Uhrzeit</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#21546A;line-height:1;">${r.time}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;color:rgba(46,26,14,0.4);margin-top:1px;letter-spacing:0.1em;">UHR</div>
        </td>
        <td width="50%" style="padding:16px 20px;vertical-align:middle;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#C9973A;margin-bottom:4px;">Personen</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#21546A;line-height:1;">${r.guests}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;color:rgba(46,26,14,0.4);margin-top:1px;letter-spacing:0.1em;">${parseInt(r.guests) === 1 ? 'PERSON' : 'PERSONEN'}</div>
        </td>
      </tr>
      ${r.note ? `
      <tr><td colspan="2" style="border-top:1px solid rgba(201,151,58,0.15);padding:12px 20px;background:#F5F0E8;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#C9973A;margin-bottom:3px;">Anmerkung</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:rgba(46,26,14,0.7);font-style:italic;">${r.note}</div>
      </td></tr>` : ''}
    </table>
  </td>
</tr>`;
}

// ═══════════════════════════════════════════════════════════
// CONTACT ROWS — admin only (phone, email, note)
// ═══════════════════════════════════════════════════════════
function contactCard(r) {
  const row = (icon, label, val) => `
    <tr>
      <td width="20" style="padding:5px 10px 5px 0;vertical-align:top;font-size:15px;">${icon}</td>
      <td width="90" style="font-family:Georgia,'Times New Roman',serif;font-size:12px;color:#C9973A;padding:6px 8px 6px 0;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#2E1A0E;padding:5px 0;vertical-align:top;">${val}</td>
    </tr>`;
  return `
<!-- CONTACT CARD -->
<tr>
  <td bgcolor="#FDFAF4" style="background-color:#FDFAF4;padding:16px 40px 0;" class="pad-cell">
    <table cellpadding="0" cellspacing="0" border="0"
           style="border:1px solid rgba(201,151,58,0.18);border-radius:4px;width:100%;background:#F5F0E8;padding:16px 20px;">
      <tr><td>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#C9973A;margin-bottom:10px;">Kontakt</div>
        <table cellpadding="0" cellspacing="0" border="0">
          ${row('📞', 'Telefon:', `<a href="tel:${r.phone.replace(/\s/g,'')}" style="color:#21546A;text-decoration:none;">${r.phone}</a>`)}
          ${r.email ? row('✉', 'E-Mail:', `<a href="mailto:${r.email}" style="color:#21546A;text-decoration:none;">${r.email}</a>`) : ''}
          ${r.name  ? row('👤', 'Name:', r.name) : ''}
        </table>
      </td></tr>
    </table>
  </td>
</tr>`;
}

// ═══════════════════════════════════════════════════════════
// BODY TEXT CELL
// ═══════════════════════════════════════════════════════════
function textCell(html, pt, pb) {
  return `
<tr>
  <td bgcolor="#FDFAF4" class="pad-cell" style="background-color:#FDFAF4;padding:${pt||28}px 40px ${pb||28}px;">
    ${html}
  </td>
</tr>`;
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════
const footer = `
<!-- GOLD BOTTOM LINE -->
<tr><td bgcolor="#C9973A" height="2" style="background-color:#C9973A;font-size:0;line-height:0;">&nbsp;</td></tr>
<!-- FOOTER -->
<tr>
  <td bgcolor="#21546A" style="background-color:#21546A;border-radius:0 0 6px 6px;padding:20px 40px 24px;text-align:center;" class="pad-cell">
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 6px;letter-spacing:0.04em;">${ADDRESS}</p>
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;margin:0;">
      <a href="tel:${PHONE.replace(/\s/g,'')}" style="color:#C9973A;text-decoration:none;letter-spacing:0.04em;">${PHONE}</a>
    </p>
    <div style="height:1px;background:rgba(201,151,58,0.25);margin:14px auto;width:60px;"></div>
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:11px;color:rgba(255,255,255,0.3);margin:0;letter-spacing:0.08em;text-transform:uppercase;">Eritreische &amp; Äthiopische Spezialitäten</p>
  </td>
</tr>`;

// ═══════════════════════════════════════════════════════════
// DIVIDER
// ═══════════════════════════════════════════════════════════
const divider = `<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(201,151,58,0.3),transparent);margin:20px 0;"></div>`;

const signature = `
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:rgba(46,26,14,0.5);margin:0 0 2px;">Herzliche Grüße</p>
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:rgba(46,26,14,0.45);margin:0;">Ihr INJERA Team</p>`;

// ═══════════════════════════════════════════════════════════
// GAST — Bestätigung (sofort bestätigt)
// ═══════════════════════════════════════════════════════════
function guestConfirmedHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
    ${header()}
    ${textCell(`
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#21546A;margin:0 0 12px;line-height:1.3;" class="hero-title">
        Tisch bestätigt, ${firstName}!
      </p>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:rgba(46,26,14,0.7);margin:0;line-height:1.9;">
        Vielen Dank für Ihre Reservierung. Ihr Tisch ist reserviert — wir freuen uns darauf, Sie bei uns begrüßen zu dürfen.
      </p>
    `, 32, 8)}
    ${infoCard(r)}
    ${textCell(`
      ${divider}
      ${signature}
    `, 20, 28)}
    ${footer}
  `);
}

// ═══════════════════════════════════════════════════════════
// GAST — Anfrage (pending — große Gruppe)
// ═══════════════════════════════════════════════════════════
function guestPendingHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
    ${header('Reservierungsanfrage')}
    ${textCell(`
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#21546A;margin:0 0 12px;line-height:1.3;" class="hero-title">
        Danke für Ihre Anfrage, ${firstName}!
      </p>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:rgba(46,26,14,0.7);margin:0;line-height:1.9;">
        Ihre Anfrage ist eingegangen. Da Ihre Gruppe eine besondere Tischkombination erfordert, prüfen wir die Verfügbarkeit und melden uns schnellstmöglich mit einer Bestätigung bei Ihnen.
      </p>
    `, 32, 8)}
    ${infoCard(r)}
    ${textCell(`
      ${divider}
      ${signature}
    `, 20, 28)}
    ${footer}
  `);
}

// ═══════════════════════════════════════════════════════════
// GAST — Statusänderung (bestätigt / abgesagt)
// ═══════════════════════════════════════════════════════════
function guestStatusUpdateHTML(r, status) {
  const confirmed  = status === 'confirmed';
  const firstName  = r.name.split(' ')[0];
  const sub        = confirmed ? 'Reservierungsbestätigung' : 'Reservierung abgesagt';
  const title      = confirmed ? `Ihr Tisch ist bestätigt, ${firstName}!` : `Liebe/r ${firstName},`;
  const body       = confirmed
    ? 'Ihre Reservierung im INJERA Restaurant ist offiziell bestätigt. Wir freuen uns auf Ihren Besuch!'
    : `leider müssen wir Ihre Reservierung aus betrieblichen Gründen absagen und entschuldigen uns aufrichtig.<br/><br/>Für einen neuen Wunschtermin rufen Sie uns bitte an: <a href="tel:${PHONE.replace(/\s/g,'')}" style="color:#21546A;text-decoration:none;">${PHONE}</a>`;
  return wrap(`
    ${header(sub)}
    ${textCell(`
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${confirmed ? '#21546A' : '#8B1A1A'};margin:0 0 12px;line-height:1.3;" class="hero-title">
        ${title}
      </p>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:rgba(46,26,14,0.7);margin:0;line-height:1.9;">${body}</p>
    `, 32, 8)}
    ${infoCard(r)}
    ${textCell(`
      ${divider}
      ${signature}
    `, 20, 28)}
    ${footer}
  `);
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Neue Buchung
// ═══════════════════════════════════════════════════════════
function adminNewBookingHTML(r) {
  const isPending = r.status === 'pending';
  return wrap(`
    ${header(isPending ? '⚠ Neue Anfrage — Bestätigung erforderlich' : 'Neue Reservierung eingegangen')}
    ${textCell(`
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#21546A;margin:0;" class="hero-title">
        ${r.name}
      </p>
      ${isPending ? `<p style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#C9973A;margin:6px 0 0;letter-spacing:0.08em;text-transform:uppercase;">Manuelle Bestätigung erforderlich</p>` : ''}
    `, 28, 8)}
    ${infoCard(r)}
    ${contactCard(r)}
    ${textCell(`<div style="height:1px;background:rgba(201,151,58,0.15);"></div>`, 16, 16)}
    ${footer}
  `);
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Statusänderung
// ═══════════════════════════════════════════════════════════
function adminStatusChangeHTML(r, status) {
  const confirmed = status === 'confirmed';
  const label     = confirmed ? '✓ Reservierung bestätigt' : '✕ Reservierung abgesagt';
  const color     = confirmed ? '#21546A' : '#8B1A1A';
  return wrap(`
    ${header(label)}
    ${textCell(`
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${color};margin:0 0 8px;">${label}</p>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#21546A;margin:0;" class="hero-title">${r.name}</p>
    `, 28, 8)}
    ${infoCard(r)}
    ${contactCard(r)}
    ${textCell(`<div style="height:1px;background:rgba(201,151,58,0.15);"></div>`, 16, 16)}
    ${footer}
  `);
}

// ═══════════════════════════════════════════════════════════
// TEST-E-MAIL
// ═══════════════════════════════════════════════════════════
function testEmailHTML() {
  const ts = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  return wrap(`
    ${header('Systemtest')}
    ${textCell(`
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#21546A;margin:0 0 12px;">E-Mail-System aktiv ✓</p>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:rgba(46,26,14,0.6);margin:0;line-height:1.8;">
        Das E-Mail-Benachrichtigungssystem des INJERA Restaurants funktioniert korrekt.<br/>
        <span style="color:#C9973A;">Gesendet: ${ts}</span>
      </p>
      ${divider}
      ${signature}
    `, 32, 32)}
    ${footer}
  `);
}

// ═══════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════
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
    const r        = reservation;
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
