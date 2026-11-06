// Filtre de mots interdits (insultes, contenus sexuels, haine, harcèlement).
// Le texte est normalisé (minuscules, sans accents, chiffres "leet" remplacés)
// puis comparé mot à mot ; certaines expressions sont cherchées telles quelles.

const WORDS = [
  // insultes
  "connard", "connards", "connasse", "connasses", "salope", "salopes", "salaud", "salauds", "pute", "putes", "putain",
  "encule", "encules", "enculer", "enculee", "batard", "batards", "pouffiasse",
  "petasse", "grognasse", "fdp", "ntm", "tg", "nique", "niquer", "niquez", "bite", "bites",
  "couille", "couilles", "teub", "branleur", "branleuse", "branlette",
  // haine
  "pd", "pede", "pedes", "gouine", "negro", "negre", "negres", "bougnoule", "bougnoules", "youpin", "youpins",
  "bicot", "chinetoque", "triso",
  // sexuel explicite
  "porno", "porn", "pornographie", "xxx", "sodomie", "fellation", "masturbation", "orgasme", "nude", "nudes", "kys",
  // anglais courant
  "fuck", "fucking", "fucker", "motherfucker", "bitch", "bitches", "slut", "whore", "pussy", "cunt", "nigga", "nigger", "faggot",
];
const PHRASES = [
  "fils de pute", "ta gueule", "ferme ta gueule", "nique ta mere", "va te faire foutre", "suce ma", "tue toi", "tue-toi",
  "va mourir", "suicide toi", "suicide-toi", "pends toi", "pends-toi", "envoie des photos", "envoie une photo",
];

const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "€": "e" };
function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$€]/g, c => LEET[c])
    .replace(/(.)\1{2,}/g, "$1$1"); // "puuuute" -> "puute"
}
const WORD_SET = new Set(WORDS);

/** Renvoie le premier mot ou expression interdit trouvé, ou null. */
function findBadWord(text) {
  const n = normalize(text);
  for (const p of PHRASES) if (n.includes(p)) return p;
  const tokens = n.split(/[^a-z]+/).filter(Boolean);
  for (const t of tokens) {
    if (WORD_SET.has(t)) return t;
    const squeezed = t.replace(/(.)\1+/g, "$1"); // "puute" -> "pute"
    if (WORD_SET.has(squeezed)) return squeezed;
  }
  // mots écrits avec des espaces ou des points : "p u t e", "c.o.n.n.a.r.d"
  const spaced = n.match(/\b(?:[a-z][\s.*_-]){3,}[a-z]\b/g) || [];
  for (const s of spaced) { const w = s.replace(/[\s.*_-]/g, ""); if (WORD_SET.has(w)) return w; }
  return null;
}

module.exports = { findBadWord, normalize };
