'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const FROM          = process.env.FROM_EMAIL     || 'injerar@gmail.com';
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL    || 'saleemalzubair@gmail.com';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL  || 'saleemalzubair@gmail.com';
const PHONE         = '+49 1575 1644776';
const ADDRESS       = 'Brennerstraße 35 · 20099 Hamburg';
const WEBSITE       = 'https://www.injera-restaurant.de';
const ICON_URL      = `${WEBSITE}/logo-icon-original.png`;

// ── Farbtokens (passend zur Webseite) ──────────────────────────────────────────
const C = {
  bg:        '#F2EBD9',   // äußerer Hintergrund — warme Creme
  card:      '#FDFBF6',   // Karten-Hintergrund — reines Elfenbein
  cardAlt:   '#FAF7F0',   // leicht wärmeres Elfenbein
  nav:       '#1E1B18',   // dunkles Teal — wie Website-Nav
  navDeep:   '#0E0C0A',   // tiefster Ton
  border:    '#EDE5D0',   // Creme-Rand
  gold:      '#C4923A',   // Marken-Gold (gleich wie Webseite --gold)
  goldL:     '#D4A84E',   // helles Gold
  goldPale:  '#EAC97A',   // blasses Gold
  goldBg:    'rgba(196,146,58,0.08)',
  text:      '#1C1410',   // warmes Dunkelbraun — Haupttext
  textMid:   'rgba(28,20,16,0.68)',
  textMuted: 'rgba(28,20,16,0.45)',
  ivory:     '#F8F4EC',   // helles Elfenbein
  red:       '#C0392B',
};

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
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const days   = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const date   = new Date(`${iso}T00:00:00`);
  return `${days[date.getDay()]}, ${parseInt(d)}. ${months[parseInt(m)-1]} ${y}`;
}

function formatDateShort(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function euro(n) {
  return (Number(n) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function orderNo(o) {
  return o.orderNo || ('#' + String(o.id || '').padStart(4, '0'));
}

// ── Äußerer Rahmen ─────────────────────────────────────────────────────────────
function wrap(body) {
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>Injera Restaurant</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@400;700&display=swap');
:root{color-scheme:light!important}
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
table{border-collapse:collapse!important}
@media only screen and (max-width:600px){
  .wrap-td{padding:20px 10px 40px!important}
  .main{width:100%!important;max-width:100%!important}
  .nav-pad{padding:22px 20px 20px!important}
  .body-pad{padding:28px 20px!important}
  .logo-img{width:54px!important;height:36px!important}
  .logo-name{font-size:22px!important}
  .logo-sub{font-size:10px!important}
  .h-title{font-size:22px!important}
  .h-body{font-size:15px!important}
  .info-card{padding:18px 20px!important}
  .pickup-cell{padding:14px 10px!important}
  .pickup-time{font-size:36px!important}
  .pickup-label{font-size:13px!important}
  .items-pad{padding:0 20px 8px!important}
  .total-pad{padding:6px 20px 20px!important}
  .contact-pad{padding:8px 20px 20px!important}
  .btn-td{padding:0 20px 28px!important}
  .foot-pad{padding:24px 20px!important}
}
</style>
</head>
<body bgcolor="${C.bg}" style="margin:0;padding:0;background-color:${C.bg};">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background-color:${C.bg};">
<tr><td align="center" bgcolor="${C.bg}" class="wrap-td" style="padding:40px 16px 60px;">
<table width="560" cellpadding="0" cellspacing="0" class="main" style="max-width:560px;width:100%;">
${body}
</table>
</td></tr>
</table>
</body></html>`;
}

// ── Navigation/Header — wie Website-Nav ────────────────────────────────────────
function navHeader(tag) {
  return `
<tr><td bgcolor="${C.nav}" style="background-color:${C.nav};border-radius:6px 6px 0 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td bgcolor="${C.gold}" height="3" style="background-color:${C.gold};font-size:0;line-height:0;border-radius:6px 6px 0 0;">&nbsp;</td></tr>
    <tr><td class="nav-pad" style="padding:26px 40px 22px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <img src="${ICON_URL}" alt="Injera" width="72" height="48" class="logo-img"
              style="display:block;width:72px;height:48px;object-fit:cover;object-position:left center;border:0;
              filter:drop-shadow(0 0 10px rgba(196,146,58,0.4)) brightness(1.1);"/>
          </td>
          <td style="width:1px;padding:0 14px;vertical-align:middle;">
            <div style="width:1px;height:30px;background:linear-gradient(to bottom,transparent,rgba(196,146,58,0.4),transparent);font-size:0;">&nbsp;</div>
          </td>
          <td style="vertical-align:middle;">
            <div class="logo-name" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;
              letter-spacing:0.24em;color:#FAF7F0;line-height:1.05;">INJERA</div>
            <div class="logo-sub" style="font-family:'Lato',Arial,sans-serif;font-size:9px;font-weight:700;
              text-transform:uppercase;letter-spacing:0.42em;color:${C.goldPale};margin-top:3px;opacity:0.8;">Restaurant</div>
          </td>
          ${tag ? `
          <td style="text-align:right;vertical-align:middle;padding-left:20px;">
            <div style="font-family:'Lato',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.18em;
              text-transform:uppercase;color:${C.goldL};border:1px solid rgba(196,146,58,0.35);
              padding:5px 10px;white-space:nowrap;">${tag}</div>
          </td>` : ''}
        </tr>
      </table>
    </td></tr>
  </table>
</td></tr>`;
}

// ── Goldener Trennstrich ────────────────────────────────────────────────────────
function divider(my) {
  const m = my || '28px';
  return `<div style="height:1px;background:linear-gradient(90deg,transparent,${C.gold},transparent);margin:${m} 0;opacity:0.3;"></div>`;
}

// ── Haupt-Inhaltszelle ─────────────────────────────────────────────────────────
function bodyCell(content, ptop, pbot) {
  return `<tr><td bgcolor="${C.card}" class="body-pad"
    style="background-color:${C.card};border-left:1px solid ${C.border};border-right:1px solid ${C.border};
    padding:${ptop||40}px 40px ${pbot||40}px;">${content}</td></tr>`;
}

// ── Info-Karte (Datum / Uhrzeit / Personen) ────────────────────────────────────
function bookingInfoCard(r) {
  return `
<tr><td bgcolor="${C.card}" style="background-color:${C.card};border-left:1px solid ${C.border};border-right:1px solid ${C.border};padding:0 40px 24px;" class="body-pad">
  <table width="100%" cellpadding="0" cellspacing="0" class="info-card"
    style="background:${C.cardAlt};border:1px solid ${C.border};border-radius:4px;overflow:hidden;padding:22px 28px;">
    <tr>
      <td style="padding:8px 16px 8px 0;vertical-align:middle;border-right:1px solid ${C.border};width:50%;">
        <div style="font-family:'Lato',Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:0.22em;
          text-transform:uppercase;color:${C.gold};margin-bottom:6px;">Datum</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:600;
          color:${C.text};line-height:1.35;">${formatDate(r.date)}</div>
      </td>
      <td style="padding:8px 16px;vertical-align:middle;border-right:1px solid ${C.border};">
        <div style="font-family:'Lato',Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:0.22em;
          text-transform:uppercase;color:${C.gold};margin-bottom:4px;">Uhrzeit</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:700;
          color:${C.gold};line-height:1;">${r.time}</div>
        <div style="font-family:'Lato',Arial,sans-serif;font-size:8px;letter-spacing:0.15em;
          color:${C.textMuted};margin-top:2px;">UHR</div>
      </td>
      <td style="padding:8px 0 8px 16px;vertical-align:middle;text-align:center;">
        <div style="font-family:'Lato',Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:0.22em;
          text-transform:uppercase;color:${C.gold};margin-bottom:4px;">Personen</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:34px;font-weight:600;
          color:${C.text};line-height:1;">${r.guests}</div>
      </td>
    </tr>
  </table>
</td></tr>`;
}

// ── Detail-Zeilen (Kontakt / Wünsche) ─────────────────────────────────────────
function detailRows(pairs) {
  const rows = pairs.filter(([,v])=>v).map(([l,v])=>`
    <tr>
      <td style="font-family:'Lato',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;
        text-transform:uppercase;color:${C.gold};padding:6px 12px 6px 0;vertical-align:top;
        white-space:nowrap;width:1%;">${l}</td>
      <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:${C.text};
        padding:6px 0;vertical-align:top;letter-spacing:0.01em;">${v}</td>
    </tr>`).join('');
  return `<table cellpadding="0" cellspacing="0" width="100%">${rows}</table>`;
}

// ── Abhol-Karte (für Bestellungen) ────────────────────────────────────────────
function pickupCard(o) {
  return `
<tr><td bgcolor="${C.card}" style="background-color:${C.card};border-left:1px solid ${C.border};border-right:1px solid ${C.border};padding:0 40px 24px;" class="body-pad">
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background:${C.cardAlt};border:1px solid ${C.border};border-radius:4px;overflow:hidden;">
    <tr>
      <td class="pickup-cell" style="padding:18px 24px;text-align:center;vertical-align:middle;border-right:1px solid ${C.border};width:55%;">
        <div style="font-family:'Lato',Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:0.22em;
          text-transform:uppercase;color:${C.gold};margin-bottom:8px;">Abholdatum</div>
        <div class="pickup-label" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;
          font-weight:600;color:${C.text};line-height:1.4;">${formatDate(o.pickup_date)}</div>
      </td>
      <td class="pickup-cell" style="padding:18px 24px;text-align:center;vertical-align:middle;">
        <div style="font-family:'Lato',Arial,sans-serif;font-size:8px;font-weight:700;letter-spacing:0.22em;
          text-transform:uppercase;color:${C.gold};margin-bottom:6px;">Abholzeit</div>
        <div class="pickup-time" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:40px;
          font-weight:700;color:${C.gold};line-height:1;">${o.pickup_time}</div>
        <div style="font-family:'Lato',Arial,sans-serif;font-size:8px;letter-spacing:0.18em;
          color:${C.textMuted};margin-top:3px;">UHR</div>
      </td>
    </tr>
  </table>
</td></tr>`;
}

// ── Artikel-Liste (Bestellungen) ──────────────────────────────────────────────
function itemsTable(items) {
  const rows = (items || []).map((it, i, arr) => `
    <tr>
      <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:${C.text};
        padding:10px 0;vertical-align:top;border-bottom:1px solid ${C.border};">
        <span style="color:${C.gold};font-weight:700;">${it.qty}×</span>&nbsp;${it.name}
        ${it.option ? `<div style="font-size:12px;color:${C.textMuted};font-style:italic;margin-top:2px;">${it.option}</div>` : ''}
      </td>
      <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:${C.text};
        padding:10px 0;text-align:right;white-space:nowrap;vertical-align:top;border-bottom:1px solid ${C.border};">
        ${euro(it.line_total != null ? it.line_total : it.unit_price * it.qty)}
      </td>
    </tr>`).join('');
  return `
<tr><td bgcolor="${C.card}" class="items-pad"
  style="background-color:${C.card};border-left:1px solid ${C.border};border-right:1px solid ${C.border};padding:0 40px 8px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td colspan="2" style="font-family:'Lato',Arial,sans-serif;font-size:9px;font-weight:700;
        letter-spacing:0.18em;text-transform:uppercase;color:${C.gold};padding:0 0 10px;
        border-bottom:1px solid ${C.border};">Bestellung</td>
    </tr>
    ${rows}
  </table>
</td></tr>`;
}

// ── Gesamtbetrag ───────────────────────────────────────────────────────────────
function totalRow(o) {
  return `
<tr><td bgcolor="${C.card}" class="total-pad"
  style="background-color:${C.card};border-left:1px solid ${C.border};border-right:1px solid ${C.border};padding:8px 40px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-family:'Lato',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;
        text-transform:uppercase;color:${C.textMuted};padding-top:12px;border-top:2px solid ${C.gold};opacity:0.8;">Gesamt</td>
      <td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;
        color:${C.gold};text-align:right;padding-top:10px;border-top:2px solid ${C.gold};">${euro(o.total)}</td>
    </tr>
  </table>
</td></tr>`;
}

// ── Gold-Button ────────────────────────────────────────────────────────────────
function goldButton(text, href) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
    <tr><td style="background:linear-gradient(135deg,${C.gold} 0%,#9A6820 100%);border-radius:2px;">
      <a href="${href}" style="display:block;padding:13px 28px;font-family:'Lato',Arial,sans-serif;
        font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;
        color:#ffffff;text-decoration:none;white-space:nowrap;">${text}</a>
    </td></tr>
  </table>`;
}

// ── Unterschrift ───────────────────────────────────────────────────────────────
const signature = `
  <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;
    color:${C.textMuted};margin:0 0 2px;letter-spacing:0.01em;">Herzliche Grüße</p>
  <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:700;
    color:${C.text};margin:0;letter-spacing:0.02em;">Das Injera Team</p>`;

// ── Fußzeile ───────────────────────────────────────────────────────────────────
const footerRow = `
<tr><td bgcolor="${C.nav}" class="foot-pad"
  style="background-color:${C.nav};border-radius:0 0 6px 6px;padding:28px 40px 32px;text-align:center;">
  <div style="width:40px;height:1px;background:linear-gradient(90deg,transparent,${C.gold},transparent);margin:0 auto 20px;opacity:0.4;"></div>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="padding:4px 10px 4px 0;vertical-align:middle;font-size:13px;">
        <span style="color:${C.gold};">&#128205;</span>
      </td>
      <td style="padding:4px 0;font-family:'Lato',Arial,sans-serif;font-size:12px;
        color:rgba(248,244,236,0.55);letter-spacing:0.04em;text-align:left;white-space:nowrap;">${ADDRESS}</td>
    </tr>
    <tr>
      <td style="padding:4px 10px 4px 0;vertical-align:middle;font-size:13px;">
        <span style="color:${C.gold};">&#9742;</span>
      </td>
      <td style="padding:4px 0;font-family:'Lato',Arial,sans-serif;font-size:12px;
        letter-spacing:0.04em;text-align:left;white-space:nowrap;">
        <a href="tel:${PHONE.replace(/\s/g,'')}" style="color:${C.goldL};text-decoration:none;">${PHONE}</a>
      </td>
    </tr>
    <tr>
      <td style="padding:4px 10px 4px 0;vertical-align:middle;font-size:13px;">
        <span style="color:${C.gold};">&#127760;</span>
      </td>
      <td style="padding:4px 0;font-family:'Lato',Arial,sans-serif;font-size:12px;
        letter-spacing:0.04em;text-align:left;white-space:nowrap;">
        <a href="${WEBSITE}" style="color:${C.goldL};text-decoration:none;">injera-restaurant.de</a>
      </td>
    </tr>
  </table>
</td></tr>`;

// ─────────────────────────────────────────────────────────────────────────────
// STATUS-PILL — farbiger Hinweis im Header
// ─────────────────────────────────────────────────────────────────────────────
function statusPill(text, color) {
  return `<div style="display:inline-block;background:${color||C.goldBg};border:1px solid ${color?color+'55':C.gold};
    border-radius:2px;padding:4px 10px;font-family:'Lato',Arial,sans-serif;font-size:9px;font-weight:700;
    letter-spacing:0.18em;text-transform:uppercase;color:${color||C.gold};margin-bottom:14px;">${text}</div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAST: RESERVIERUNG SOFORT BESTÄTIGT
// ═════════════════════════════════════════════════════════════════════════════
function guestConfirmedHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
  ${navHeader('Reservierung bestätigt')}

  ${bodyCell(`
    ${statusPill('✓ Bestätigt', C.gold)}
    <h1 class="h-title" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;
      font-weight:700;color:${C.text};margin:0 0 16px;line-height:1.3;letter-spacing:0.01em;">
      Wir freuen uns auf Sie, ${firstName}!
    </h1>
    <p class="h-body" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;
      color:${C.textMid};margin:0;line-height:1.85;">
      Vielen Dank für Ihre Reservierung bei Injera. Ihr Tisch ist reserviert —
      wir freuen uns darauf, Sie mit äthiopisch-eritreischer Küche zu verwöhnen.
    </p>
  `, 40, 24)}

  ${bookingInfoCard(r)}

  ${bodyCell(`
    ${r.note ? `
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:${C.textMuted};
        margin:0 0 20px;padding:12px 16px;background:${C.cardAlt};border-left:3px solid ${C.gold};
        line-height:1.6;font-style:italic;">„${r.note}"</p>` : ''}
    ${r.id ? `
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:${C.textMuted};
        margin:0 0 28px;line-height:1.7;">
        Pläne geändert?
        <a href="${WEBSITE}/?cancel=${r.id}" style="color:${C.gold};text-decoration:none;font-style:italic;">
          Reservierung stornieren
        </a>
      </p>` : ''}
    ${divider()}
    ${signature}
  `, 8, 40)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAST: ANFRAGE EINGEGANGEN (Große Gruppe — pending)
// ═════════════════════════════════════════════════════════════════════════════
function guestPendingHTML(r) {
  const firstName = r.name.split(' ')[0];
  return wrap(`
  ${navHeader('Anfrage erhalten')}

  ${bodyCell(`
    ${statusPill('Anfrage wird geprüft', C.textMuted)}
    <h1 class="h-title" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;
      font-weight:700;color:${C.text};margin:0 0 16px;line-height:1.3;letter-spacing:0.01em;">
      Danke für Ihre Anfrage, ${firstName}!
    </h1>
    <p class="h-body" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;
      color:${C.textMid};margin:0;line-height:1.85;">
      Schön, dass Sie mit uns feiern möchten. Wir prüfen die Verfügbarkeit für Ihre Gruppe
      und melden uns schnellstmöglich mit einer Bestätigung.
    </p>
  `, 40, 24)}

  ${bookingInfoCard(r)}

  ${bodyCell(`
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:${C.textMid};
      margin:0 0 4px;line-height:1.75;">
      Bei Fragen erreichen Sie uns unter:
      <a href="tel:${PHONE.replace(/\s/g,'')}" style="color:${C.gold};text-decoration:none;">${PHONE}</a>
    </p>
    ${divider()}
    ${signature}
  `, 8, 40)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAST: STATUSÄNDERUNG (bestätigt / abgesagt)
// ═════════════════════════════════════════════════════════════════════════════
function guestStatusUpdateHTML(r, status) {
  const confirmed  = status === 'confirmed';
  const firstName  = r.name.split(' ')[0];
  const pillColor  = confirmed ? C.gold : C.red;
  const pillText   = confirmed ? '✓ Reservierung bestätigt' : 'Reservierung abgesagt';

  return wrap(`
  ${navHeader(confirmed ? 'Bestätigung' : 'Absage')}

  ${bodyCell(`
    ${statusPill(pillText, pillColor)}
    <h1 class="h-title" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;
      font-weight:700;color:${C.text};margin:0 0 16px;line-height:1.3;letter-spacing:0.01em;">
      ${confirmed ? `Ihr Tisch ist bestätigt, ${firstName}!` : `Liebe/r ${firstName},`}
    </h1>
    <p class="h-body" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;
      color:${C.textMid};margin:0;line-height:1.85;">
      ${confirmed
        ? 'Ihre Reservierung bei Injera ist offiziell bestätigt. Wir freuen uns darauf, Sie bald begrüßen zu dürfen.'
        : `Leider müssen wir Ihre Reservierung absagen und entschuldigen uns aufrichtig. Für einen neuen Termin erreichen Sie uns unter <a href="tel:${PHONE.replace(/\s/g,'')}" style="color:${C.gold};text-decoration:none;">${PHONE}</a>.`}
    </p>
  `, 40, 24)}

  ${bookingInfoCard(r)}

  ${bodyCell(`
    ${divider()}
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:${C.textMid};
      margin:0 0 20px;line-height:1.75;">
      ${confirmed ? 'Wir freuen uns auf Ihren Besuch.' : 'Wir hoffen, Sie bald bei uns willkommen zu heißen.'}
    </p>
    ${signature}
  `, 8, 40)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN: NEUE RESERVIERUNG / ANFRAGE
// ═════════════════════════════════════════════════════════════════════════════
function adminNewBookingHTML(r) {
  const isPending = r.status === 'pending';
  const pillText  = isPending ? '⚠ Bestätigung erforderlich' : '✓ Neue Reservierung';
  const pillColor = isPending ? '#B87333' : C.gold;

  return wrap(`
  ${navHeader('Admin · Reservierung')}

  ${bodyCell(`
    ${statusPill(pillText, pillColor)}
    <h1 class="h-title" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;
      font-weight:700;color:${C.text};margin:0;letter-spacing:0.02em;line-height:1.2;">${r.name}</h1>
  `, 40, 22)}

  ${bookingInfoCard(r)}

  ${bodyCell(`
    ${detailRows([
      ['Telefon', `<a href="tel:${(r.phone||'').replace(/\s/g,'')}" style="color:${C.gold};text-decoration:none;">${r.phone}</a>`],
      ['E-Mail',  r.email ? `<a href="mailto:${r.email}" style="color:${C.gold};text-decoration:none;">${r.email}</a>` : ''],
      ['Anlass',  r.occasion || ''],
      ['Wünsche', r.note || ''],
    ])}
  `, 16, 28)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN: STATUSÄNDERUNG
// ═════════════════════════════════════════════════════════════════════════════
function adminStatusChangeHTML(r, status) {
  const confirmed = status === 'confirmed';
  const pillColor = confirmed ? C.gold : C.red;
  const pillText  = confirmed ? '✓ Bestätigt' : '✕ Abgesagt';

  return wrap(`
  ${navHeader('Admin · Statusänderung')}

  ${bodyCell(`
    ${statusPill(pillText, pillColor)}
    <h1 class="h-title" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;
      font-weight:700;color:${C.text};margin:0;letter-spacing:0.02em;line-height:1.2;">${r.name}</h1>
  `, 40, 22)}

  ${bookingInfoCard(r)}

  ${bodyCell(`
    ${detailRows([
      ['Telefon', `<a href="tel:${(r.phone||'').replace(/\s/g,'')}" style="color:${C.gold};text-decoration:none;">${r.phone}</a>`],
      ['E-Mail',  r.email ? `<a href="mailto:${r.email}" style="color:${C.gold};text-decoration:none;">${r.email}</a>` : ''],
    ])}
  `, 16, 28)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN: NEUE ONLINE-BESTELLUNG
// ═════════════════════════════════════════════════════════════════════════════
function adminNewOrderHTML(o) {
  const no = orderNo(o);
  return wrap(`
  ${navHeader('Admin · Neue Bestellung')}

  ${bodyCell(`
    ${statusPill('🛍 Online-Abholung', C.gold)}
    <h1 class="h-title" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;
      font-weight:700;color:${C.text};margin:0 0 6px;letter-spacing:0.02em;">Bestellung ${no}</h1>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:${C.textMid};margin:0;">${o.name}</p>
  `, 38, 20)}

  ${pickupCard(o)}
  ${itemsTable(o.items)}
  ${totalRow(o)}

  ${bodyCell(`
    ${detailRows([
      ['Telefon',   `<a href="tel:${String(o.phone||'').replace(/\s/g,'')}" style="color:${C.gold};text-decoration:none;">${o.phone}</a>`],
      ['E-Mail',    o.email ? `<a href="mailto:${o.email}" style="color:${C.gold};text-decoration:none;">${o.email}</a>` : ''],
      ['Anmerkung', o.note || ''],
    ])}
  `, 16, 28)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAST: BESTELLBESTÄTIGUNG
// ═════════════════════════════════════════════════════════════════════════════
function guestOrderHTML(o) {
  const firstName = String(o.name || '').split(' ')[0];
  const no        = orderNo(o);
  return wrap(`
  ${navHeader('Bestellbestätigung')}

  ${bodyCell(`
    ${statusPill('✓ Bestellung erhalten', C.gold)}
    <h1 class="h-title" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;
      font-weight:700;color:${C.text};margin:0 0 16px;line-height:1.3;letter-spacing:0.01em;">
      Vielen Dank, ${firstName}!
    </h1>
    <p class="h-body" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;
      color:${C.textMid};margin:0;line-height:1.85;">
      Wir haben deine Bestellung erhalten und bereiten sie frisch für dich zu.
      Deine Bestellnummer ist <span style="color:${C.gold};font-weight:700;">${no}</span>.
    </p>
  `, 40, 24)}

  ${pickupCard(o)}
  ${itemsTable(o.items)}
  ${totalRow(o)}

  ${bodyCell(`
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:${C.textMuted};
      margin:0 0 8px;line-height:1.75;">
      Bitte hole deine Bestellung zur gewählten Zeit ab. Die Zahlung erfolgt bei Abholung.
    </p>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:${C.textMuted};
      margin:0 0 24px;line-height:1.75;">
      📍 ${ADDRESS}
    </p>
    ${divider()}
    ${signature}
  `, 12, 40)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  TEST-E-MAIL
// ═════════════════════════════════════════════════════════════════════════════
function testEmailHTML() {
  const ts = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  return wrap(`
  ${navHeader('System-Test')}

  ${bodyCell(`
    ${statusPill('✓ System aktiv', C.gold)}
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;
      font-weight:700;color:${C.text};margin:0 0 14px;">E-Mail-System aktiv</h1>
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;
      color:${C.textMid};margin:0;line-height:1.75;">
      Das Benachrichtigungssystem des Injera funktioniert korrekt.<br/>
      Gesendet am: <span style="color:${C.gold};">${ts}</span>
    </p>
    ${divider()}
    ${signature}
  `, 40, 40)}

  ${footerRow}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  HANDLER
// ═════════════════════════════════════════════════════════════════════════════
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, reservation, order, to } = req.body || {};

  try {
    // ── Test ────────────────────────────────────────────────────────────────
    if (type === 'test') {
      const target = to || ADMIN_EMAIL;
      await sendMail({ to: target, subject: `Injera — E-Mail-System Test`, html: testEmailHTML() });
      return res.status(200).json({ ok: true, sent: 1, to: target });
    }

    // ── Online-Bestellung ────────────────────────────────────────────────────
    if (type === 'order_new') {
      if (!order) return res.status(400).json({ error: 'order erforderlich' });
      const o   = order;
      const no  = orderNo(o);
      const promises = [];

      promises.push(sendMail({
        to: ADMIN_EMAIL,
        subject: `🛍 Bestellung ${no} · ${o.name} · Abholung ${formatDateShort(o.pickup_date)} ${o.pickup_time} · ${euro(o.total)}`,
        html: adminNewOrderHTML(o),
      }));

      if (o.email) {
        promises.push(sendMail({
          to: o.email,
          subject: `Bestellbestätigung ${no} — Injera · Abholung ${formatDateShort(o.pickup_date)}`,
          html: guestOrderHTML(o),
        }));
      }

      const results = await Promise.allSettled(promises);
      const sent    = results.filter(p => p.status === 'fulfilled').length;
      const errors  = results.filter(p => p.status === 'rejected').map(p => p.reason?.message);
      if (errors.length) console.error('Bestell-E-Mail Fehler:', errors);
      return res.status(200).json({ ok: true, sent, errors: errors.length ? errors : undefined });
    }

    // ── Reservierung ─────────────────────────────────────────────────────────
    if (!type || !reservation) return res.status(400).json({ error: 'type und reservation erforderlich' });
    const r = reservation;
    const promises = [];

    if (type === 'new') {
      const isPending = r.status === 'pending';
      promises.push(sendMail({
        to: ADMIN_EMAIL,
        subject: isPending
          ? `⚠ Anfrage: ${r.name} · ${formatDateShort(r.date)} · ${r.time} · ${r.guests} Pers.`
          : `Neue Buchung: ${r.name} · ${formatDateShort(r.date)} · ${r.time} · ${r.guests} Pers.`,
        html: adminNewBookingHTML(r),
      }));
      if (r.email) {
        promises.push(sendMail({
          to: r.email,
          subject: isPending
            ? `Reservierungsanfrage — Injera · ${formatDateShort(r.date)}`
            : `Reservierungsbestätigung — Injera · ${formatDateShort(r.date)}`,
          html: isPending ? guestPendingHTML(r) : guestConfirmedHTML(r),
        }));
      }
    } else if (type === 'status') {
      if (r.email) {
        promises.push(sendMail({
          to: r.email,
          subject: r.status === 'confirmed'
            ? `Reservierungsbestätigung — Injera · ${formatDateShort(r.date)}`
            : `Ihre Reservierung — Injera · ${formatDateShort(r.date)}`,
          html: guestStatusUpdateHTML(r, r.status),
        }));
      }
      promises.push(sendMail({
        to: ADMIN_EMAIL,
        subject: `${r.status === 'confirmed' ? '✓' : '✕'} ${r.name} · ${r.status === 'confirmed' ? 'Bestätigt' : 'Abgesagt'} · ${formatDateShort(r.date)} · ${r.time}`,
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
