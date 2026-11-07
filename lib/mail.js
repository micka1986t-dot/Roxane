// Envoi d'e-mails via l'API HTTP de Brevo (gratuit jusqu'à 300 e-mails/jour).
// Variables : BREVO_API_KEY, MAIL_FROM (adresse validée chez Brevo), MAIL_FROM_NAME (facultatif).
// Sans clé : hors production, les e-mails sont gardés dans `outbox` (tests) et affichés dans la console.
const KEY = process.env.BREVO_API_KEY;
const FROM = process.env.MAIL_FROM;
const PROD = process.env.NODE_ENV === "production";
const enabled = !!(KEY && FROM) || !PROD;
const outbox = [];

async function sendMail(to, subject, text) {
  if (!(KEY && FROM)) {
    if (PROD) throw new Error("L'envoi d'e-mails n'est pas encore activé sur le site.");
    outbox.push({ to, subject, text }); console.log(`[e-mail de test] à ${to} : ${subject}\n${text}`); return;
  }
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { email: FROM, name: process.env.MAIL_FROM_NAME || "Mille Plumes" }, to: [{ email: to }], subject, textContent: text }),
  });
  if (!r.ok) { console.error("Brevo", r.status, await r.text().catch(() => "")); throw new Error("L'e-mail n'a pas pu être envoyé. Réessaie plus tard."); }
}
const validEmail = e => /^[^\s@]{1,64}@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= 120;
const maskEmail = e => { const [u, d] = e.split("@"); return u.slice(0, 1) + "•••@" + d; };

module.exports = { sendMail, enabled, outbox, validEmail, maskEmail };
