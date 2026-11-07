// Envoi d'e-mails. Deux possibilités (une seule suffit) :
//  - Gmail (ou tout serveur SMTP) : SMTP_USER (adresse) + SMTP_PASS (mot de passe d'application),
//    SMTP_HOST / SMTP_PORT facultatifs (Gmail par défaut) ;
//  - Brevo : BREVO_API_KEY + MAIL_FROM.
// Sans configuration : hors production, les e-mails sont gardés dans `outbox` (tests) et affichés dans la console.
const PROD = process.env.NODE_ENV === "production";
const { SMTP_USER, SMTP_PASS, BREVO_API_KEY } = process.env;
const FROM = process.env.MAIL_FROM || SMTP_USER;
const NAME = process.env.MAIL_FROM_NAME || "Mille Plumes";
let smtp = null;
if (SMTP_USER && SMTP_PASS) {
  const nodemailer = require("nodemailer");
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  smtp = nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s/g, "") } });
}
const configured = !!smtp || !!(BREVO_API_KEY && FROM);
const enabled = configured || !PROD; // l'envoi fonctionne (ou est simulé en dev)
const outbox = [];

async function sendMail(to, subject, text) {
  if (smtp) {
    try { await smtp.sendMail({ from: { name: NAME, address: FROM }, to, subject, text }); return; }
    catch (e) { console.error("SMTP", e.message); throw new Error("L'e-mail n'a pas pu être envoyé. Réessaie plus tard."); }
  }
  if (BREVO_API_KEY && FROM) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: { email: FROM, name: NAME }, to: [{ email: to }], subject, textContent: text }),
    });
    if (!r.ok) { console.error("Brevo", r.status, await r.text().catch(() => "")); throw new Error("L'e-mail n'a pas pu être envoyé. Réessaie plus tard."); }
    return;
  }
  if (PROD) throw new Error("L'envoi d'e-mails n'est pas encore activé sur le site.");
  outbox.push({ to, subject, text }); console.log(`[e-mail de test] à ${to} : ${subject}\n${text}`);
}
const validEmail = e => /^[^\s@]{1,64}@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= 120;
const maskEmail = e => { const [u, d] = e.split("@"); return u.slice(0, 1) + "•••@" + d; };
// Forme "canonique" pour les bannissements : sans +étiquette, et sans points pour Gmail
const canonEmail = e => {
  let [u, d] = String(e).toLowerCase().trim().split("@");
  u = u.split("+")[0];
  if (d === "gmail.com" || d === "googlemail.com") { u = u.replace(/\./g, ""); d = "gmail.com"; }
  return u + "@" + d;
};

module.exports = { sendMail, enabled, configured, outbox, validEmail, maskEmail, canonEmail };
