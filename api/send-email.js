'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const FROM          = process.env.FROM_EMAIL     || 'injerar@gmail.com';
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL    || 'injerar@gmail.com';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL  || 'injerar@gmail.com';
const PHONE         = '+49 40 000 00 00';
const ADDRESS       = 'St. Georg · 20097 Hamburg';
const WEBSITE       = 'https://www.injera-restaurant.de';
const ICON_URL      = `${WEBSITE}/logo-icon-original.png`;

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
  <meta name="supported-color-schemes" content="light"/>
  <title>Injera Restaurant</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant+SC:wght@700;800&display=swap');
    :root { color-scheme: light !important; }
    .bg-outer { background-color: #080501 !important; }
    .bg-card  { background-color: #0f0703 !important; }
    .bg-foot  { background-color: #060402 !important; }
    @media only screen and (max-width:600px) {
      .outer-td { padding: 20px 8px 36px !important; }
      .main-table { width: 100% !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      .logo-area { padding: 20px 20px !important; }
      .logo-img { width: 60px !important; height: 40px !important; }
      .logo-name { font-size: 20px !important; letter-spacing: 0.18em !important; }
      .logo-under { font-size: 10px !important; letter-spacing: 0.25em !important; }
      .logo-divider { height: 28px !important; }
      .body-text { font-size: 15px !important; }
    }
  </style>
</head>
<body bgcolor="#080501" style="margin:0;padding:0;background-color:#080501;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#080501" style="background-color:#080501;">
<tr><td align="center" bgcolor="#080501" class="outer-td bg-outer" style="background-color:#080501;padding:40px 16px 56px;">
<table width="560" cellpadding="0" cellspacing="0" class="main-table" style="max-width:560px;width:100%;">
${body}
</table>
</td></tr>
</table>
</body></html>`;
}

// ── Logo header — schwarz-gold, email-kompatibel ──────────────────────────────
function logoRow(sublabel) {
  return `
<tr><td bgcolor="#C09040" height="3" style="background-color:#C09040;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td bgcolor="#0f0703" class="logo-area" style="background-color:#0f0703;padding:28px 52px 24px;">
  <table cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align:middle;">
        <img src="${ICON_URL}" alt="Injera Restaurant" width="80" height="54" class="logo-img"
          style="display:block;width:80px;height:54px;object-fit:cover;object-position:left center;border:0;filter:drop-shadow(0 0 12px rgba(192,144,64,0.45)) brightness(1.1);" />
      </td>
      <td style="vertical-align:middle;padding:0 10px;">
        <div class="logo-divider" style="width:1px;height:36px;background:linear-gradient(to bottom,transparent,rgba(192,144,64,0.45),transparent);font-size:0;">&nbsp;</div>
      </td>
      <td style="vertical-align:top;padding-top:14px;text-align:left;">
        <div class="logo-name" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:25.6px;font-weight:700;letter-spacing:0.26em;white-space:nowrap;line-height:1.05;">
          <span style="color:#F5EDD8;font-weight:700;">Injera</span>
        </div>
        <div class="logo-under" style="font-family:'Cormorant SC',Georgia,serif;font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.35em;color:rgba(245,237,216,0.8);margin-top:2px;">R E S T A U R A N T</div>
      </td>
    </tr>
  </table>
  ${sublabel ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(192,144,64,0.2);font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;color:rgba(192,144,64,0.7);font-style:italic;letter-spacing:0.05em;">${sublabel}</div>` : ''}
</td></tr>`;
}

// ── Info rows (Datum / Uhrzeit / Personen) ────────────────────────────────────
function infoRows(r) {
  const row = (label, value) => `
  <tr>
    <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:rgba(192,144,64,0.7);padding:6px 0;white-space:nowrap;width:110px;letter-spacing:0.02em;">${label}</td>
    <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#EDE3D0;padding:6px 0 6px 10px;letter-spacing:0.02em;">${value}</td>
  </tr>`;
  return `
<tr><td bgcolor="#0f0703" class="pad bg-card" style="background-color:#0f0703;border-left:1px solid rgba(192,144,64,0.12);border-right:1px solid rgba(192,144,64,0.12);padding:4px 52px 16px;">
  <table cellpadding="0" cellspacing="0">
    ${row('Datum:', formatDate(r.date))}
    ${row('Uhrzeit:', r.time + ' Uhr')}
    ${row('Personen:', r.guests)}
  </table>
</td></tr>`;
}

// ── Gold divider ──────────────────────────────────────────────────────────────
function divider() {
  return `<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(192,144,64,0.25),transparent);margin:30px 0;"></div>`;
}

// ── Signature block ───────────────────────────────────────────────────────────
const signature = `
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:rgba(240,230,212,0.6);margin:0 0 2px;letter-spacing:0.02em;">Herzliche Grüße</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:rgba(240,230,212,0.5);margin:0;letter-spacing:0.02em;">Ihr Injera Team</p>`;

// ── Footer ────────────────────────────────────────────────────────────────────
const footerRow = `
<tr><td bgcolor="#060402" class="bg-foot" style="background-color:#060402;border:1px solid rgba(192,144,64,0.1);border-top:none;border-radius:0 0 4px 4px;padding:26px 52px 32px;text-align:center;">
  <div style="width:40px;height:1px;background:linear-gradient(90deg,transparent,rgba(192,144,64,0.35),transparent);margin:0 auto 22px;"></div>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="padding:5px 12px 5px 0;vertical-align:top;font-size:15px;line-height:1;">&#128205;</td>
      <td style="padding:5px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:13.5px;color:rgba(240,230,212,0.5);letter-spacing:0.04em;text-align:left;white-space:nowrap;">${ADDRESS}</td>
    </tr>
    <tr>
      <td style="padding:5px 12px 5px 0;vertical-align:top;font-size:15px;line-height:1;">&#9742;</td>
      <td style="padding:5px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:13.5px;letter-spacing:0.04em;text-align:left;white-space:nowrap;"><a href="tel:${PHONE.replace(/\s/g,'')}" style="color:rgba(192,144,64,0.75);text-decoration:none;">${PHONE}</a></td>
    </tr>
    <tr>
      <td style="padding:5px 12px 5px 0;vertical-align:top;font-size:15px;line-height:1;">&#9993;</td>
      <td style="padding:5px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:13.5px;letter-spacing:0.04em;text-align:left;white-space:nowrap;"><a href="mailto:${CONTACT_EMAIL}" style="color:rgba(192,144,64,0.75);text-decoration:none;">${CONTACT_EMAIL}</a></td>
    </tr>
  </table>
</td></tr>`;

// Body cell wrapper — shared by all content rows
const bodyCell = (content, pt, pb) =>
  `<tr><td bgcolor="#0f0703" class="pad bg-card" style="background-color:#0f0703;border-left:1px solid rgba(192,144,64,0.12);border-right:1px solid rgba(192,144,64,0.12);padding:${pt||36}px 52px ${pb||36}px;">${content}</td></tr>`;

// ── Admin booking card (Datum / Uhrzeit / Personen visuell) ──────────────────
function bookingCard(r, timeColor) {
  const tc = timeColor || '#C8A84B';
  return `
<tr><td style="background-color:#0f0703;border-left:1px solid rgba(192,144,64,0.12);border-right:1px solid rgba(192,144,64,0.12);padding:0 40px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(192,144,64,0.2);background:linear-gradient(160deg,#1a0d04 0%,#100802 100%);">
    <tr>
      <td style="padding:22px 20px;text-align:center;vertical-align:middle;border-right:1px solid rgba(192,144,64,0.1);width:42%;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(192,144,64,0.4);margin-bottom:8px;">Datum</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#EDE3D0;line-height:1.4;">${formatDate(r.date)}</div>
      </td>
      <td style="padding:18px;text-align:center;vertical-align:middle;border-right:1px solid rgba(192,144,64,0.1);">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:44px;color:${tc};font-weight:300;line-height:1;">${r.time}</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:8px;letter-spacing:3px;color:rgba(192,144,64,0.35);margin-top:3px;">UHR</div>
      </td>
      <td style="padding:22px 20px;text-align:center;vertical-align:middle;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(192,144,64,0.4);margin-bottom:8px;">Personen</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;color:#EDE3D0;font-weight:300;line-height:1;">${r.guests}</div>
      </td>
    </tr>
  </table>
</td></tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAST: Buchung sofort bestätigt
// ─────────────────────────────────────────────────────────────────────────────
function guestConfirmedHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:700;color:#F0E6D4;margin:0 0 18px;line-height:1.5;letter-spacing:0.02em;">Wir freuen uns auf Sie, ${firstName}!</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:rgba(237,227,208,0.72);margin:0;line-height:1.8;">Vielen Dank für Ihre Reservierung bei Injera. Ihr Tisch ist reserviert — wir freuen uns auf Ihren Besuch.</p>
  `, 44, 20)}

  ${infoRows(r)}

  ${bodyCell(`
    ${r.id ? `<p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:rgba(237,227,208,0.5);margin:0 0 28px;line-height:1.75;">Sollten sich Ihre Pläne ändern, können Sie Ihre Reservierung hier stornieren: <a href="${WEBSITE}/?cancel=${r.id}" style="color:#C8A84B;text-decoration:none;font-style:italic;">Reservierung stornieren</a></p>` : ''}
    ${divider()}
    ${signature}
  `, 0, 44)}

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
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:700;color:#F0E6D4;margin:0 0 18px;line-height:1.5;letter-spacing:0.02em;">Danke für Ihre Anfrage, ${firstName}!</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:rgba(237,227,208,0.72);margin:0;line-height:1.8;">Schön, dass Sie mit uns feiern möchten! Wir prüfen die Verfügbarkeit für Ihre Gruppe und melden uns so schnell wie möglich mit einer Bestätigung.</p>
  `, 44, 20)}

  ${infoRows(r)}

  ${bodyCell(`
    ${divider()}
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:rgba(237,227,208,0.85);margin:0 0 20px;line-height:1.75;letter-spacing:0.01em;">Wir freuen uns auf Ihren Besuch.</p>
    ${signature}
  `, 0, 44)}

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
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:700;color:#F0E6D4;margin:0 0 18px;line-height:1.5;letter-spacing:0.02em;">${confirmed ? `Ihr Tisch ist bestätigt, ${firstName}!` : `Liebe/r ${firstName},`}</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:rgba(237,227,208,0.72);margin:0;line-height:1.8;">${
      confirmed
        ? 'Ihre Reservierung bei Injera ist offiziell bestätigt. Wir freuen uns darauf, Sie bald bei uns begrüßen zu dürfen.'
        : `leider müssen wir Ihre Reservierung absagen und entschuldigen uns aufrichtig. Für einen neuen Wunschtermin sind wir gerne für Sie da:<br><br><a href="tel:${PHONE.replace(/\s/g,'')}" style="color:#C8A84B;text-decoration:none;font-family:'Cormorant Garamond',Georgia,serif;">${PHONE}</a>`
    }</p>
  `, 44, 20)}

  ${infoRows(r)}

  ${bodyCell(`
    ${divider()}
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:rgba(237,227,208,0.85);margin:0 0 20px;line-height:1.75;letter-spacing:0.01em;">${confirmed ? 'Wir freuen uns auf Ihren Besuch.' : 'Wir hoffen, Sie bald bei uns willkommen zu heißen.'}</p>
    ${signature}
  `, 0, 44)}

  ${footerRow}`);
}

// ── Admin contact rows (Telefon / E-Mail / Anmerkung) ────────────────────────
function contactRows(r) {
  const row = (label, value) => `
  <tr>
    <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:rgba(192,144,64,0.7);padding:5px 0;white-space:nowrap;width:110px;letter-spacing:0.02em;">${label}</td>
    <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#EDE3D0;padding:5px 0 5px 10px;letter-spacing:0.02em;">${value}</td>
  </tr>`;
  return `
<tr><td bgcolor="#0f0703" class="pad bg-card" style="background-color:#0f0703;border-left:1px solid rgba(192,144,64,0.12);border-right:1px solid rgba(192,144,64,0.12);padding:16px 52px 16px;">
  <div style="height:1px;background:rgba(192,144,64,0.1);margin-bottom:12px;"></div>
  <table cellpadding="0" cellspacing="0">
    ${row('Telefon:', `<a href="tel:${r.phone.replace(/\s/g,'')}" style="color:#C8A84B;text-decoration:none;">${r.phone}</a>`)}
    ${r.email ? row('E-Mail:', `<a href="mailto:${r.email}" style="color:#C8A84B;text-decoration:none;">${r.email}</a>`) : ''}
    ${r.occasion ? row('Anlass:', r.occasion) : ''}
    ${r.note ? row('Wünsche:', r.note) : ''}
  </table>
</td></tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Neue Buchung eingegangen
// ─────────────────────────────────────────────────────────────────────────────
function adminNewBookingHTML(r) {
  const isPending = r.status === 'pending';

  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(192,144,64,0.55);margin:0 0 12px;">${isPending ? '⚠ Neue Anfrage — Bestätigung erforderlich' : 'Neue Reservierung'}</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:700;color:#F0E6D4;margin:0;letter-spacing:0.04em;line-height:1.2;">${r.name}</p>
  `, 44, 20)}

  ${infoRows(r)}
  ${contactRows(r)}

  ${bodyCell(`${divider()}`, 0, 20)}

  ${footerRow}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Statusänderung
// ─────────────────────────────────────────────────────────────────────────────
function adminStatusChangeHTML(r, status) {
  const confirmed = status === 'confirmed';
  const tc = confirmed ? '#C8A84B' : '#DC503C';

  return wrap(`
  ${logoRow()}

  ${bodyCell(`
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:${tc};margin:0 0 12px;">${confirmed ? '✓ Reservierung bestätigt' : '✕ Reservierung abgesagt'}</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:700;color:#F0E6D4;margin:0;letter-spacing:0.04em;line-height:1.2;">${r.name}</p>
  `, 44, 20)}

  ${infoRows(r)}
  ${contactRows(r)}

  ${bodyCell(`${divider()}`, 0, 20)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// ONLINE-BESTELLUNG / ABHOLUNG
// ═════════════════════════════════════════════════════════════════════════════
function euro(n) {
  return (Number(n) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
function orderNo(o) {
  return o.orderNo || ('#' + String(o.id || '').padStart(4, '0'));
}

// ── Positions-Tabelle (Artikel · Menge · Preis) ──────────────────────────────
function itemsTable(items) {
  const rows = (items || []).map(it => `
    <tr>
      <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#EDE3D0;padding:8px 0;letter-spacing:0.02em;vertical-align:top;">
        <span style="color:#C8A84B;font-weight:700;">${it.qty}×</span>&nbsp;${it.name}
        ${it.option ? `<div style="font-size:12.5px;color:rgba(192,144,64,0.7);font-style:italic;">${it.option}</div>` : ''}
      </td>
      <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#EDE3D0;padding:8px 0;text-align:right;white-space:nowrap;vertical-align:top;">${euro(it.line_total != null ? it.line_total : it.unit_price * it.qty)}</td>
    </tr>
    <tr><td colspan="2" style="border-bottom:1px solid rgba(192,144,64,0.1);font-size:0;line-height:0;">&nbsp;</td></tr>`).join('');
  return `
<tr><td bgcolor="#0f0703" class="pad bg-card" style="background-color:#0f0703;border-left:1px solid rgba(192,144,64,0.12);border-right:1px solid rgba(192,144,64,0.12);padding:4px 52px 8px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    ${rows}
  </table>
</td></tr>`;
}

// ── Gesamtsumme ──────────────────────────────────────────────────────────────
function orderTotalRows(o) {
  return `
<tr><td bgcolor="#0f0703" class="pad bg-card" style="background-color:#0f0703;border-left:1px solid rgba(192,144,64,0.12);border-right:1px solid rgba(192,144,64,0.12);padding:6px 52px 18px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(192,144,64,0.7);padding-top:10px;border-top:2px solid rgba(192,144,64,0.35);">Gesamt</td>
      <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:700;color:#C8A84B;text-align:right;padding-top:8px;border-top:2px solid rgba(192,144,64,0.35);">${euro(o.total)}</td>
    </tr>
  </table>
</td></tr>`;
}

// ── Abhol-Karte (Datum / Uhrzeit) ────────────────────────────────────────────
function pickupCard(o) {
  return `
<tr><td style="background-color:#0f0703;border-left:1px solid rgba(192,144,64,0.12);border-right:1px solid rgba(192,144,64,0.12);padding:0 40px 22px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(192,144,64,0.2);background:linear-gradient(160deg,#1a0d04 0%,#100802 100%);">
    <tr>
      <td style="padding:20px;text-align:center;vertical-align:middle;border-right:1px solid rgba(192,144,64,0.1);width:52%;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(192,144,64,0.4);margin-bottom:8px;">Abholung</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#EDE3D0;line-height:1.4;">${formatDate(o.pickup_date)}</div>
      </td>
      <td style="padding:16px;text-align:center;vertical-align:middle;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:40px;color:#C8A84B;font-weight:300;line-height:1;">${o.pickup_time}</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:8px;letter-spacing:3px;color:rgba(192,144,64,0.35);margin-top:3px;">UHR</div>
      </td>
    </tr>
  </table>
</td></tr>`;
}

// ── Kontaktzeilen für Bestellung ─────────────────────────────────────────────
function orderContactRows(o) {
  const row = (label, value) => `
  <tr>
    <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:rgba(192,144,64,0.7);padding:5px 0;white-space:nowrap;width:110px;letter-spacing:0.02em;">${label}</td>
    <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#EDE3D0;padding:5px 0 5px 10px;letter-spacing:0.02em;">${value}</td>
  </tr>`;
  return `
<tr><td bgcolor="#0f0703" class="pad bg-card" style="background-color:#0f0703;border-left:1px solid rgba(192,144,64,0.12);border-right:1px solid rgba(192,144,64,0.12);padding:12px 52px 16px;">
  <div style="height:1px;background:rgba(192,144,64,0.1);margin-bottom:12px;"></div>
  <table cellpadding="0" cellspacing="0">
    ${row('Telefon:', `<a href="tel:${String(o.phone).replace(/\s/g,'')}" style="color:#C8A84B;text-decoration:none;">${o.phone}</a>`)}
    ${o.email ? row('E-Mail:', `<a href="mailto:${o.email}" style="color:#C8A84B;text-decoration:none;">${o.email}</a>`) : ''}
    ${o.note ? row('Anmerkung:', o.note) : ''}
  </table>
</td></tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Neue Bestellung eingegangen
// ─────────────────────────────────────────────────────────────────────────────
function adminNewOrderHTML(o) {
  return wrap(`
  ${logoRow('Neue Online-Bestellung')}

  ${bodyCell(`
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(192,144,64,0.55);margin:0 0 12px;">🛍 Neue Bestellung zur Abholung</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:700;color:#F0E6D4;margin:0 0 4px;letter-spacing:0.04em;line-height:1.2;">Bestellung ${orderNo(o)}</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:rgba(237,227,208,0.7);margin:0;">${o.name}</p>
  `, 40, 18)}

  ${pickupCard(o)}
  ${itemsTable(o.items)}
  ${orderTotalRows(o)}
  ${orderContactRows(o)}

  ${bodyCell(`${divider()}`, 0, 18)}

  ${footerRow}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// GAST: Bestellbestätigung
// ─────────────────────────────────────────────────────────────────────────────
function guestOrderHTML(o) {
  const firstName = String(o.name || '').split(' ')[0];
  return wrap(`
  ${logoRow('Bestellbestätigung')}

  ${bodyCell(`
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:700;color:#F0E6D4;margin:0 0 18px;line-height:1.5;letter-spacing:0.02em;">Vielen Dank, ${firstName}!</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:rgba(237,227,208,0.72);margin:0;line-height:1.8;">Wir haben deine Bestellung erhalten und bereiten sie frisch für dich zu. Deine Bestellnummer lautet <span style="color:#C8A84B;font-weight:700;">${orderNo(o)}</span>.</p>
  `, 40, 18)}

  ${pickupCard(o)}
  ${itemsTable(o.items)}
  ${orderTotalRows(o)}

  ${bodyCell(`
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:rgba(237,227,208,0.5);margin:0 0 20px;line-height:1.7;">Bitte hole deine Bestellung zur gewählten Zeit ab. Die Zahlung erfolgt bei Abholung im Restaurant.<br>${ADDRESS}</p>
    ${divider()}
    ${signature}
  `, 8, 40)}

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
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#F0E6D4;margin:0 0 12px;font-weight:400;">E-Mail-System aktiv.</p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:rgba(240,230,212,0.45);margin:0;line-height:1.8;">Das Benachrichtigungssystem des Injera funktioniert korrekt.<br/>Gesendet: <span style="color:rgba(192,144,64,0.6);">${ts}</span></p>

    ${divider()}
    ${signature}
  `, 36, 40)}

  ${footerRow}`);
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, reservation, order, to } = req.body || {};

  try {
    if (type === 'test') {
      const target = to || ADMIN_EMAIL;
      await sendMail({ to: target, subject: `Injera — E-Mail-System Test`, html: testEmailHTML() });
      return res.status(200).json({ ok: true, sent: 1, to: target });
    }

    // ── Online-Bestellung ────────────────────────────────────────────────────
    if (type === 'order_new') {
      if (!order) return res.status(400).json({ error: 'order erforderlich' });
      const o = order;
      const no = orderNo(o);
      const promises = [];

      // Admin-Benachrichtigung
      promises.push(sendMail({
        to: ADMIN_EMAIL,
        subject: `🛍 Neue Bestellung ${no} · ${o.name} · Abholung ${formatDate(o.pickup_date)} ${o.pickup_time} · ${euro(o.total)}`,
        html: adminNewOrderHTML(o),
      }));

      // Gast-Bestätigung (nur wenn E-Mail vorhanden)
      if (o.email) {
        promises.push(sendMail({
          to: o.email,
          subject: `Bestellbestätigung ${no} — Injera · Abholung ${formatDate(o.pickup_date)}`,
          html: guestOrderHTML(o),
        }));
      }

      const results = await Promise.allSettled(promises);
      const sent    = results.filter(p => p.status === 'fulfilled').length;
      const errors  = results.filter(p => p.status === 'rejected').map(p => p.reason?.message);
      if (errors.length) console.error('Bestell-E-Mail Fehler:', errors);
      return res.status(200).json({ ok: true, sent, errors: errors.length ? errors : undefined });
    }

    if (!type || !reservation) return res.status(400).json({ error: 'type und reservation erforderlich' });
    const r = reservation;
    const promises = [];

    if (type === 'new') {
      const isPending = r.status === 'pending';
      promises.push(sendMail({
        to: ADMIN_EMAIL,
        subject: isPending
          ? `⚠ Anfrage: ${r.name} · ${r.date} · ${r.time} · ${r.guests} Pers. — Bestätigung erforderlich`
          : `Neue Buchung: ${r.name} · ${r.date} · ${r.time} · ${r.guests} Pers.`,
        html: adminNewBookingHTML(r),
      }));
      if (r.email) {
        promises.push(sendMail({
          to: r.email,
          subject: isPending
            ? `Ihre Reservierungsanfrage — Injera · ${formatDate(r.date)}`
            : `Reservierungsbestätigung — Injera · ${formatDate(r.date)}`,
          html: isPending ? guestPendingHTML(r) : guestConfirmedHTML(r),
        }));
      }
    } else if (type === 'status') {
      if (r.email) {
        promises.push(sendMail({
          to: r.email,
          subject: r.status === 'confirmed'
            ? `Reservierungsbestätigung — Injera · ${formatDate(r.date)}`
            : `Ihre Reservierung — Injera · ${formatDate(r.date)}`,
          html: guestStatusUpdateHTML(r, r.status),
        }));
      }
      promises.push(sendMail({
        to: ADMIN_EMAIL,
        subject: `${r.status === 'confirmed' ? '✓' : '✕'} ${r.name} · ${r.status === 'confirmed' ? 'Bestätigt' : 'Abgesagt'} · ${r.date} · ${r.time}`,
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
