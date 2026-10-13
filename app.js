(() => {
  const P = window.PHOTOS || [];
  const by = Object.fromEntries(P.map(p => [p.f, p]));
  const src = (f, size = 'l') => `img/${size}/${f}.jpg`;
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero: prefer any AI twilight/exterior variant if delivered, else the camera exterior.
  const aiHero = P.find(p => p.ai && /Exterior|Twilight|Front/i.test(p.f));
  const heroList = [aiHero ? aiHero.f : '01_Exterior_Front', '05_Living_Area_A', '10_Kitchen_Wide'].filter(f => by[f]);
  const slides = $('#heroSlides'), thumbs = $('#heroThumbs');
  heroList.forEach((f, i) => {
    const im = new Image(); im.src = src(f); im.alt = by[f].label; im.decoding = 'async';
    if (i === 0) { im.className = 'is-on'; im.fetchPriority = 'high'; }
    slides.appendChild(im);
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Show ' + by[f].label);
    b.innerHTML = `<img src="${src(f, 'm')}" alt="">`;
    if (i === 0) b.className = 'is-on';
    b.onclick = () => { show(i); restart(); };
    thumbs.appendChild(b);
  });
  let cur = 0, timer;
  function show(i) {
    cur = i;
    [...slides.children].forEach((e, k) => e.classList.toggle('is-on', k === i));
    [...thumbs.children].forEach((e, k) => e.classList.toggle('is-on', k === i));
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => show((cur + 1) % heroList.length), 6000); }
  restart();

  // data-photo binds images to the delivered set (so a photo swap is one rebuild)
  document.querySelectorAll('[data-photo]').forEach(el => {
    const f = el.dataset.photo; if (!by[f]) return;
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    if (img) img.src = src(f, el.classList.contains('frame') || el.closest('.cta') ? 'l' : 'm');
  });

  // Rooms marquee: one card per room, duplicated once for a seamless loop
  const roomPicks = ['04_Entry_Stairs', '08_Dining_Open_Concept', '11_Kitchen_U', '18_Bedroom_C_Ensuite_View', '19_Bathroom_C_Vanity', '21_Bedroom_A', '23_Bathroom_B', '25_Bedroom_B_Closet', '16_Upper_Hallway', '29_Patio_to_House', '26_Garage', '03_Front_Porch'].filter(f => by[f]);
  const names = { '04_Entry_Stairs': 'Entry', '08_Dining_Open_Concept': 'Dining', '11_Kitchen_U': 'Kitchen', '18_Bedroom_C_Ensuite_View': 'Bedroom C', '19_Bathroom_C_Vanity': 'Ensuite Bath', '21_Bedroom_A': 'Bedroom A', '23_Bathroom_B': 'Hall Bath', '25_Bedroom_B_Closet': 'Bedroom B', '16_Upper_Hallway': 'Upper Hall', '29_Patio_to_House': 'Patio', '26_Garage': 'Garage', '03_Front_Porch': 'Front Porch' };
  const track = $('#roomsTrack');
  [...roomPicks, ...roomPicks].forEach((f, i) => {
    const d = document.createElement('div'); d.className = 'room';
    if (i >= roomPicks.length) d.setAttribute('aria-hidden', 'true');
    d.innerHTML = `<img src="${src(f, 'm')}" alt="${names[f]}" loading="lazy"><p>${names[f]}</p>`;
    d.onclick = () => openLB(P.findIndex(p => p.f === f));
    track.appendChild(d);
  });

  // Notes slider
  const sl = [...document.querySelectorAll('#notes .slide')]; let si = 0;
  const go = d => { sl[si].classList.remove('is-on'); si = (si + d + sl.length) % sl.length; sl[si].classList.add('is-on'); };
  $('#prev').onclick = () => go(-1); $('#next').onclick = () => go(1);

  // Gallery: every delivered photo, first 9 shown, View all expands
  const cards = $('#cards');
  P.forEach((p, i) => {
    const c = document.createElement('button'); c.className = 'card' + (i >= 9 ? ' more' : '');
    const n = String(i + 1).padStart(2, '0');
    c.innerHTML = `<div class="ci"><img src="${src(p.f, 'm')}" alt="${p.label}" loading="lazy">${p.ai ? '<span class="badge">Virtually enhanced</span>' : ''}</div><p class="lab">${n}${p.ai ? ' · Virtually enhanced' : ''}</p><p class="tit">${p.label}</p>`;
    c.onclick = () => openLB(i);
    cards.appendChild(c);
  });
  if (P.some(p => p.ai)) $('#aiNote').hidden = false;
  const va = $('#viewAll');
  va.onclick = () => {
    const all = cards.classList.toggle('all');
    va.querySelector('.roll').textContent = all ? 'Show less' : 'View all';
    va.querySelector('.roll').dataset.t = all ? 'Show less' : 'View all';
    if (!all) $('#gallery').scrollIntoView();
  };
  document.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); openLB(P.findIndex(p => p.f === a.dataset.open));
  }));

  // Lightbox
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'); let li = 0;
  function openLB(i) { if (i < 0) return; li = i; render(); lb.hidden = false; document.body.style.overflow = 'hidden'; }
  function render() { const p = P[li]; lbImg.src = src(p.f); lbImg.alt = p.label; lbCap.textContent = `${String(li + 1).padStart(2, '0')} / ${P.length}  ${p.label}${p.ai ? '  (Virtually enhanced)' : ''}`; }
  const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
  $('#lbX').onclick = close;
  $('#lbP').onclick = () => { li = (li - 1 + P.length) % P.length; render(); };
  $('#lbN').onclick = () => { li = (li + 1) % P.length; render(); };
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') $('#lbN').click();
    if (e.key === 'ArrowLeft') $('#lbP').click();
  });

  // Footer form opens a pre-filled email to the agent (static site, no server)
  $('#notify').addEventListener('submit', e => {
    e.preventDefault();
    const em = e.target.email.value.trim();
    location.href = 'mailto:anatoliy.rubashka@cbrealty.com?subject=' + encodeURIComponent('Residence 6018: details request') + '&body=' + encodeURIComponent('Please send the full address, price and disclosures for Residence 6018 to ' + em + '.');
  });

  // Mobile menu
  const burger = $('#burger'), menu = $('#menu');
  burger.onclick = () => { const o = menu.hidden; menu.hidden = !o; burger.setAttribute('aria-expanded', String(o)); };
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); }));

  // Nav gets a soft scrim once the hero has passed (sentinel observer, no scroll listener)
  const nav = $('#nav'); const sent = document.createElement('div'); sent.style.cssText='position:absolute;top:0;left:0;width:1px;height:100svh;pointer-events:none';
  document.body.prepend(sent);
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting)).observe(sent);

  // Reveals (IntersectionObserver, no scroll listeners)
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  document.querySelectorAll('.frame, .about h2, .about .body, .about-img, .about-vid, .rooms h2, .notes h2, .g-head, .cta-copy').forEach(el => {
    if (!el.classList.contains('frame')) el.classList.add('rv');
    io.observe(el);
  });
})();
