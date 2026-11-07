// Mille Plumes : interface. Les données viennent du serveur (/api).
(function(){
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store={get(k,d){try{const v=localStorage.getItem("pl_"+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("pl_"+k,JSON.stringify(v))}catch(e){}}};

/* ---------- Constantes ---------- */
const GENRES=["Fantaisie","Fantastique","Romance","Aventure","Humour","Autobiographie","Mystère","Science-fiction","Poésie"];
const FONTS={display:"Gloock, serif",script:"Pacifico, cursive",hand:"Caveat, cursive",royal:"Cinzel, serif",typewriter:"'Special Elite', monospace",bold:"Bungee, sans-serif"};
const FONT_LABEL={display:"Classique",script:"Rétro",hand:"Manuscrit",royal:"Royal",typewriter:"Machine à écrire",bold:"Affiche"};
const PALETTE=["#1D1A33","#3B1F5C","#0F4C5C","#1F6E43","#7A1E3A","#D3336A","#F28C38","#F2C94C","#8FD3E8","#F7D6E0","#EDE6D6","#FFFFFF"];
const PATTERNS={none:"Uni",gradient:"Dégradé",dots:"Pois",stripes:"Rayures",stars:"Étoiles",waves:"Vagues"};
const SHAPES={none:"Aucune",circle:"Lune",arch:"Arche",diamond:"Losange",mountain:"Montagnes",heart:"Cœur"};
const AI_OVERLAY="radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.25),transparent 60%),radial-gradient(ellipse at 80% 90%,rgba(0,0,0,.35),transparent 55%)";

/* ---------- État ---------- */
let state={me:null,section:store.get("section","jeunesse"),genre:"Tous",length:"tout",sort:"recent",q:"",afterLogin:null};

/* ---------- Outils ---------- */
async function api(method,url,body){
  const r=await fetch(url,{method,headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined,credentials:"same-origin"});
  let data={};try{data=await r.json()}catch(e){}
  if(!r.ok){const e=new Error(data.error||"Le serveur ne répond pas. Vérifie ta connexion.");e.status=r.status;throw e}
  return data;
}
const starStr=n=>"★".repeat(Math.round(n))+"☆".repeat(5-Math.round(n));
const avatar=(p,color)=>`<span class="avatar" style="background:${esc(color||"#6A6585")}">${esc((p||"?")[0].toUpperCase())}</span>`;
const fmtDate=d=>new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});
const personal=t=>/[\w.+-]+@[\w-]+\.[\w.]+/.test(t)||/(\+33|0)[1-9]([\s.-]?\d{2}){4}/.test(t)||/(instagram|snap|insta|tiktok|whatsapp|discord)\s*[:@]/i.test(t);
const paras=t=>String(t||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
function toast(msg){document.querySelectorAll(".toast").forEach(x=>x.remove());const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}
function modal(html,onMount){const l=$("#layer");l.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="box">${html}</div></div>`;const m=l.firstChild;m.addEventListener("click",e=>{if(e.target===m||e.target.closest("[data-close]"))l.innerHTML=""});onMount&&onMount(m);return m}
const closeModal=()=>{$("#layer").innerHTML=""};
const showErr=(el,msg)=>{el.textContent=msg;el.hidden=false};
const go=h=>{if(location.hash==="#"+h)render();else location.hash=h};
function needLogin(next){state.afterLogin=next||location.hash.slice(1);go("connexion")}

/* ---------- Couverture ---------- */
function patternCSS(c){
  const a=c.bg,b=c.bg2||c.bg;
  switch(c.pattern){
    case"gradient":return`background:linear-gradient(160deg,${a},${b})`;
    case"dots":return`background:radial-gradient(${b} 18%,transparent 20%) 0 0/22px 22px,${a}`;
    case"stripes":return`background:repeating-linear-gradient(135deg,${a} 0 14px,${b} 14px 28px)`;
    case"stars":return`background:radial-gradient(1.5px 1.5px at 20% 30%,#fff 50%,transparent),radial-gradient(1px 1px at 70% 15%,#fff 50%,transparent),radial-gradient(1.5px 1.5px at 45% 60%,#fff 50%,transparent),radial-gradient(1px 1px at 85% 75%,#fff 50%,transparent),radial-gradient(1px 1px at 12% 85%,#fff 50%,transparent),radial-gradient(1.2px 1.2px at 60% 40%,#fff 50%,transparent),linear-gradient(180deg,${a},${b})`;
    case"waves":return`background:radial-gradient(circle at 50% 100%,transparent 38%,${b} 40%,${b} 48%,transparent 50%) 0 0/40px 26px,${a}`;
    default:return`background:${a}`;
  }
}
function shapeHTML(c){
  const col=c.shapeColor||"#fff";
  switch(c.shape){
    case"circle":return`<div class="shape" style="width:56%;aspect-ratio:1;border-radius:50%;background:${col};left:22%;top:30%;opacity:.9"></div>`;
    case"arch":return`<div class="shape" style="width:64%;height:56%;border-radius:999px 999px 0 0;border:3px solid ${col};left:18%;bottom:14%;opacity:.8"></div>`;
    case"diamond":return`<div class="shape" style="width:46%;aspect-ratio:1;background:${col};left:27%;top:34%;transform:rotate(45deg);opacity:.85"></div>`;
    case"mountain":return`<div class="shape" style="inset:auto 0 0 0;height:42%;background:${col};clip-path:polygon(0 100%,0 55%,22% 20%,40% 60%,62% 0,82% 45%,100% 25%,100% 100%);opacity:.85"></div>`;
    case"heart":return`<svg class="shape" viewBox="0 0 24 24" style="width:54%;left:23%;top:32%;opacity:.85"><path fill="${col}" d="M12 21s-7.5-4.6-10-9.3C.4 8.5 2.3 4.5 6 4.5c2.2 0 3.6 1.2 4.2 2.3h3.6C14.4 5.7 15.8 4.5 18 4.5c3.7 0 5.6 4 4 7.2C19.5 16.4 12 21 12 21z"/></svg>`;
    default:return"";
  }
}
function coverHTML(s){
  const c=s.cover&&s.cover.bg?s.cover:{bg:"#1D1A33",pattern:"none",font:"display",text:"#fff"};
  return`<div class="cover"><div class="pat" style="${patternCSS(c)}"></div>${c.ai?`<div class="pat" style="background:${AI_OVERLAY}"></div>`:""}${shapeHTML(c)}
  <div class="ct" style="font-family:${FONTS[c.font]||FONTS.display};color:${c.text}">${esc(s.title||"Titre de ton histoire")}</div>
  <div class="ca" style="color:${c.text}">${esc(s.author||"Ton pseudo")}</div></div>`;
}
function cardHTML(s){
  const n=s.review_count;
  return`<a class="card" href="#histoire-${s.id}">${coverHTML(s)}
    <h3>${esc(s.title)}</h3>
    <div class="meta"><span>${esc(s.author)}</span></div>
    <div class="meta"><span class="tag">${esc(s.genre)}</span><span class="tag">${s.type==="courte"?"Courte":s.chapter_count+" chap."}</span></div>
    <div class="meta">${n?`<span class="stars">${starStr(s.avg)}</span><span>${s.avg.toFixed(1)} (${n})</span>`:`<span>Pas encore d'avis</span>`}</div></a>`;
}

/* ---------- Explorer ---------- */
async function loadExplorer(){
  if(state.section==="adulte"&&!state.me?.adult){state.section="jeunesse";syncSeg()}
  const p=new URLSearchParams({section:state.section,sort:state.sort});
  if(state.genre!=="Tous")p.set("genre",state.genre);
  if(state.length!=="tout")p.set("type",state.length);
  if(state.q)p.set("q",state.q);
  return (await api("GET","/api/stories?"+p)).stories;
}
function viewExplorer(list){
  const sec=state.section,heroBooks=list.slice(0,3);
  return`
  <section class="hero">
    <div>
      <div class="eyebrow">${sec==="jeunesse"?"Section Jeunesse":"Section Adulte"} · la bibliothèque gratuite</div>
      <h1>Écris ce que tu veux.<br>Signe d'un pseudo.</h1>
      <p>Des histoires écrites par des gens comme toi, à lire gratuitement. Fantaisie, souvenirs, romance ou n'importe quoi d'autre : ici, c'est toi qui choisis. Personne ne connaît ton vrai nom, ni celui des lecteurs.</p>
      <div class="row"><a class="btn primary" href="#ecrire">Commencer une histoire</a>${list.length?`<a class="btn" href="#histoire-${list[Math.floor(Math.random()*list.length)].id}">Lire au hasard</a>`:""}</div>
    </div>
    <div class="hero-shelf" aria-hidden="true">${heroBooks.map(coverHTML).join("")}</div>
  </section>
  <div class="eyebrow">Genres</div>
  <div class="chips" id="genreChips">${["Tous",...GENRES].map(g=>`<button class="chip" aria-pressed="${state.genre===g}" data-g="${g}">${g}</button>`).join("")}</div>
  <div class="toolbar">
    <div class="row">
      <input type="search" id="q" placeholder="Chercher un titre ou un pseudo" value="${esc(state.q)}" aria-label="Rechercher">
      <select id="len" aria-label="Longueur"><option value="tout">Toutes longueurs</option><option value="courte" ${state.length==="courte"?"selected":""}>Histoires courtes</option><option value="chapitres" ${state.length==="chapitres"?"selected":""}>À chapitres</option></select>
    </div>
    <select id="sort" aria-label="Trier"><option value="recent">Plus récentes</option><option value="note" ${state.sort==="note"?"selected":""}>Mieux notées</option><option value="lus" ${state.sort==="lus"?"selected":""}>Plus lues</option></select>
  </div>
  ${list.length?`<div class="grid">${list.map(cardHTML).join("")}</div>`:`<div class="empty" style="margin-top:20px">Aucune histoire ici pour l'instant.<br><a href="#ecrire">Sois la première personne à en écrire une.</a></div>`}`;
}
function bindExplorer(){
  $("#genreChips").addEventListener("click",e=>{const b=e.target.closest("[data-g]");if(!b)return;state.genre=b.dataset.g;render()});
  $("#len").onchange=e=>{state.length=e.target.value;render()};
  $("#sort").onchange=e=>{state.sort=e.target.value;render()};
  let tm;$("#q").oninput=e=>{clearTimeout(tm);tm=setTimeout(async()=>{state.q=e.target.value;await render();const q=$("#q");if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}},350)};
}

/* ---------- Histoire ---------- */
let reading={id:null,ch:0},newStars=0;
async function loadStory(id){
  try{return (await api("GET","/api/stories/"+encodeURIComponent(id))).story}
  catch(e){if(e.message==="adult_only")return{adultOnly:true};return{error:e.message}}
}
function viewStory(s){
  if(s.adultOnly)return adultGateHTML();
  if(s.error)return`<div class="empty">${esc(s.error)}</div>`;
  if(reading.id!==s.id){reading={id:s.id,ch:0};newStars=0;markRead(s.id)}
  const ch=s.chapters[reading.ch]||s.chapters[0];
  const r=s.reviews,myReview=r.find(x=>x.mine);
  if(!newStars&&myReview)newStars=myReview.stars;
  return`
  <section class="story-head">
    ${coverHTML(s)}
    <div class="info">
      <div class="row"><span class="tag ${s.section==="jeunesse"?"j":"a"}">${s.section==="jeunesse"?"Jeunesse":"Adulte"}</span><span class="tag">${esc(s.genre)}</span><span class="tag">${s.type==="courte"?"Histoire courte":s.chapters.length+" chapitres"}</span></div>
      <h1>${esc(s.title)}</h1>
      <div class="author-line">${avatar(s.author,s.author_color)}<a href="#auteur-${encodeURIComponent(s.author)}">${esc(s.author)}</a>
        ${s.mine?"":`<button class="btn small" id="followBtn">${s.following?"Abonné·e ✓":"Suivre"}</button>`}</div>
      <p style="margin:0;font-size:16px;max-width:60ch">${esc(s.summary)}</p>
      <div class="row muted" style="font-size:14px">${r.length?`<span class="stars">${starStr(s.avg)}</span> ${s.avg.toFixed(1)} sur 5 · ${r.length} avis ·`:""} ${(s.reads||0).toLocaleString("fr-FR")} lectures · publiée le ${fmtDate(s.created_at)}</div>
      <div class="row"><a class="btn primary" href="#lecture" id="readBtn">Lire ${s.type==="courte"?"l'histoire":"le chapitre "+(reading.ch+1)}</a>
        ${s.mine?`<a class="btn small" href="#modifier-${s.id}">Modifier</a><button class="btn ghost small" id="delStory">Supprimer</button>`:`<button class="report" data-report-type="story" data-report-id="${s.id}">Signaler cette histoire</button>`}</div>
    </div>
  </section>
  ${s.type!=="courte"?`<div style="margin-top:28px"><div class="eyebrow" style="margin-bottom:8px">Chapitres</div><div class="chap-list" id="chapList">${s.chapters.map((c,i)=>`<button data-ch="${i}" class="${i===reading.ch?"on":""}"><span>${i+1}. ${esc(c.title)}</span><span class="muted">${Math.max(1,Math.round(c.body.split(/\s+/).length/200))} min</span></button>`).join("")}</div></div>`:""}
  <section class="reader" id="lecture">
    <h2>${s.type==="courte"?esc(s.title):`Chapitre ${reading.ch+1} · ${esc(ch.title)}`}</h2>
    <article>${paras(ch.body).map(p=>`<p>${esc(p)}</p>`).join("")}</article>
    ${s.type!=="courte"?`<div class="nav"><button class="btn" id="prevCh" ${reading.ch===0?"disabled":""}>← Précédent</button>${reading.ch<s.chapters.length-1?`<button class="btn primary" id="nextCh">Chapitre suivant →</button>`:`<span class="muted">Fin des chapitres publiés. Suis ${esc(s.author)} pour savoir quand la suite arrive.</span>`}</div>`:""}
  </section>
  <section class="cols">
    <div class="panel stack">
      <h2>Avis des lecteurs</h2>
      ${r.length?r.map(v=>`<div class="review"><div class="who"><b>${esc(v.who)}${v.mine?" (toi)":""}</b><span class="stars">${starStr(v.stars)}</span></div><div>${esc(v.body)}</div><div class="row muted" style="font-size:12px"><span>${fmtDate(v.created_at)}</span>${v.mine?"":`<button class="report" data-report-type="review" data-report-id="${v.id}">Signaler</button>`}</div></div>`).join(""):`<p class="muted">Personne n'a encore donné son avis. Le premier fait toujours plaisir à l'auteur.</p>`}
    </div>
    <div class="panel stack">
      ${s.mine?(s.type==="chapitres"?`<h3>Ajouter le chapitre ${s.chapters.length+1}</h3>
      <input type="text" id="ncTitle" maxlength="80" placeholder="Titre du chapitre">
      <textarea id="ncBody" rows="8" placeholder="La suite de ton histoire… (laisse une ligne vide entre deux paragraphes)"></textarea>
      <div id="ncErr" class="note" hidden></div>
      <button class="btn primary" id="ncSend">Publier ce chapitre</button>
      <p class="muted" style="font-size:12px;margin:0">Pense à l'annoncer sur ton blog depuis Mon espace.</p>`:`<h3>C'est ton histoire</h3><p class="muted" style="margin:0">Les avis de tes lecteurs apparaissent à gauche.</p>`):
      !state.me?`<h3>Donne ton avis</h3><p class="muted" style="margin:0">Il faut un compte pour noter une histoire. Ton avis peut quand même rester anonyme.</p><button class="btn primary" id="loginToReview">Se connecter ou créer un compte</button>`:
      `<h3>${myReview?"Modifier mon avis":"Donne ton avis"}</h3>
      <div class="star-input" id="starIn" role="radiogroup" aria-label="Note sur 5">${[1,2,3,4,5].map(n=>`<button data-s="${n}" class="${n<=newStars?"on":""}" aria-label="${n} étoile${n>1?"s":""}">★</button>`).join("")}</div>
      <textarea id="revTxt" rows="4" maxlength="400" placeholder="Ta petite critique : ce que tu as aimé, ce qui t'a moins plu…">${myReview?esc(myReview.body):""}</textarea>
      <label class="row" style="font-size:14px"><input type="checkbox" id="revAnon" checked> Publier en anonyme</label>
      <div id="revErr" class="note" hidden></div>
      <button class="btn primary" id="revSend">Publier mon avis</button>
      <p class="muted" style="font-size:12px;margin:0">Sois sympa et constructif. Les avis méchants ou avec des infos personnelles sont retirés.</p>`}
    </div>
  </section>`;
}
function markRead(id){try{const k="read_"+id;if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1")}catch(e){}api("POST","/api/stories/"+id+"/read").catch(()=>{})}
function bindStory(s){
  if(s.adultOnly)return bindAdultGate();
  if(s.error)return;
  const toReader=()=>$("#lecture").scrollIntoView({behavior:"smooth"});
  $("#chapList")?.addEventListener("click",e=>{const b=e.target.closest("[data-ch]");if(!b)return;reading.ch=+b.dataset.ch;paint();toReader()});
  $("#prevCh")?.addEventListener("click",()=>{reading.ch--;paint();$("#lecture").scrollIntoView()});
  $("#nextCh")?.addEventListener("click",()=>{reading.ch++;paint();$("#lecture").scrollIntoView()});
  $("#readBtn").onclick=e=>{e.preventDefault();toReader()};
  $("#followBtn")?.addEventListener("click",()=>toggleFollow(s.author));
  $("#loginToReview")?.addEventListener("click",()=>needLogin());
  $("#delStory")?.addEventListener("click",()=>modal(`<h3>Supprimer « ${esc(s.title)} » ?</h3><p style="margin:0">L'histoire, ses chapitres et ses avis seront effacés pour toujours.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Annuler</button><button class="btn primary" id="delOk">Supprimer</button></div>`,
    m=>{$("#delOk",m).onclick=async()=>{try{await api("DELETE","/api/stories/"+s.id);closeModal();toast("Histoire supprimée");go("espace")}catch(e){closeModal();toast(e.message)}}}));
  $("#ncSend")?.addEventListener("click",async()=>{
    const t=$("#ncTitle").value.trim(),b=$("#ncBody").value.trim(),err=$("#ncErr");
    if(b.split(/\s+/).length<20)return showErr(err,"Le chapitre doit faire au moins 20 mots.");
    if(personal(t+" "+b))return showErr(err,"Ton texte contient un e-mail, un numéro ou un compte de réseau social. Retire-le pour rester anonyme.");
    try{const r=await api("POST",`/api/stories/${s.id}/chapters`,{title:t,body:b});reading.ch=r.position;toast("Chapitre publié !");lastRoute="";await render();$("#lecture")?.scrollIntoView()}
    catch(e){showErr(err,e.message)}
  });
  $("#starIn")?.addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;newStars=+b.dataset.s;[...$("#starIn").children].forEach((x,i)=>x.classList.toggle("on",i<newStars))});
  $("#revSend")?.addEventListener("click",async()=>{
    const t=$("#revTxt").value.trim(),err=$("#revErr");
    if(!newStars)return showErr(err,"Choisis une note de 1 à 5 étoiles.");
    if(t.length<5)return showErr(err,"Écris au moins quelques mots pour expliquer ta note.");
    if(personal(t))return showErr(err,"Pour ta sécurité, ne mets pas d'e-mail, de numéro ou de compte de réseau social dans ton avis.");
    try{await api("POST",`/api/stories/${s.id}/reviews`,{stars:newStars,body:t,anonymous:$("#revAnon").checked});newStars=0;toast("Ton avis est publié");render()}
    catch(e){showErr(err,e.message)}
  });
}
let lastStory=null;
function paint(){if(lastStory){$("#app").innerHTML=viewStory(lastStory);bindStory(lastStory);bindReports()}}

function bindReports(){document.querySelectorAll("[data-report-type]").forEach(b=>b.onclick=()=>{
  const reasons=["Contenu pas adapté à la section Jeunesse","Méchanceté ou harcèlement","Informations personnelles","Plagiat","Autre chose"];
  modal(`<h3>Signaler ${b.dataset.reportType==="story"?"cette histoire":"cet avis"}</h3><p class="muted" style="margin:0">Dis-nous ce qui ne va pas. Une personne de l'équipe de modération regardera.</p>
  <div class="stack" style="gap:8px">${reasons.map((r,i)=>`<label class="row"><input type="radio" name="rep" value="${esc(r)}" ${i===0?"checked":""}> ${r}</label>`).join("")}</div>
  <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Annuler</button><button class="btn primary" id="repOk">Envoyer le signalement</button></div>`,
  m=>{$("#repOk",m).onclick=async()=>{
    try{await api("POST","/api/reports",{targetType:b.dataset.reportType,targetId:+b.dataset.reportId,reason:$("input[name=rep]:checked",m).value});closeModal();toast("Merci, le signalement est envoyé")}
    catch(e){closeModal();toast(e.message)}}});
})}

/* ---------- Section Adulte ---------- */
function adultGateHTML(){return`<div class="empty stack" style="max-width:520px;margin:30px auto;align-items:center">
  <h2>Section Adulte</h2>
  <p style="margin:0">Cette partie contient des histoires écrites pour les plus de 18 ans. Elle est ouverte seulement aux comptes de 18 ans et plus.</p>
  <div class="row" style="justify-content:center"><button class="btn" id="gateNo">Retour à Jeunesse</button>${state.me?"":`<button class="btn primary" id="gateLogin">Se connecter</button>`}</div></div>`}
function bindAdultGate(){$("#gateNo").onclick=()=>{setSection("jeunesse");go("explorer")};$("#gateLogin")?.addEventListener("click",()=>needLogin("explorer"))}

async function toggleFollow(p){
  if(!state.me)return needLogin();
  try{const r=await api("POST","/api/authors/"+encodeURIComponent(p)+"/follow");toast(r.following?"Tu suis "+p+". Ses annonces arrivent dans Mon espace.":"Tu ne suis plus "+p);render()}
  catch(e){toast(e.message)}
}

/* ---------- Auteur ---------- */
async function loadAuthor(p){try{return (await api("GET","/api/authors/"+encodeURIComponent(p))).author}catch(e){return{error:e.message}}}
function viewAuthor(a){
  if(a.error)return`<div class="empty">${esc(a.error)}</div>`;
  return`<section class="author-head">${avatar(a.pseudo,a.color)}
    <div class="stack" style="gap:6px;min-width:0;flex:1">
      <div class="eyebrow">Auteur·rice</div><h1>${esc(a.pseudo)}</h1>
      <div class="stats"><span><b>${a.followers}</b>abonnés</span><span><b>${a.stories.length}</b>histoires</span><span><b>${a.stories.reduce((x,s)=>x+(s.reads||0),0).toLocaleString("fr-FR")}</b>lectures</span></div>
    </div>
    ${a.isMe?`<a class="btn" href="#espace">Modifier mon profil</a>`:`<button class="btn ${a.following?"":"primary"}" id="followBtn">${a.following?"Abonné·e ✓":"Suivre"}</button>`}
  </section>
  <section class="cols" style="margin-top:0">
    <div class="stack">
      <div class="panel"><div class="eyebrow" style="margin-bottom:6px">Biographie</div><p style="margin:0">${esc(a.bio)||'<span class="muted">Pas encore de biographie.</span>'}</p></div>
      <h2>Ses histoires</h2>
      ${a.stories.length?`<div class="grid" style="margin-top:0">${a.stories.map(cardHTML).join("")}</div>`:`<div class="empty">Aucune histoire publiée pour l'instant.</div>`}
    </div>
    <div class="panel stack">
      <h2>Le petit blog</h2>
      <p class="muted" style="margin:0;font-size:14px">Annonces de suites, questions aux lecteurs, coulisses.</p>
      ${a.posts.length?a.posts.map(x=>`<div class="post"><time>${fmtDate(x.created_at)}</time><div>${esc(x.body)}</div></div>`).join(""):`<p class="muted">Rien pour le moment.</p>`}
    </div>
  </section>`;
}
function bindAuthor(a){$("#followBtn")?.addEventListener("click",()=>toggleFollow(a.pseudo))}

/* ---------- Connexion / inscription / code de secours ---------- */
let authTab="signup",recoverMode="email";
const passInput=(id,ac,label)=>`<div class="field"><label for="${id}">${label}</label><input type="password" id="${id}" minlength="8" autocomplete="${ac}" required class="pw"></div>`;
function viewAuth(){
  const y=new Date().getFullYear(),T=authTab,R=state.mail?recoverMode:"code";
  return`<div class="panel stack" style="max-width:460px;margin:10px auto">
    <div class="tabs" id="authTabs"><button class="opt" data-t="signup" aria-pressed="${T==="signup"}">Créer un compte</button><button class="opt" data-t="login" aria-pressed="${T!=="signup"}">J'ai déjà un compte</button></div>
    <h2>${T==="signup"?"Ton identité d'auteur":T==="login"?"Content de te revoir":"Mot de passe oublié"}</h2>
    ${T==="signup"?`<p class="muted" style="margin:0">Les lecteurs ne verront que ton pseudo : pas de prénom, pas de nom.</p>`:""}
    ${T==="recover"&&state.mail?`<div class="tabs" id="recTabs"><button class="opt" data-m="email" aria-pressed="${R==="email"}">Par e-mail</button><button class="opt" data-m="code" aria-pressed="${R==="code"}">Avec mon code</button></div>`:""}
    ${T==="recover"&&R==="email"?`<p class="muted" style="margin:0">Si tu as donné un e-mail de secours, on t'y envoie un lien pour choisir un nouveau mot de passe.</p>`:""}
    ${T==="recover"&&R==="code"?`<p class="muted" style="margin:0">Utilise le code de secours qu'on t'a donné à l'inscription (il ressemble à ABCD-EFGH-JKLM).</p>`:""}
    <form id="authForm" class="stack" novalidate>
      <div class="field"><label for="aPseudo">Pseudo</label><input type="text" id="aPseudo" maxlength="24" autocomplete="username" placeholder="ex. PlumeDeCorbeau" required></div>
      ${T==="signup"?`<div class="row muted" style="font-size:13px">Idées : ${["EncreViolette","RenardDesMots","Nuage_Bleu"].map(x=>`<button type="button" class="btn small" data-idea="${x}">${x}</button>`).join("")}</div>`:""}
      ${T==="recover"&&R==="code"?`<div class="field"><label for="aCode">Code de secours</label><input type="text" id="aCode" maxlength="20" autocomplete="off" placeholder="ABCD-EFGH-JKLM" style="text-transform:uppercase;letter-spacing:.08em"></div>`:""}
      ${T==="recover"&&R==="email"?"":passInput("aPass",T==="login"?"current-password":"new-password",T==="recover"?"Nouveau mot de passe":"Mot de passe")}
      ${T==="signup"?`
      <div class="field"><label for="aYear">Année de naissance</label><select id="aYear"><option value="">Choisis</option>${Array.from({length:91},(_,i)=>y-10-i).map(v=>`<option>${v}</option>`).join("")}</select>
        <span class="muted" style="font-size:12px">Elle n'est jamais affichée. Elle sert à te montrer les bonnes sections.</span></div>
      <div class="field"><label for="aEmail">E-mail</label><input type="email" id="aEmail" maxlength="120" autocomplete="email" placeholder="ex. adresse@exemple.fr" required>
        <span class="muted" style="font-size:12px">Jamais montré aux lecteurs ni aux autres membres. Il sert à récupérer ton compte et à la modération. Moins de 15 ans : mets celui d'un parent.</span></div>
      <label class="check" id="parentRow" hidden><input type="checkbox" id="aParent"> <span>J'ai moins de 15 ans et un parent est d'accord pour que je crée ce compte.</span></label>
      <label class="check"><input type="checkbox" id="aTerms"> <span>J'ai lu et j'accepte <a href="#charte" target="_blank">la charte de Mille Plumes</a> et <a href="#confidentialite" target="_blank">la politique de confidentialité</a>.</span></label>`:""}
      <div id="aErr" class="note" hidden></div>
      <button class="btn primary" type="submit">${T==="signup"?"Créer mon compte":T==="login"?"Me connecter":R==="email"?"M'envoyer le lien":"Changer mon mot de passe"}</button>
      ${T==="login"?`<button type="button" class="btn ghost small" id="toRecover">Mot de passe oublié ?</button>`:""}
      ${T==="recover"?`<button type="button" class="btn ghost small" id="toLogin">Retour à la connexion</button>`:""}
    </form></div>`;
}
function showRecoveryCode(code,next){
  modal(`<div class="eyebrow">À garder précieusement</div><h2>Ton code de secours</h2>
    <p style="margin:0">Ce code te permet de récupérer ton compte si tu oublies ton mot de passe et que tu n'as plus accès à ton e-mail. Télécharge-le, note-le sur papier ou fais une capture d'écran.</p>
    <div class="code-box" id="codeBox">${esc(code)}</div>
    <div class="row"><button class="btn small" id="copyCode">Copier</button><button class="btn small" id="dlCode">Télécharger</button><span class="muted" style="font-size:13px">On ne pourra plus te le montrer.</span></div>
    <label class="check"><input type="checkbox" id="codeOk"> <span>J'ai bien noté mon code.</span></label>
    <button class="btn primary" id="codeDone" disabled>Continuer</button>`);
  // on remplace la modale par une copie : elle ne se ferme plus en touchant à côté
  const m=$("#layer .modal");if(m){const c=m.cloneNode(true);m.replaceWith(c);
    $("#copyCode",c).onclick=async()=>{try{await navigator.clipboard.writeText(code);toast("Code copié")}catch(e){const r=document.createRange();r.selectNodeContents($("#codeBox",c));const sel=getSelection();sel.removeAllRanges();sel.addRange(r)}};
    $("#dlCode",c).onclick=()=>{const t=`Mille Plumes : mon code de secours\n\nPseudo : ${state.me?state.me.pseudo:""}\nCode de secours : ${code}\n\nÀ utiliser dans « Mot de passe oublié ? » sur la page de connexion.\n`;
      const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/plain"}));a.download="mille-plumes-code-secours.txt";document.body.appendChild(a);a.click();a.remove();toast("Code téléchargé")};
    $("#codeOk",c).onchange=e=>$("#codeDone",c).disabled=!e.target.checked;
    $("#codeDone",c).onclick=()=>{closeModal();next&&next()};}
}
function bindAuth(){
  $("#authTabs").onclick=e=>{const b=e.target.closest("[data-t]");if(!b)return;authTab=b.dataset.t;render()};
  $("#toRecover")?.addEventListener("click",()=>{authTab="recover";render()});
  $("#toLogin")?.addEventListener("click",()=>{authTab="login";render()});
  $("#recTabs")?.addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(!b)return;recoverMode=b.dataset.m;render()});
  document.querySelectorAll("[data-idea]").forEach(b=>b.onclick=()=>$("#aPseudo").value=b.dataset.idea);
  $("#aYear")?.addEventListener("change",e=>{$("#parentRow").hidden=!(e.target.value&&new Date().getFullYear()-e.target.value<15)});
  $("#authForm").onsubmit=async e=>{
    e.preventDefault();const err=$("#aErr");err.hidden=true;
    const T=authTab,R=state.mail?recoverMode:"code";
    if(T==="recover"&&R==="email"){const pseudo=$("#aPseudo").value.trim();if(!pseudo)return showErr(err,"Écris ton pseudo.");
      try{await api("POST","/api/recover-email",{pseudo});err.className="note ok";err.textContent="Si ce pseudo a un e-mail de secours, un lien vient d'y être envoyé (valable 1 heure). Pense à regarder dans les spams.";err.hidden=false}catch(x){showErr(err,x.message)}
      return}
    const body={pseudo:$("#aPseudo").value.trim(),password:$("#aPass").value};
    if(T==="signup"){body.birthYear=$("#aYear").value;body.parentOk=$("#aParent").checked;body.acceptTerms=$("#aTerms").checked;body.email=$("#aEmail").value.trim();
      if(!body.birthYear)return showErr(err,"Choisis ton année de naissance.");
      if(!body.email)return showErr(err,"L'e-mail est obligatoire. Il n'est jamais montré aux lecteurs.");
      if(!body.acceptTerms)return showErr(err,"Lis et accepte la charte pour créer ton compte.")}
    if(T==="recover")body.code=$("#aCode").value;
    try{
      const r=await api("POST",{signup:"/api/signup",login:"/api/login",recover:"/api/recover"}[T],body);
      state.me=r.me;updateNav();
      const n=state.afterLogin||"explorer";state.afterLogin=null;
      const done=()=>{toast(T==="login"?"Re-bonjour, "+r.me.pseudo:T==="recover"?"Mot de passe changé":r.checkSent?"Bienvenue ! Clique sur le lien reçu par e-mail pour confirmer ton adresse.":"Bienvenue, "+r.me.pseudo);authTab="login";go(n)};
      if(r.recoveryCode)showRecoveryCode(r.recoveryCode,done);else done();
    }catch(e){showErr(err,e.message)}
  };
}

/* ---------- Nouveau mot de passe (lien reçu par e-mail) ---------- */
function viewReinit(){return`<div class="panel stack" style="max-width:460px;margin:10px auto"><h2>Choisis un nouveau mot de passe</h2>
  <form id="riForm" class="stack" novalidate>${passInput("riPass","new-password","Nouveau mot de passe")}<div id="riErr" class="note" hidden></div><button class="btn primary" type="submit">Enregistrer</button></form></div>`}
function bindReinit(token){$("#riForm").onsubmit=async e=>{e.preventDefault();
  try{const r=await api("POST","/api/reset",{token,password:$("#riPass").value});state.me=r.me;updateNav();toast("Mot de passe changé");go("espace")}catch(x){showErr($("#riErr"),x.message)}}}

/* ---------- Confirmation de l'e-mail (lien reçu) ---------- */
async function loadVerify(token){try{const r=await api("POST","/api/verify-email",{token});if(r.me){state.me=r.me;updateNav()}return{ok:true}}catch(e){return{ok:false,msg:e.message}}}
function viewVerify(d){return`<div class="panel stack" style="max-width:460px;margin:10px auto;text-align:center">${d.ok?`<h2>E-mail confirmé ✓</h2><p style="margin:0">Tu peux maintenant publier tes histoires, tes avis et ton blog.</p><div><a class="btn primary" href="#ecrire">Écrire une histoire</a></div>`:`<h2>Lien expiré</h2><p style="margin:0">${esc(d.msg)}</p><div><a class="btn" href="#espace">Mon espace</a></div>`}</div>`}

/* ---------- Atelier d'écriture ---------- */
let draft=null;
function newDraft(){return{title:"",summary:"",section:"jeunesse",genre:"Fantaisie",type:"courte",chapters:[{t:"",body:""}],
  cover:{bg:"#3B1F5C",bg2:"#D3336A",pattern:"gradient",shape:"circle",shapeColor:"#F2C94C",font:"display",text:"#FFFFFF"}}}
function wc(t){const n=(t||"").trim()?t.trim().split(/\s+/).length:0;return n+" mot"+(n>1?"s":"")+(n?` · environ ${Math.max(1,Math.round(n/200))} min de lecture`:"")}
let editing=null; // id de l'histoire en cours de modification
async function loadEdit(id){
  const s=(await api("GET","/api/stories/"+encodeURIComponent(id))).story;
  if(!s.mine)throw new Error("Tu ne peux modifier que tes propres histoires.");
  editing=s.id;
  draft={title:s.title,summary:s.summary,section:s.section,genre:s.genre,type:s.type,cover:{...s.cover},chapters:s.chapters.map(c=>({t:c.title,body:c.body}))};
  return s;
}
function viewWrite(){
  if(location.hash.startsWith("#ecrire")&&editing){editing=null;draft=null}
  draft=draft||store.get("draft",null)||newDraft();
  const d=draft,c=d.cover;
  const sw=key=>`<div class="swatches" data-key="${key}">${PALETTE.map(col=>`<button class="sw" style="background:${col}" data-v="${col}" aria-label="${col}" aria-pressed="${c[key]===col}"></button>`).join("")}</div>`;
  const opts=(key,obj)=>`<div class="opt-row" data-key="${key}">${Object.entries(obj).map(([k,v])=>`<button class="opt" data-v="${k}" aria-pressed="${c[key]===k}" ${key==="font"?`style="font-family:${FONTS[k]}"`:""}>${v}</button>`).join("")}</div>`;
  return`<div class="eyebrow">Atelier d'écriture · tu publies en tant que ${esc(state.me.pseudo)}</div>
  <h1 style="margin:6px 0 22px">${editing?"Modifier mon histoire":"Nouvelle histoire"}</h1>
  <div class="studio">
    <div class="stack">
      <div class="field"><label for="wTitle">Titre</label><input type="text" id="wTitle" maxlength="70" value="${esc(d.title)}" placeholder="Le titre de ton histoire"></div>
      <div class="field"><label for="wSum">Résumé</label><textarea id="wSum" rows="2" maxlength="300" placeholder="Deux ou trois phrases pour donner envie">${esc(d.summary)}</textarea></div>
      <div class="two">
        <div class="field"><label for="wSec">Section</label><select id="wSec"><option value="jeunesse">Jeunesse</option>${state.me.adult?`<option value="adulte" ${d.section==="adulte"?"selected":""}>Adulte (18+)</option>`:""}</select></div>
        <div class="field"><label for="wGenre">Genre</label><select id="wGenre">${GENRES.map(g=>`<option ${g===d.genre?"selected":""}>${g}</option>`).join("")}</select></div>
      </div>
      <div class="field"><span class="lab">Format</span><div class="tabs" id="wType"><button class="opt" data-v="courte" aria-pressed="${d.type==="courte"}">Histoire courte</button><button class="opt" data-v="chapitres" aria-pressed="${d.type==="chapitres"}">Histoire à chapitres</button></div></div>
      <div class="stack" id="chapEdits">${d.chapters.map((ch,i)=>`<div class="chap-edit">
        ${d.type==="chapitres"?`<div class="row" style="justify-content:space-between"><b>Chapitre ${i+1}</b>${d.chapters.length>1?`<button class="btn ghost small" data-del="${i}">Retirer</button>`:""}</div><input type="text" data-ct="${i}" value="${esc(ch.t)}" placeholder="Titre du chapitre">`:""}
        <textarea data-cb="${i}" rows="${d.type==="chapitres"?8:12}" placeholder="Il était une fois… (laisse une ligne vide entre deux paragraphes)">${esc(ch.body)}</textarea>
        <div class="muted" style="font-size:12px" data-wc="${i}">${wc(ch.body)}</div></div>`).join("")}</div>
      ${d.type==="chapitres"?`<button class="btn" id="addCh">+ Ajouter un chapitre</button>`:""}
      <div id="wErr" class="note" hidden></div>
      <div class="row">${editing?`<button class="btn primary" id="publish">Enregistrer les modifications</button><a class="btn ghost" href="#histoire-${editing}">Annuler</a>`:`<button class="btn primary" id="publish">Publier</button><button class="btn" id="saveDraft">Garder le brouillon</button><button class="btn ghost" id="resetDraft">Tout effacer</button>`}</div>
    </div>
    <aside class="designer panel">
      <div class="eyebrow">Ta couverture</div>
      <div id="coverPrev">${coverHTML({title:d.title,author:state.me.pseudo,cover:c})}</div>
      <div class="field"><span class="lab">Fond</span>${opts("pattern",PATTERNS)}</div>
      <div class="field"><span class="lab">Couleur 1</span>${sw("bg")}</div>
      <div class="field"><span class="lab">Couleur 2</span>${sw("bg2")}</div>
      <div class="field"><span class="lab">Forme</span>${opts("shape",SHAPES)}</div>
      <div class="field"><span class="lab">Couleur de la forme</span>${sw("shapeColor")}</div>
      <div class="field"><span class="lab">Police du titre</span>${opts("font",FONT_LABEL)}</div>
      <div class="field"><span class="lab">Couleur du texte</span>${sw("text")}</div>
      <div class="ai-box">
        <b>★ Couverture par IA</b>
        <span style="font-size:14px">Décris l'ambiance et l'IA propose une couverture. Réservé au Premium.</span>
        <input type="text" id="aiPrompt" placeholder="ex. forêt brumeuse, lune rouge, mystère">
        <button class="btn gold" id="aiGen">Générer avec l'IA</button>
      </div>
    </aside>
  </div>`;
}
function refreshCover(){$("#coverPrev").innerHTML=coverHTML({title:draft.title,author:state.me.pseudo,cover:draft.cover})}
function bindWrite(){
  const d=draft;
  $("#wTitle").oninput=e=>{d.title=e.target.value;refreshCover()};
  $("#wSum").oninput=e=>d.summary=e.target.value;
  $("#wSec").onchange=e=>d.section=e.target.value;
  $("#wGenre").onchange=e=>d.genre=e.target.value;
  $("#wType").onclick=e=>{const b=e.target.closest("[data-v]");if(!b)return;d.type=b.dataset.v;if(d.type==="courte")d.chapters=[{t:"",body:d.chapters.map(c=>c.body).join("\n\n").trim()}];render()};
  $("#chapEdits").addEventListener("input",e=>{
    const t=e.target;if(t.dataset.ct!=null)d.chapters[+t.dataset.ct].t=t.value;
    if(t.dataset.cb!=null){d.chapters[+t.dataset.cb].body=t.value;$(`[data-wc="${t.dataset.cb}"]`).textContent=wc(t.value)}});
  $("#chapEdits").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;d.chapters.splice(+b.dataset.del,1);render()});
  $("#addCh")?.addEventListener("click",()=>{d.chapters.push({t:"",body:""});render()});
  document.querySelectorAll(".designer [data-key]").forEach(g=>g.addEventListener("click",e=>{
    const b=e.target.closest("[data-v]");if(!b)return;d.cover[g.dataset.key]=b.dataset.v;delete d.cover.ai;
    g.querySelectorAll("[data-v]").forEach(x=>x.setAttribute("aria-pressed",x===b));refreshCover()}));
  $("#aiGen").onclick=aiCover;
  $("#saveDraft")?.addEventListener("click",()=>{store.set("draft",d);toast("Brouillon gardé sur cet appareil")});
  $("#resetDraft")?.addEventListener("click",()=>{draft=newDraft();store.set("draft",null);render()});
  $("#publish").onclick=async()=>{
    const err=$("#wErr"),fail=m=>{showErr(err,m);err.scrollIntoView({block:"center"})};
    if(!d.title.trim())return fail("Il manque un titre.");
    if(d.chapters.some(c=>c.body.trim().split(/\s+/).length<20))return fail("Chaque partie doit faire au moins 20 mots.");
    if(personal(d.title+d.summary+d.chapters.map(c=>c.body).join(" ")))return fail("Ton texte contient un e-mail, un numéro ou un compte de réseau social. Retire-le pour rester anonyme.");
    const btn=$("#publish"),label=btn.textContent;btn.disabled=true;btn.textContent="Enregistrement…";
    const payload={title:d.title,summary:d.summary,section:d.section,genre:d.genre,type:d.type,cover:d.cover,chapters:d.chapters.map(c=>({title:c.t,body:c.body}))};
    try{
      const r=editing?await api("PUT","/api/stories/"+editing,payload):await api("POST","/api/stories",payload);
      if(!editing)store.set("draft",null);
      toast(editing?"Modifications enregistrées":"Ton histoire est publiée !");draft=null;editing=null;reading.id=null;go("histoire-"+r.id);
    }catch(e){btn.disabled=false;btn.textContent=label;fail(e.message)}
  };
}
function aiCover(){
  if(!state.me.premium){premiumModal();return}
  const prompt=$("#aiPrompt").value.trim()||"mystère";
  modal(`<h3>L'IA dessine ta couverture…</h3><div class="spin"></div><p class="muted" style="text-align:center;margin:0">« ${esc(prompt)} »</p>`);
  setTimeout(()=>{
    const p=prompt.toLowerCase();
    const moods=[
      {k:/(forêt|foret|nature|arbre)/,c:{bg:"#1F6E43",bg2:"#0F4C5C",pattern:"gradient",shape:"mountain",shapeColor:"#1D1A33",font:"hand",text:"#EDE6D6"}},
      {k:/(lune|nuit|étoile|etoile|espace|ciel)/,c:{bg:"#1D1A33",bg2:"#3B1F5C",pattern:"stars",shape:"circle",shapeColor:"#F7D6E0",font:"royal",text:"#F7D6E0"}},
      {k:/(amour|romance|cœur|coeur)/,c:{bg:"#F7D6E0",bg2:"#D3336A",pattern:"gradient",shape:"heart",shapeColor:"#7A1E3A",font:"script",text:"#7A1E3A"}},
      {k:/(mer|océan|ocean|île|ile|bateau)/,c:{bg:"#0F4C5C",bg2:"#8FD3E8",pattern:"waves",shape:"mountain",shapeColor:"#1D1A33",font:"typewriter",text:"#FFFFFF"}},
      {k:/(sang|vampire|rouge|horreur|peur)/,c:{bg:"#1D1A33",bg2:"#7A1E3A",pattern:"gradient",shape:"circle",shapeColor:"#D3336A",font:"royal",text:"#F7D6E0"}},
      {k:/(drôle|drole|humour|rigolo)/,c:{bg:"#F2C94C",bg2:"#F28C38",pattern:"dots",shape:"none",shapeColor:"#1D1A33",font:"bold",text:"#1D1A33"}}];
    const m=moods.find(x=>x.k.test(p))||moods[1];
    draft.cover={...m.c,ai:true};
    closeModal();render();toast("Couverture générée (simulation)");
  },1600);
}
function premiumModal(){
  modal(`<div class="eyebrow" style="color:var(--gold)">★ Premium</div><h2>La couverture par IA est en Premium</h2>
  <p style="margin:0">Générer des images avec une IA coûte de l'argent à chaque fois. C'est pour ça que cette option fait partie de l'abonnement Premium.</p>
  <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Plus tard</button><a class="btn gold" href="#premium" data-close>Voir le Premium</a></div>`);
}

/* ---------- Mon espace ---------- */
async function loadSpace(){return api("GET","/api/space")}
function viewSpace(sp){
  const me=state.me;
  return`<section class="author-head">${avatar(me.pseudo,me.color)}
    <div class="stack" style="gap:4px;flex:1;min-width:0"><div class="eyebrow">Mon espace${me.premium?" · ★ Premium":""}</div><h1>${esc(me.pseudo)}</h1>
    <div class="row"><a class="btn small" href="#auteur-${encodeURIComponent(me.pseudo)}">Voir ma page publique</a>${me.isAdmin?`<a class="btn small primary" href="#moderation">Modération</a>`:""}<button class="btn small ghost" id="logout">Me déconnecter</button></div></div></section>
  <section class="cols" style="margin-top:0">
    <div class="stack">
      <div class="panel stack"><h3>Ma biographie</h3><textarea id="bioIn" rows="3" maxlength="300" placeholder="Parle de ce que tu aimes écrire, sans infos perso">${esc(me.bio)}</textarea><div id="bErr" class="note" hidden></div><div><button class="btn small" id="bioSave">Enregistrer</button></div></div>
      <div class="panel stack"><h3>Écrire sur mon blog</h3><textarea id="postIn" rows="3" maxlength="280" placeholder="Annonce une suite, pose une question à tes lecteurs…"></textarea><div id="poErr" class="note" hidden></div><div><button class="btn primary small" id="postSend">Publier l'annonce</button></div>
        ${sp.posts.map(x=>`<div class="post"><time>${fmtDate(x.created_at)}</time><div>${esc(x.body)}</div></div>`).join("")}</div>
      <h2>Mes histoires</h2>
      ${sp.stories.length?`<div class="grid" style="margin-top:0">${sp.stories.map(cardHTML).join("")}</div>`:`<div class="empty">Tu n'as encore rien publié. <a href="#ecrire">Écrire ma première histoire</a></div>`}
    </div>
    <div class="stack">
      <div class="panel stack">
        <h3>Les auteurs que je suis</h3>
        ${sp.follows.length?`<div class="row">${sp.follows.map(p=>`<a class="btn small" href="#auteur-${encodeURIComponent(p)}">${esc(p)}</a>`).join("")}</div>`:`<p class="muted" style="margin:0">Tu ne suis personne pour l'instant. Clique sur « Suivre » sur la page d'une histoire.</p>`}
        <h3>Leurs dernières annonces</h3>
        ${sp.feed.length?sp.feed.map(x=>`<div class="post"><time>${esc(x.pseudo)} · ${fmtDate(x.created_at)}</time><div>${esc(x.body)}</div></div>`).join(""):`<p class="muted" style="margin:0">Les annonces des auteurs que tu suis apparaîtront ici.</p>`}
      </div>
      ${me.adultPending?`<div class="note">Ton compte adulte attend la validation d'un modérateur. En attendant, tu as accès à la section Jeunesse.</div>`:""}
      <div class="panel stack"><h3>Sécurité</h3>
        ${passInput("curPass","current-password","Mot de passe actuel")}
        ${passInput("newPass","new-password","Nouveau mot de passe")}
        <div id="pwErr" class="note" hidden></div>
        <div class="row"><button class="btn small primary" id="pwSave">Changer mon mot de passe</button><button class="btn small" id="newCode">Nouveau code de secours</button></div>
        <p class="muted" style="margin:0;font-size:12px">Le nouveau code de secours remplace l'ancien. Il faut ton mot de passe actuel.</p>
        <div class="field"><label for="emIn">E-mail ${me.email?`<span class="muted">(actuel : ${esc(me.email)}${state.mail?(me.emailVerified?" · confirmé":" · pas encore confirmé"):""})</span>`:""}</label><input type="email" id="emIn" maxlength="120" autocomplete="email" placeholder="${me.email?"Nouvel e-mail":"adresse@exemple.fr"}"></div>
        <div id="emErr" class="note" hidden></div>
        <div class="row"><button class="btn small" id="emSave">${me.email?"Changer l'e-mail":"Ajouter cet e-mail"}</button>${me.email&&state.mail&&!me.emailVerified?`<button class="btn small ghost" id="emResend">Renvoyer le lien de confirmation</button>`:""}</div>
        <p class="muted" style="margin:0;font-size:12px">Il faut aussi ton mot de passe actuel (champ du haut). Ton e-mail n'est jamais montré aux lecteurs.</p>
      </div>
      <div class="panel stack"><h3>Mon compte</h3><p class="muted" style="margin:0;font-size:14px">Supprimer ton compte efface aussi tes histoires, tes avis et ton blog.</p><div><button class="btn small ghost" id="delMe">Supprimer mon compte</button></div>
        <p class="muted" style="margin:0;font-size:12px"><a href="#charte">Charte</a> · <a href="#confidentialite">Confidentialité</a> · <a href="#mentions">Mentions légales</a></p></div>
    </div>
  </section>`;
}
function bindSpace(){
  $("#bioSave").onclick=async()=>{const v=$("#bioIn").value.trim();if(personal(v))return showErr($("#bErr"),"Retire l'e-mail, le numéro ou le compte de réseau social de ta bio.");
    try{state.me=(await api("PATCH","/api/me",{bio:v})).me;toast("Biographie enregistrée")}catch(e){showErr($("#bErr"),e.message)}};
  $("#postSend").onclick=async()=>{const v=$("#postIn").value.trim(),e=$("#poErr");if(v.length<3)return showErr(e,"Écris quelque chose avant de publier.");if(personal(v))return showErr(e,"Pas d'infos personnelles dans les annonces.");
    try{await api("POST","/api/posts",{body:v});toast("Annonce publiée");render()}catch(x){showErr(e,x.message)}};
  $("#pwSave").onclick=async()=>{const e=$("#pwErr");e.hidden=true;
    try{await api("POST","/api/me/password",{currentPassword:$("#curPass").value,newPassword:$("#newPass").value});$("#curPass").value=$("#newPass").value="";toast("Mot de passe changé")}catch(x){showErr(e,x.message)}};
  $("#emSave").onclick=async()=>{const v=$("#emIn").value.trim(),e=$("#emErr");e.hidden=true;if(!v)return showErr(e,"Écris une adresse e-mail.");
    try{const r=await api("POST","/api/me/email",{email:v,currentPassword:$("#curPass").value});state.me=r.me;updateNav();toast(r.checkSent?"E-mail enregistré : clique sur le lien reçu pour le confirmer":"E-mail enregistré");render()}catch(x){showErr(e,x.message)}};
  $("#emResend")?.addEventListener("click",async()=>{try{const r=await api("POST","/api/me/email/resend");toast(r.checkSent?"Lien envoyé : regarde aussi dans les spams":"L'e-mail n'a pas pu partir, réessaie plus tard")}catch(x){toast(x.message)}});
  $("#newCode").onclick=async()=>{const e=$("#pwErr");e.hidden=true;
    try{const r=await api("POST","/api/me/recovery-code",{currentPassword:$("#curPass").value});$("#curPass").value="";showRecoveryCode(r.recoveryCode)}catch(x){showErr(e,x.message)}};
  $("#logout").onclick=async()=>{await api("POST","/api/logout").catch(()=>{});state.me=null;updateNav();toast("Tu es déconnecté·e");go("explorer")};
  $("#delMe").onclick=()=>modal(`<h3>Supprimer ton compte ?</h3><p style="margin:0">Tes histoires, tes avis, ton blog et tes abonnements seront effacés pour toujours.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Annuler</button><button class="btn primary" id="delMeOk">Tout supprimer</button></div>`,
    m=>{$("#delMeOk",m).onclick=async()=>{try{await api("DELETE","/api/me");state.me=null;updateNav();closeModal();toast("Ton compte est supprimé");go("explorer")}catch(e){closeModal();toast(e.message)}}});
}

/* ---------- Premium ---------- */
function viewPremium(){
  const on=!!state.me?.premium;
  return`<div class="eyebrow" style="color:var(--gold)">★ Premium</div><h1 style="margin:6px 0 10px">Lire et écrire reste gratuit.<br>Le Premium ajoute des bonus.</h1>
  <p class="muted" style="max-width:60ch;margin:0">Les fonctions qui coûtent cher à faire tourner, comme l'IA, sont réservées au Premium. Le paiement n'est pas encore branché : le bouton active le Premium gratuitement pour tester.</p>
  <div class="plans">
    <div class="plan"><h3>Gratuit</h3><div class="price">0 €</div><ul><li>Lire toutes les histoires</li><li>Publier sans limite</li><li>Couvertures personnalisées</li><li>Avis, abonnés, blog</li></ul><button class="btn" disabled>${on?"Inclus":"Ton offre actuelle"}</button></div>
    <div class="plan best"><h3>Premium</h3><div class="price">2,99 € <span class="muted" style="font-size:15px;font-family:var(--f-body)">/ mois</span></div><ul><li>Tout le gratuit</li><li>Couvertures générées par IA</li><li>Statistiques de lecture détaillées</li><li>Badge ★ sur ton profil</li><li>Nouvelles polices et formes</li></ul>
      <button class="btn gold" id="premBtn">${on?"Premium activé (test) · Désactiver":"Essayer gratuitement (test)"}</button></div>
  </div>`;
}
function bindPremium(){$("#premBtn").onclick=async()=>{if(!state.me)return needLogin("premium");try{state.me=(await api("POST","/api/premium")).me;toast(state.me.premium?"Premium activé pour le test":"Premium désactivé");render()}catch(e){toast(e.message)}}}

/* ---------- Modération ---------- */
async function loadModeration(){const[r,a]=await Promise.all([api("GET","/api/admin/reports"),api("GET","/api/admin/adults")]);return{reports:r.reports,adults:a.users}}
function viewModeration(d){
  const list=d.reports;
  return`<div class="eyebrow">Réservé à la modération</div><h1 style="margin:6px 0 18px">Modération</h1>
  <h2 style="margin-bottom:10px">Comptes adultes à valider</h2>
  <p class="muted" style="margin:0 0 12px;max-width:60ch">Ces personnes déclarent avoir 18 ans ou plus. Valide seulement si tu sais que c'est vrai (par exemple une personne que tu connais). Sinon, refuse : le compte garde l'accès à la section Jeunesse.</p>
  ${d.adults.length?`<div class="stack" style="margin-bottom:28px">${d.adults.map(u=>`<div class="panel row" style="justify-content:space-between"><span><b>${esc(u.pseudo)}</b> <span class="muted">· né·e en ${u.birth_year} · inscrit·e le ${fmtDate(u.created_at)}</span></span>
    <span class="row"><button class="btn small primary" data-adult="verify" data-id="${u.id}">Valider</button><button class="btn small ghost" data-adult="reject" data-id="${u.id}">Refuser</button></span></div>`).join("")}</div>`:`<div class="empty" style="margin-bottom:28px">Aucun compte en attente.</div>`}
  <h2 style="margin-bottom:10px">Signalements à traiter</h2>
  ${list.length?`<div class="stack">${list.map(r=>`<div class="panel stack" style="gap:8px">
    <div class="row" style="justify-content:space-between"><span class="tag ${r.target_type==="story"?"a":""}">${r.target_type==="story"?"Histoire":"Avis"}</span><span class="muted" style="font-size:13px">${fmtDate(r.created_at)}</span></div>
    <b>${esc(r.reason)}</b><div class="muted">${esc((r.excerpt||"(supprimé)").slice(0,200))}</div>
    <div class="row">${r.story_id?`<a class="btn small" href="#histoire-${r.story_id}">Voir</a>`:""}<button class="btn small primary" data-act="hide" data-id="${r.id}">Masquer le contenu</button><button class="btn small ghost" data-act="ok" data-id="${r.id}">Rien à signaler</button>${r.author?`<button class="btn small ghost" data-ban="${r.id}" data-who="${esc(r.author)}">Bannir ${esc(r.author)}</button>`:""}</div></div>`).join("")}</div>`:`<div class="empty">Aucun signalement en attente.</div>`}`;
}
function bindModeration(){document.querySelectorAll("[data-ban]").forEach(b=>b.onclick=()=>modal(`<h3>Bannir ${esc(b.dataset.who)} ?</h3><p style="margin:0">Son compte sera fermé, toutes ses histoires et tous ses avis seront masqués, et son e-mail ne pourra plus servir à créer un compte. À réserver aux problèmes graves ou répétés.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Annuler</button><button class="btn primary" id="banOk">Bannir</button></div>`,m=>{$("#banOk",m).onclick=async()=>{try{await api("POST","/api/admin/reports/"+b.dataset.ban,{action:"ban"});closeModal();toast(b.dataset.who+" est banni·e");render()}catch(e){closeModal();toast(e.message)}}}));document.querySelectorAll("[data-adult]").forEach(b=>b.onclick=async()=>{try{await api("POST","/api/admin/adults/"+b.dataset.id,{action:b.dataset.adult});toast(b.dataset.adult==="verify"?"Compte adulte validé":"Demande refusée");render()}catch(e){toast(e.message)}});document.querySelectorAll("[data-act]").forEach(b=>b.onclick=async()=>{try{await api("POST","/api/admin/reports/"+b.dataset.id,{action:b.dataset.act});toast(b.dataset.act==="hide"?"Contenu masqué":"Signalement classé");render()}catch(e){toast(e.message)}})}

/* ---------- Notifications ---------- */
async function loadNotifs(){const r=await api("GET","/api/notifications");if(state.me?.unread){api("POST","/api/notifications/read").catch(()=>{});state.me.unread=0;updateNav()}return r.notifications}
const NOTIF_ICON={story:"📖",chapter:"✍️",post:"💬",review:"⭐",follow:"👋",adult:"✅"};
function viewNotifs(list){
  return`<div class="eyebrow">Ce qui s'est passé</div><h1 style="margin:6px 0 18px">Notifications</h1>
  ${list.length?`<div class="panel stack notif-list">${list.map(n=>{const link=n.story_id?`#histoire-${n.story_id}`:(n.kind==="follow"||n.kind==="post")&&n.actor!=="Anonyme"?`#auteur-${encodeURIComponent(n.actor)}`:"";
    return`<${link?`a href="${link}"`:"div"} class="notif ${n.read?"":"unread"}"><span class="ni" aria-hidden="true">${NOTIF_ICON[n.kind]||"•"}</span><span class="nt"><b>${esc(n.actor)}</b> ${esc(n.body)}<time>${fmtDate(n.created_at)}</time></span></${link?"a":"div"}>`}).join("")}</div>`
  :`<div class="empty">Rien pour l'instant. Tu seras prévenu·e ici quand quelqu'un te suit, note une de tes histoires, ou quand un auteur que tu suis publie la suite.</div>`}`;
}

/* ---------- Pages légales ---------- */
function viewLegal(kind){return`<article class="legal">${(window.LEGAL||{})[kind]||""}</article>`}

/* ---------- Navigation ---------- */
function setSection(s){state.section=s;state.genre="Tous";store.set("section",s);syncSeg()}
function syncSeg(){$("#secJ").setAttribute("aria-pressed",state.section==="jeunesse");$("#secA").setAttribute("aria-pressed",state.section==="adulte")}
function updateNav(){
  const bell=$("#bell");if(bell){bell.hidden=!state.me;const n=state.me?.unread||0;$("#bellCount").textContent=n>9?"9+":n;$("#bellCount").hidden=!n;bell.setAttribute("aria-label",n?n+" notification(s) non lue(s)":"Notifications")}
  const a=$("#mainNav a[data-r=espace]");if(a)a.textContent=state.me?"Mon espace":"Se connecter";
  const t=$("#tabBar a[data-r=espace] span");if(t)t.textContent=state.me?"Mon espace":"Connexion";
  let m=$("#mainNav a[data-r=moderation]");
  if(state.me?.isAdmin&&!m){m=document.createElement("a");m.href="#moderation";m.dataset.r="moderation";m.textContent="Modération";$("#mainNav").appendChild(m)}
  if(!state.me?.isAdmin&&m)m.remove();
}
$("#secJ").onclick=()=>{setSection("jeunesse");go("explorer")};
$("#secA").onclick=()=>{
  if(!state.me?.adult){modal(`<h3>Section Adulte</h3><p style="margin:0">${state.me?.adultPending?"Ton compte adulte attend la validation d'un modérateur. Tu y auras accès dès qu'il sera validé.":"Cette partie est réservée aux comptes de 18 ans et plus, validés par un modérateur."}</p>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Rester en Jeunesse</button>${state.me?"":`<button class="btn primary" id="gLogin">Se connecter</button>`}</div>`,
    m=>{$("#gLogin",m)?.addEventListener("click",()=>{closeModal();needLogin("explorer")})});return}
  setSection("adulte");go("explorer")};

function route(){
  const h=decodeURIComponent(location.hash.slice(1))||"explorer";
  if(h.startsWith("histoire-"))return["histoire",h.slice(9)];
  if(h.startsWith("auteur-"))return["auteur",h.slice(7)];
  if(h.startsWith("modifier-"))return["modifier",h.slice(9)];
  if(h.startsWith("reinit-"))return["reinit",h.slice(7)];
  if(h.startsWith("verifier-"))return["verifier",h.slice(9)];
  if(["charte","confidentialite","mentions"].includes(h))return["legal",h];
  return[["explorer","ecrire","espace","premium","connexion","moderation","notifications"].includes(h)?h:"explorer"];
}
const VIEWS={
  explorer:[loadExplorer,viewExplorer,bindExplorer],
  histoire:[loadStory,viewStory,bindStory],
  auteur:[loadAuthor,viewAuthor,bindAuthor],
  ecrire:[null,viewWrite,bindWrite,true],
  espace:[loadSpace,viewSpace,bindSpace,true],
  premium:[null,viewPremium,bindPremium],
  connexion:[null,viewAuth,bindAuth],
  moderation:[loadModeration,viewModeration,bindModeration,true],
  modifier:[loadEdit,()=>viewWrite(),()=>bindWrite(),true],
  notifications:[loadNotifs,viewNotifs,()=>{},true],
  legal:[null,viewLegal,()=>{}],
  reinit:[null,viewReinit,bindReinit],
  verifier:[loadVerify,viewVerify,()=>{}],
};
let lastRoute="",renderId=0;
async function render(){
  let[r,arg]=route(),data;const id=++renderId,app=$("#app");
  if(r==="connexion"&&state.me){r="espace"}
  if(r!=="modifier"&&editing){editing=null;draft=null}
  const[load,view,bind,needsUser]=VIEWS[r];
  if(r==="legal"||r==="reinit"){data=arg}
  document.querySelectorAll("#mainNav a,#tabBar a").forEach(a=>a.classList.toggle("on",a.dataset.r===r||(r==="connexion"&&a.dataset.r==="espace")));
  const key=r+(arg||"");const changed=key!==lastRoute;lastRoute=key;
  if(needsUser&&!state.me){state.afterLogin=location.hash.slice(1);app.innerHTML=viewAuth();bindAuth();return}
  if(load){
    const slow=setTimeout(()=>{if(id===renderId)app.innerHTML=`<div class="spin" style="margin:60px auto"></div>`},250);
    try{data=await load(arg)}catch(e){clearTimeout(slow);if(id!==renderId)return;app.innerHTML=`<div class="empty">${esc(e.message)}<br><button class="btn" style="margin-top:12px" id="retry">Réessayer</button></div>`;$("#retry").onclick=render;return}
    clearTimeout(slow);
  }
  if(id!==renderId)return;
  if(r==="histoire")lastStory=data;
  const me=state.me,needMail=me&&r!=="verifier"&&(!me.email||(state.mail&&!me.emailVerified));
  const banner=needMail?`<div class="note" style="margin-bottom:16px">${!me.email?`Ajoute ton e-mail dans <a href="#espace">Mon espace</a> pour pouvoir publier. Il n'est jamais montré aux lecteurs.`:`Confirme ton e-mail pour pouvoir publier : clique sur le lien qu'on t'a envoyé (regarde aussi dans les spams). Tu peux le renvoyer depuis <a href="#espace">Mon espace</a>.`}</div>`:"";
  app.innerHTML=banner+view(r==="legal"?arg:data);bind(data);bindReports();
  if(changed)window.scrollTo(0,0);
}
window.addEventListener("hashchange",render);
(async()=>{
  syncSeg();
  try{const[m,c]=await Promise.all([api("GET","/api/me"),api("GET","/api/config").catch(()=>({}))]);state.me=m.me;state.mail=!!c.mail}catch(e){}
  updateNav();render();
})();
})();
