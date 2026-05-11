/* ==============================
   PATICAS TAUSTE — app.js v4
   Reels · Perfiles · Multi-foto · localStorage
   ============================== */

// ─────────────────────────────────────────
//  DATOS (con localStorage)
// ─────────────────────────────────────────
const STORAGE_KEY = 'pt_dogs_v4';

const defaultDogs = [
  { id:1, name:'Luna',  breed:'Mestizo mediano', age:'3 años', size:'Mediano', energy:'Media', emoji:'🐕', needs:'Le encanta correr y jugar. Es muy sociable con personas pero prefiere ser la única mascota en casa — no convive bien con gatos. Busca una familia activa que le dé mucho cariño.', media:[] },
  { id:2, name:'Toby',  breed:'Beagle',          age:'1 año',  size:'Pequeño', energy:'Alta',  emoji:'🐶', needs:'Cachorro muy activo y curioso. Le encanta explorar y necesita mucha socialización. Ideal para familias con niños mayores o personas jóvenes con tiempo para él.', media:[] },
  { id:3, name:'Nala',  breed:'Golden mix',       age:'5 años', size:'Grande',  energy:'Baja',  emoji:'🦮', needs:'Nala es pura calma y amor. Perfecta para familias con niños pequeños o personas mayores. Le basta con un paseo tranquilo al día y un sofá donde descansar.', media:[] },
  { id:4, name:'Coco',  breed:'Chihuahua',        age:'4 años', size:'Pequeño', energy:'Media', emoji:'🐩', needs:'Pequeña pero con mucho carácter. Le gustan los espacios acogedores y es perfecta para piso. Al principio es tímida, pero con paciencia se convierte en la mejor compañera.', media:[] },
];

function loadDogs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultDogs.map(d => ({...d}));
  } catch(e) { return defaultDogs.map(d => ({...d})); }
}
function saveDogs() {
  // Base64 de fotos puede ser grande; intentamos guardar, si falla avisamos
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dogs));
  } catch(e) {
    console.warn('localStorage lleno. Las fotos muy pesadas no se guardarán entre sesiones.');
  }
}

let dogs = loadDogs();
let nextId = Math.max(...dogs.map(d=>d.id), 0) + 1;
let editingId = null;
let pendingMedia = []; // media en edición del modal

// ─────────────────────────────────────────
//  QUIZ STATE
// ─────────────────────────────────────────
let quizDog = null, quizStep = 0, quizAnswers = {};
const questions = [
  { id:'home_type', text:'¿Cómo es tu vivienda?', type:'single',
    options:['Piso pequeño sin terraza','Piso con terraza o balcón','Casa con patio pequeño','Casa con jardín grande'] },
  { id:'tenure', text:'¿Eres propietario/a o vives de alquiler?', type:'single',
    options:['Propietario/a','Alquiler con permiso de mascotas','Alquiler sin confirmar permiso','Alquiler sin permiso de mascotas'] },
  { id:'activity', text:'¿Cuánto tiempo puedes dedicar a paseos al día?', type:'single',
    options:['Menos de 30 minutos','30 min – 1 hora','1 – 2 horas','Más de 2 horas'] },
  { id:'work', text:'¿Cuántas horas al día estará el perro solo en casa?', type:'single',
    options:['Nunca o casi nunca','1–3 horas','3–6 horas','Más de 6 horas'] },
  { id:'household', text:'¿Con quién convives?', type:'multi',
    options:['Solo/a','Pareja sin hijos','Niños pequeños (< 6 años)','Niños mayores (6–12 años)','Adolescentes','Otros animales (gatos, etc.)'] },
  { id:'experience', text:'¿Tienes experiencia previa con perros?', type:'single',
    options:['Ninguna','Poca (visitas a casa de otros)','Moderada (tuve perros de pequeño)','Mucha (llevo años con perros)'] },
  { id:'vet', text:'¿Tienes o has tenido veterinario de cabecera?', type:'single',
    options:['Sí, tengo uno habitual','He tenido pero no actualmente','No, nunca he tenido','Estoy buscando uno'] },
  { id:'routine', text:'¿Cómo describirías tu ritmo de vida?', type:'single',
    options:['Muy activo/a (deporte, salidas diarias)','Moderado (mezcla de casa y salidas)','Tranquilo/a (mucho tiempo en casa)','Muy variable según temporada'] },
  { id:'travel', text:'¿Con qué frecuencia viajas o te ausentas varios días?', type:'single',
    options:['Casi nunca','Alguna vez al año','Frecuentemente (mensual)','Muy a menudo, necesitaría cuidador'] },
  { id:'budget', text:'¿Estás preparado/a para los gastos de tener un perro?', type:'single',
    options:['Presupuesto limitado','Puedo cubrir lo básico','Puedo cubrir todo bien','Sin problema, tengo margen'] },
];
const N = questions.length;

// ─────────────────────────────────────────
//  NAVBAR
// ─────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.boxShadow =
    window.scrollY > 10 ? '0 4px 24px rgba(0,0,0,.4)' : '0 2px 16px rgba(0,0,0,.3)';
});
function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }
function scrollToTop() { window.scrollTo({top:0,behavior:'smooth'}); }
function smoothTo(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({behavior:'smooth',block:'start'}); }

// ─────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────
const ADMIN_USER = 'paticas', ADMIN_PASS = 'tauste2025';
let isLoggedIn = false;

function openLoginModal() {
  ['login-user','login-pass'].forEach(id => document.getElementById(id).value='');
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('login-modal').style.display='flex';
  setTimeout(()=>document.getElementById('login-user').focus(),100);
}
function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  if (u===ADMIN_USER && p===ADMIN_PASS) {
    isLoggedIn=true; closeModal('login-modal'); showAdmin();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
    document.getElementById('login-pass').value='';
    document.getElementById('login-pass').focus();
  }
}
function togglePw() { const i=document.getElementById('login-pass'); i.type=i.type==='password'?'text':'password'; }
function showAdmin() {
  document.getElementById('main-page').classList.add('hidden');
  document.getElementById('main-footer').classList.add('hidden');
  document.getElementById('admin-page').classList.remove('hidden');
  renderAdminGrid(); window.scrollTo({top:0});
}
function hideAdmin() {
  isLoggedIn=false;
  document.getElementById('admin-page').classList.add('hidden');
  document.getElementById('main-page').classList.remove('hidden');
  document.getElementById('main-footer').classList.remove('hidden');
  updateStatCount(); renderDogGrid(); renderReels();
}

// ─────────────────────────────────────────
//  STAT
// ─────────────────────────────────────────
function updateStatCount() { document.getElementById('stat-dogs').textContent = dogs.length; }

// ─────────────────────────────────────────
//  REELS — sección pública
// ─────────────────────────────────────────
function renderReels() {
  const track = document.getElementById('reels-track');
  const empty = document.getElementById('reels-empty');

  // Recoge todos los media de todos los perros
  const items = [];
  dogs.forEach(d => {
    (d.media||[]).forEach((m,mi) => items.push({m, d, mi}));
  });

  if (items.length === 0) {
    // Sin media: mostrar tarjetas de "presentación" de cada perro sin foto
    const dogCards = dogs.map(d => `
      <div class="reel-card" onclick="openProfile(${d.id})">
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:5rem;background:var(--brown-mid);">${d.emoji}</div>
        <div class="reel-card-overlay"></div>
        <div class="reel-card-info">
          <div class="reel-dog-name">${d.name}</div>
          <div class="reel-dog-sub">${d.breed} · ${d.age}</div>
        </div>
        <button class="reel-card-btn" onclick="event.stopPropagation();openProfile(${d.id})">Ver perfil</button>
      </div>`).join('');
    track.innerHTML = dogCards;
    empty.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  track.innerHTML = items.map(({m, d}) => {
    if (m.type === 'image') {
      return `
        <div class="reel-card" onclick="openProfile(${d.id})">
          <img src="${m.src}" alt="${d.name}" loading="lazy" />
          <div class="reel-card-overlay"></div>
          <div class="reel-card-info">
            <div class="reel-dog-name">${d.name}</div>
            <div class="reel-dog-sub">${d.breed} · ${d.age}</div>
          </div>
          <button class="reel-card-btn" onclick="event.stopPropagation();openProfile(${d.id})">Ver perfil</button>
        </div>`;
    } else {
      const thumb = getVideoThumb(m.src);
      return `
        <div class="reel-card" onclick="openLightbox(${dogs.indexOf(d)}, ${(d.media||[]).indexOf(m)})">
          ${thumb ? `<img src="${thumb}" alt="${d.name}" loading="lazy" />` : `<div style="width:100%;height:100%;background:var(--brown-mid);display:flex;align-items:center;justify-content:center;font-size:4rem;">${d.emoji}</div>`}
          <div class="reel-card-overlay"></div>
          <div class="reel-play-btn">▶</div>
          <div class="reel-card-info">
            <div class="reel-dog-name">${d.name}</div>
            <div class="reel-dog-sub">${d.breed} · ${d.age}</div>
          </div>
          <button class="reel-card-btn" onclick="event.stopPropagation();openProfile(${d.id})">Ver perfil</button>
        </div>`;
    }
  }).join('');
}

// ─────────────────────────────────────────
//  GALERÍA DE PERROS
// ─────────────────────────────────────────
function renderDogGrid() {
  document.getElementById('dog-grid').innerHTML = dogs.map(d => {
    const cover = d.media && d.media.length > 0
      ? (d.media[0].type==='image'
          ? `<img class="dog-card-cover" src="${d.media[0].src}" alt="${d.name}" loading="lazy" />`
          : `<div class="dog-card-cover-emoji" style="position:relative;"><img src="${getVideoThumb(d.media[0].src)||''}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.remove()" /><span style="position:relative;font-size:3rem;">${d.emoji}</span></div>`)
      : `<div class="dog-card-cover-emoji">${d.emoji}</div>`;
    return `
      <div class="dog-card" onclick="openProfile(${d.id})">
        ${cover}
        <div class="dog-card-body">
          <div class="dog-name">${d.name}</div>
          <div class="dog-breed">${d.breed} · ${d.age}</div>
          <span class="tag tag-size">${d.size}</span>
          <span class="tag tag-energy">Energía ${d.energy}</span>
          <span class="start-hint">Ver perfil →</span>
        </div>
      </div>`;
  }).join('');
}

// ─────────────────────────────────────────
//  PERFIL INDIVIDUAL
// ─────────────────────────────────────────
function openProfile(dogId) {
  const d = dogs.find(x => x.id === dogId);
  if (!d) return;

  const firstImg = d.media && d.media.find(m => m.type==='image');
  const coverHTML = firstImg
    ? `<img class="profile-cover" src="${firstImg.src}" alt="${d.name}" />`
    : `<div class="profile-cover-emoji">${d.emoji}</div>`;

  const galleryHTML = d.media && d.media.length > 0
    ? `<div class="profile-gallery">
        ${d.media.map((m,i) => {
          if (m.type==='image') return `
            <div class="profile-gallery-item" onclick="openLightbox(${dogs.indexOf(d)},${i})">
              <img src="${m.src}" alt="${d.name}" loading="lazy" />
            </div>`;
          const thumb = getVideoThumb(m.src);
          return `
            <div class="profile-gallery-item" onclick="openLightbox(${dogs.indexOf(d)},${i})">
              ${thumb ? `<img src="${thumb}" alt="vídeo" loading="lazy" />` : `<div style="background:var(--brown-mid);width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;">🎬</div>`}
              <div class="pg-play">▶</div>
            </div>`;
        }).join('')}
      </div>`
    : '';

  document.getElementById('profile-content').innerHTML = `
    ${coverHTML}
    <div class="profile-body">
      <div class="profile-header">
        <div>
          <div class="profile-name">${d.name}</div>
          <div class="profile-breed">${d.breed} · ${d.age}</div>
        </div>
      </div>
      <div class="profile-tags">
        <span class="tag tag-size">${d.size}</span>
        <span class="tag tag-energy">Energía ${d.energy}</span>
        ${d.media && d.media.length > 0 ? `<span class="tag" style="background:#e8d5ff;color:#5c2d9e;">${d.media.length} foto${d.media.length>1?'s':''}</span>` : ''}
      </div>
      ${d.needs ? `<p class="profile-story">${d.needs}</p>` : ''}
      ${galleryHTML}
      <button class="profile-adopt-btn" onclick="closeProfile();openQuiz(${d.id})">
        Hacer test de compatibilidad con ${d.name} 🎯
      </button>
    </div>`;

  document.getElementById('profile-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProfile() {
  document.getElementById('profile-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function handleProfileOverlayClick(e) {
  if (e.target === document.getElementById('profile-overlay')) closeProfile();
}

// ─────────────────────────────────────────
//  LIGHTBOX
// ─────────────────────────────────────────
function openLightbox(dogIdx, mediaIdx) {
  const d = dogs[dogIdx];
  const m = d.media[mediaIdx];
  const lbc = document.getElementById('lightbox-content');
  if (m.type === 'image') {
    lbc.innerHTML = `<img src="${m.src}" alt="${d.name}" />
      <p style="color:rgba(255,255,255,.6);margin-top:10px;font-size:.85rem;">${d.emoji} ${d.name}</p>`;
  } else {
    const embed = getEmbedUrl(m.src);
    lbc.innerHTML = embed
      ? `<iframe src="${embed}" frameborder="0" allowfullscreen style="width:min(560px,88vw);height:315px;border-radius:12px;"></iframe>
         <p style="color:rgba(255,255,255,.6);margin-top:10px;font-size:.85rem;">${d.emoji} ${d.name}</p>`
      : `<video src="${m.src}" controls style="max-width:90vw;max-height:70vh;border-radius:12px;"></video>
         <p style="color:rgba(255,255,255,.6);margin-top:10px;font-size:.85rem;">${d.emoji} ${d.name}</p>`;
  }
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
  document.getElementById('lightbox-content').innerHTML = '';
}

// ─────────────────────────────────────────
//  HELPERS VIDEO
// ─────────────────────────────────────────
function getVideoThumb(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg`;
  return '';
}
function getEmbedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  const ig = url.match(/instagram\.com\/(?:p|reel)\/([^/]+)/);
  if (ig) return `https://www.instagram.com/p/${ig[1]}/embed/`;
  const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tt) return `https://www.tiktok.com/embed/${tt[1]}`;
  return null;
}

// ─────────────────────────────────────────
//  QUIZ
// ─────────────────────────────────────────
function openQuiz(dogId) {
  quizDog = dogs.find(d=>d.id===dogId);
  quizStep=0; quizAnswers={};
  document.getElementById('quiz-dog-info').innerHTML = `
    <div class="quiz-dog-emoji">${quizDog.emoji}</div>
    <div><div class="quiz-dog-name">${quizDog.name}</div>
    <div class="quiz-dog-sub">${quizDog.breed} · ${quizDog.age}</div></div>`;
  renderQuizStep();
  document.getElementById('quiz-overlay').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeQuiz() {
  document.getElementById('quiz-overlay').classList.remove('open');
  document.body.style.overflow='';
}
function handleOverlayClick(e) { if(e.target===document.getElementById('quiz-overlay')) closeQuiz(); }

function renderQuizStep() {
  const body=document.getElementById('quiz-body');
  const pw=document.getElementById('quiz-progress-wrap');
  if (quizStep<N) {
    const pct=Math.round((quizStep/N)*100);
    pw.innerHTML=`<div class="quiz-progress-track"><div class="quiz-progress-bar" style="width:${pct}%"></div></div>
      <span class="quiz-progress-label">Pregunta ${quizStep+1} de ${N}</span>`;
    const q=questions[quizStep], isM=q.type==='multi', cur=quizAnswers[q.id]||(isM?[]:null);
    body.innerHTML=`<div class="quiz-question">
      <p class="quiz-question-text">${q.text}</p>
      ${isM?'<p class="quiz-multi-hint">Puedes marcar varias opciones</p>':''}
      <div class="quiz-options">${q.options.map(opt=>{
        const sel=isM?cur.includes(opt):cur===opt;
        return `<div class="quiz-option ${sel?'selected':''}" onclick="selectOption('${q.id}','${q.type}','${opt.replace(/'/g,"\\'")}',this)">
          <span class="opt-dot ${isM?'square':''}"></span><span>${opt}</span></div>`;
      }).join('')}</div></div>`;
    const canNext=isM?cur.length>0:cur!==null;
    setQuizFooter(`
      ${quizStep>0?`<button class="btn-back" onclick="goBack()">← Anterior</button>`:'<span></span>'}
      <button class="btn-next" onclick="goNext()" ${canNext?'':'disabled'} id="quiz-next-btn">
        ${quizStep===N-1?'Ver compatibilidad 🎯':'Siguiente →'}</button>`);
  } else if (quizStep===N) {
    pw.innerHTML=''; body.innerHTML=buildResultsHTML(); setQuizFooter('');
    setTimeout(()=>document.querySelectorAll('.alt-card-bar-fill').forEach(b=>b.style.width=b.dataset.w),120);
  } else {
    pw.innerHTML=''; body.innerHTML=buildContactHTML(); setQuizFooter('');
  }
}
function setQuizFooter(html) {
  let f=document.querySelector('.quiz-footer');
  if(!f){f=document.createElement('div');f.className='quiz-footer';document.getElementById('quiz-modal').appendChild(f);}
  f.innerHTML=html;
}
function selectOption(qid,type,val,el){
  if(type==='single'){
    quizAnswers[qid]=val;
    el.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(o=>o.classList.remove('selected'));
    el.classList.add('selected');
    const nb=document.getElementById('quiz-next-btn');if(nb)nb.disabled=false;
    setTimeout(()=>goNext(),340);
  } else {
    if(!quizAnswers[qid])quizAnswers[qid]=[];
    const idx=quizAnswers[qid].indexOf(val);
    if(idx>-1){quizAnswers[qid].splice(idx,1);el.classList.remove('selected');}
    else{quizAnswers[qid].push(val);el.classList.add('selected');}
    const nb=document.getElementById('quiz-next-btn');if(nb)nb.disabled=quizAnswers[qid].length===0;
  }
}
function goNext(){
  const q=questions[quizStep],a=quizAnswers[q.id];
  if((!a&&q.type!=='multi')||(q.type==='multi'&&(!a||!a.length)))return;
  animateOut(()=>{quizStep++;renderQuizStep();});
}
function goBack(){animateOut(()=>{quizStep--;renderQuizStep();});}
function animateOut(cb){
  const el=document.querySelector('.quiz-question,.results-wrap,.contact-panel,.sent-panel');
  if(el){el.classList.add('out');setTimeout(cb,200);}else cb();
}

function scoreCompatibility(dog,a){
  let s=50;
  if(dog.energy==='Alta'){if(a.activity==='Más de 2 horas')s+=20;else if(a.activity==='1 – 2 horas')s+=10;else s-=15;if(a.home==='Casa con jardín grande')s+=10;else if(a.home==='Piso pequeño sin terraza')s-=10;}
  else if(dog.energy==='Baja'){if(a.activity==='Menos de 30 minutos'||a.activity==='30 min – 1 hora')s+=15;if(a.home==='Piso pequeño sin terraza'||a.home==='Piso con terraza o balcón')s+=10;}
  else{if(a.activity==='30 min – 1 hora'||a.activity==='1 – 2 horas')s+=15;}
  if(dog.size==='Grande'){if(a.home==='Casa con jardín grande'||a.home==='Casa con patio pequeño')s+=10;if(a.home==='Piso pequeño sin terraza')s-=15;}
  if(dog.size==='Pequeño'&&a.home==='Piso pequeño sin terraza')s+=10;
  if(a.experience==='Mucha (llevo años con perros)'||a.experience==='Moderada (tuve perros de pequeño)')s+=10;
  if(dog.needs&&dog.needs.toLowerCase().includes('no convive')&&a.household&&a.household.includes('Otros animales (gatos, etc.)'))s-=20;
  if(a.work==='Más de 6 horas')s-=10;if(a.work==='Nunca o casi nunca')s+=5;
  return Math.min(99,Math.max(8,s));
}
function scoreClass(s){return s>=70?'high':s>=50?'mid':'low';}
function compatMessage(dog,score){
  if(score>=80)return`¡${dog.name} y tú parecéis hechos el uno para el otro! 🎉`;
  if(score>=65)return`${dog.name} y tú tenéis bastante en común. Con pequeños ajustes, podríais ser una familia genial.`;
  if(score>=50)return`Hay compatibilidad, aunque algunos aspectos requieren cierta adaptación para ${dog.name}.`;
  return`Vuestra compatibilidad es baja. Quizás otro peludo encaje mejor contigo ahora mismo.`;
}

function buildResultsHTML(){
  const score=scoreCompatibility(quizDog,quizAnswers),cls=scoreClass(score);
  const others=dogs.filter(d=>d.id!==quizDog.id).map(d=>({dog:d,score:scoreCompatibility(d,quizAnswers)})).sort((a,b)=>b.score-a.score).slice(0,2);
  return `<div class="results-wrap">
    <div class="results-hero">
      <span class="results-dog-emoji">${quizDog.emoji}</span>
      <div class="results-title">Tú y ${quizDog.name}</div>
      <div class="results-sub">${quizDog.breed} · ${quizDog.age}</div>
    </div>
    <div class="compat-circle-wrap">
      <div class="compat-circle ${cls}"><span class="cc-pct">${score}%</span><span class="cc-label">compatibles</span></div>
    </div>
    <p class="compat-msg">${compatMessage(quizDog,score)}</p>
    ${others.length?`<p class="alt-section-title">Otras opciones compatibles contigo</p>
      <div class="alt-cards">${others.map(({dog,score:s})=>`
        <div class="alt-card"><span class="alt-card-emoji">${dog.emoji}</span>
          <div class="alt-card-info">
            <div class="alt-card-name">${dog.name}</div>
            <div class="alt-card-score">${s}% compatibilidad</div>
            <div class="alt-card-bar"><div class="alt-card-bar-fill ${scoreClass(s)}" style="width:0%" data-w="${s}%"></div></div>
          </div></div>`).join('')}</div>`:''}
    <button class="results-adopt-btn" onclick="goToContact()">Quiero adoptar a ${quizDog.name} 🐾</button>
    <button class="results-retry-btn" onclick="closeQuiz()">Volver a ver los perros</button>
  </div>`;
}

function buildContactHTML(){
  return `<div class="contact-panel">
    <h3>¡Ya casi está! 🐾</h3>
    <p style="font-size:.85rem;color:var(--text-light);margin-bottom:1.2rem;line-height:1.6;">
      Déjanos tus datos y nos pondremos en contacto para organizar una visita con <strong>${quizDog.name}</strong>.</p>
    <div class="contact-form-fields">
      <div class="field-row-2">
        <div><label class="field-label">Nombre completo *</label><input class="field-input" id="c-name" type="text" placeholder="María García"/></div>
        <div><label class="field-label">Teléfono *</label><input class="field-input" id="c-phone" type="tel" placeholder="600 000 000"/></div>
      </div>
      <div><label class="field-label">Email *</label><input class="field-input" id="c-email" type="email" placeholder="maria@email.com"/></div>
      <div><label class="field-label">Localidad</label><input class="field-input" id="c-city" type="text" placeholder="Tauste, Zaragoza..."/></div>
      <div><label class="field-label">¿Por qué quieres adoptar a ${quizDog.name}?</label>
        <textarea class="field-input" id="c-msg" rows="3" placeholder="Cuéntanos lo que quieras..."></textarea>
      </div>
      <p style="font-size:.75rem;color:var(--text-light);line-height:1.5;margin-top:4px;">* Campos obligatorios. Al enviar, recibirás un mensaje por WhatsApp de confirmación.</p>
    </div></div>`;
}
function goToContact(){
  animateOut(()=>{quizStep=N+1;renderQuizStep();
    setQuizFooter(`<button class="btn-back" onclick="animateOut(()=>{quizStep=N;renderQuizStep();})">← Volver</button>
      <button class="btn-next" onclick="sendRequest()">Enviar solicitud 📨</button>`);
  });
}
// ─────────────────────────────────────────
//  CONTACTO — WhatsApp + EmailJS
// ─────────────────────────────────────────
// Números de WhatsApp (sin + ni espacios)
const WA_NUMBERS = ['34626322707', '34656391816', '34637389242'];
// Email destino
const DEST_EMAIL = 'tonicardonamartinez@gmail.com';
// EmailJS — rellena con tus credenciales en https://www.emailjs.com (gratuito)
// const EMAILJS_SERVICE  = 'TU_SERVICE_ID';
// const EMAILJS_TEMPLATE = 'TU_TEMPLATE_ID';
// const EMAILJS_KEY      = 'TU_PUBLIC_KEY';

function buildWAMessage(name, phone, email, city, msg, score){
  const answers = questions.map(q => {
    const a = quizAnswers[q.id];
    if (!a) return '';
    const val = Array.isArray(a) ? a.join(', ') : a;
    return `• ${q.text.replace('¿','').replace('?','')}: ${val}`;
  }).filter(Boolean).join('%0A');

  return `🐾 *Nueva solicitud de adopción — Paticas Tauste*%0A%0A`
    + `*Perro:* ${quizDog.name} (${quizDog.breed})%0A`
    + `*Compatibilidad:* ${score}%25%0A%0A`
    + `*Datos del solicitante*%0A`
    + `Nombre: ${name}%0A`
    + `Teléfono: ${phone}%0A`
    + `Email: ${email}%0A`
    + `Localidad: ${city||'No indicada'}%0A%0A`
    + `*Respuestas del test*%0A${answers}%0A%0A`
    + `*Mensaje:* ${msg||'Sin mensaje adicional'}`;
}

function sendRequest(){
  const name  = document.getElementById('c-name')?.value.trim();
  const phone = document.getElementById('c-phone')?.value.trim();
  const email = document.getElementById('c-email')?.value.trim();
  const city  = document.getElementById('c-city')?.value.trim();
  const msg   = document.getElementById('c-msg')?.value.trim();

  if(!name||!phone||!email){
    alert('Por favor, completa nombre, teléfono y email.');return;
  }

  const score = scoreCompatibility(quizDog, quizAnswers);
  const waMsg = buildWAMessage(name, phone, email, city, msg, score);

  // Abrir WhatsApp para los 3 números
  WA_NUMBERS.forEach((num, i) => {
    setTimeout(() => {
      window.open(`https://wa.me/${num}?text=${waMsg}`, '_blank');
    }, i * 800); // pequeño delay entre ventanas para no bloquear el navegador
  });

  /* EmailJS — descomenta cuando tengas las credenciales:
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_KEY);
    emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      to_email:    DEST_EMAIL,
      dog_name:    quizDog.name,
      dog_breed:   quizDog.breed,
      score:       score,
      name, phone, email, city,
      message:     msg,
      answers:     questions.map(q=>{ const a=quizAnswers[q.id]; return a ? q.text+': '+(Array.isArray(a)?a.join(', '):a) : ''; }).filter(Boolean).join('\n'),
    }).catch(err => console.warn('EmailJS error:', err));
  }
  */

  animateOut(()=>{
    document.getElementById('quiz-body').innerHTML=`
      <div class="sent-panel">
        <div class="sent-check">🐾</div>
        <h3>¡Solicitud enviada!</h3>
        <p>Se ha abierto WhatsApp para notificar a la protectora.<br/>
        Si no se ha abierto, llama al <strong>626 322 707</strong>.<br/><br/>
        ¡Gracias por querer darle un hogar a <strong>${quizDog.name}</strong>!</p>
      </div>`;
    setQuizFooter(`<span></span><button class="btn-next" onclick="closeQuiz()">Cerrar</button>`);
  });
}

// ─────────────────────────────────────────
//  ADMIN PANEL
// ─────────────────────────────────────────
function renderAdminGrid(){
  document.getElementById('admin-dog-count').textContent=dogs.length+' perros';
  document.getElementById('admin-dog-grid').innerHTML=dogs.map(d=>{
    const cover=d.media&&d.media.length>0
      ?(d.media[0].type==='image'?`<img class="dog-card-cover" src="${d.media[0].src}" alt="${d.name}"/>`
        :`<div class="dog-card-cover-emoji">${d.emoji}</div>`)
      :`<div class="dog-card-cover-emoji">${d.emoji}</div>`;
    return `<div class="dog-card">
      ${cover}
      <div class="dog-card-body">
        <div class="dog-name">${d.name}</div>
        <div class="dog-breed">${d.breed} · ${d.age}</div>
        <span class="tag tag-size">${d.size}</span>
        <span class="tag tag-energy">Energía ${d.energy}</span>
        ${d.media&&d.media.length?`<span class="tag" style="background:#e8d5ff;color:#5c2d9e;">${d.media.length} foto${d.media.length>1?'s':''}</span>`:''}
        <div class="dog-admin-actions">
          <button class="btn-sm" onclick="editDog(${d.id})">Editar</button>
          <button class="btn-sm danger" onclick="deleteDog(${d.id})">Eliminar</button>
        </div>
      </div></div>`;
  }).join('');
}

// ─────────────────────────────────────────
//  MODAL AÑADIR / EDITAR
// ─────────────────────────────────────────
function openAddModal(){
  editingId=null; pendingMedia=[];
  document.getElementById('modal-title').textContent='Añadir nuevo perro';
  ['f-name','f-breed','f-age','f-needs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-size').value='Mediano';
  document.getElementById('f-energy').value='Media';
  document.getElementById('f-emoji').value='🐕';
  renderMediaPreview();
  document.getElementById('add-modal').style.display='flex';
}
function closeModal(id){document.getElementById(id).style.display='none';}

function editDog(id){
  editingId=id;const d=dogs.find(x=>x.id===id);
  document.getElementById('modal-title').textContent='Editar a '+d.name;
  document.getElementById('f-name').value=d.name;
  document.getElementById('f-breed').value=d.breed;
  document.getElementById('f-age').value=d.age;
  document.getElementById('f-needs').value=d.needs||'';
  document.getElementById('f-size').value=d.size;
  document.getElementById('f-energy').value=d.energy;
  document.getElementById('f-emoji').value=d.emoji;
  pendingMedia=[...(d.media||[])];
  renderMediaPreview();
  document.getElementById('add-modal').style.display='flex';
}

function saveDog(){
  const name=document.getElementById('f-name').value.trim();
  if(!name){alert('El nombre es obligatorio.');return;}
  const dog={
    id:editingId||nextId++, name,
    breed:document.getElementById('f-breed').value||'Mestizo',
    age:document.getElementById('f-age').value||'Desconocida',
    size:document.getElementById('f-size').value,
    energy:document.getElementById('f-energy').value,
    emoji:document.getElementById('f-emoji').value,
    needs:document.getElementById('f-needs').value,
    media:[...pendingMedia],
  };
  if(editingId) dogs[dogs.findIndex(d=>d.id===editingId)]=dog;
  else dogs.push(dog);
  saveDogs();
  closeModal('add-modal');
  renderAdminGrid(); renderDogGrid(); renderReels(); updateStatCount();
}

function deleteDog(id){
  const d=dogs.find(x=>x.id===id);
  if(!confirm(`¿Eliminar a ${d.name}? Esta acción no se puede deshacer.`))return;
  dogs=dogs.filter(x=>x.id!==id);
  saveDogs();
  renderAdminGrid(); renderDogGrid(); renderReels(); updateStatCount();
}

function simulateImport(){
  dogs.push(
    {id:nextId++,name:'Bruno',breed:'Pastor Alemán',age:'4 años',size:'Grande',energy:'Alta',emoji:'🐕',needs:'Necesita espacio y ejercicio diario. Solo para personas con experiencia.',media:[]},
    {id:nextId++,name:'Mia',breed:'Yorkshire',age:'2 años',size:'Pequeño',energy:'Media',emoji:'🐩',needs:'Muy cariñosa. Ideal para pisos.',media:[]}
  );
  saveDogs();
  renderAdminGrid(); renderDogGrid(); renderReels(); updateStatCount();
  alert('✓ Se han importado 2 perros de ejemplo.');
}

// ─────────────────────────────────────────
//  MEDIA — subida de archivos y URLs
// ─────────────────────────────────────────
function handleFileUpload(event){
  const files=Array.from(event.target.files);
  let loaded=0;
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{
      pendingMedia.push({type:file.type.startsWith('video')?'video':'image',src:e.target.result});
      loaded++;
      if(loaded===files.length) renderMediaPreview();
    };
    reader.readAsDataURL(file);
  });
  event.target.value='';
}

function addMediaUrl(){
  const url=document.getElementById('f-media-url').value.trim();
  if(!url)return;
  const isImg=/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
  pendingMedia.push({type:isImg?'image':'video',src:url});
  document.getElementById('f-media-url').value='';
  renderMediaPreview();
}

function removeMedia(idx){
  pendingMedia.splice(idx,1);
  renderMediaPreview();
}

function renderMediaPreview(){
  const grid=document.getElementById('media-preview-grid');
  if(!pendingMedia.length){grid.innerHTML='';return;}
  grid.innerHTML=pendingMedia.map((m,i)=>{
    if(m.type==='image'){
      return `<div class="media-preview-item">
        <img src="${m.src}" alt="foto ${i+1}" />
        <button class="media-remove" onclick="removeMedia(${i})">✕</button>
      </div>`;
    } else {
      const thumb=getVideoThumb(m.src);
      return `<div class="media-preview-item ${thumb?'':'media-url-thumb'}">
        ${thumb?`<img src="${thumb}" alt="vídeo"/>`:`<span>🎬</span><span class="url-label">${m.src.replace(/^https?:\/\//,'').substring(0,20)}</span>`}
        <span class="media-play-badge">▶ vídeo</span>
        <button class="media-remove" onclick="removeMedia(${i})">✕</button>
      </div>`;
    }
  }).join('');
}

// ─────────────────────────────────────────
//  KEYBOARD / URL ACCESS
// ─────────────────────────────────────────
document.querySelectorAll('.modal-bg').forEach(bg=>{
  bg.addEventListener('click',e=>{if(e.target===bg)bg.style.display='none';});
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeQuiz();closeProfile();closeLightbox();closeModal('login-modal');closeModal('add-modal');}
  if(e.altKey&&e.key.toLowerCase()==='p'){e.preventDefault();openLoginModal();}
});
if(window.location.search.includes('admin')||window.location.hash==='#admin'){
  window.history.replaceState({},'',window.location.pathname);
  setTimeout(openLoginModal,400);
}

// ─────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────
renderDogGrid();
renderReels();
updateStatCount();
