const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

const body = document.body;
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;

/* navigation + search */
const menuBtn = $('[data-menu-toggle]');
const mobileMenu = $('#mobile-menu');
const searchPanel = $('.search-panel');
const searchOpen = $('[data-search-open]');
const searchClose = $('[data-search-close]');
const searchInput = $('#site-search');
const newsCards = $$('.news-card');
const noResults = $('.no-results');

function setMenu(open) {
  menuBtn?.setAttribute('aria-expanded', String(open));
  mobileMenu?.classList.toggle('is-open', open);
  mobileMenu?.setAttribute('aria-hidden', String(!open));
  body.classList.toggle('menu-open', open);
}
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
$$('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

let lastFocus;
function setSearch(open) {
  searchPanel?.classList.toggle('is-open', open);
  searchPanel?.setAttribute('aria-hidden', String(!open));
  body.classList.toggle('search-open', open);
  if (open) {
    lastFocus = document.activeElement;
    setTimeout(() => searchInput?.focus(), 90);
  } else {
    lastFocus?.focus?.();
  }
}
searchOpen?.addEventListener('click', () => setSearch(true));
searchClose?.addEventListener('click', () => setSearch(false));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { setMenu(false); setSearch(false); }
  if (e.key === '/' && !/input|textarea/i.test(document.activeElement?.tagName || '')) {
    e.preventDefault();
    setSearch(true);
  }
});

/* reveal */
if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting) return;
      entry.target.style.transitionDelay = `${Math.min(index * 35, 140)}ms`;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .11, rootMargin: '0px 0px -45px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));
} else {
  $$('.reveal').forEach(el => el.classList.add('is-visible'));
}

/* scroll progress + kinetic backgrounds + ticker velocity */
let lastScroll = scrollY;
let tickerTimer;
const ticker = $('[data-ticker]');
function updateScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const value = max > 0 ? scrollY / max : 0;
  const bar = $('.progress span');
  if (bar) bar.style.transform = `scaleX(${value})`;
  root.style.setProperty('--scroll-y', scrollY.toFixed(1));

  if (!reducedMotion && ticker) {
    const velocity = Math.min(22, Math.abs(scrollY - lastScroll));
    ticker.style.animationDuration = `${Math.max(10, 28 - velocity * .55)}s`;
    clearTimeout(tickerTimer);
    tickerTimer = setTimeout(() => ticker.style.animationDuration = '28s', 160);
  }
  lastScroll = scrollY;
}
addEventListener('scroll', updateScroll, { passive:true });
updateScroll();

/* filtering */
let activeFilter = 'all';
function filterNews() {
  const term = (searchInput?.value || '').trim().toLowerCase();
  let visible = 0;
  newsCards.forEach(card => {
    const cats = (card.dataset.category || '').split(' ');
    const filterMatch = activeFilter === 'all' || cats.includes(activeFilter);
    const textMatch = !term || `${card.dataset.title || ''} ${card.textContent}`.toLowerCase().includes(term);
    const show = filterMatch && textMatch;
    card.classList.toggle('is-hidden', !show);
    if (show) visible++;
  });
  if (noResults) noResults.hidden = visible !== 0;
}
$$('.filter').forEach(btn => btn.addEventListener('click', () => {
  $$('.filter').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  activeFilter = btn.dataset.filter || 'all';
  filterNews();
}));
searchInput?.addEventListener('input', filterNews);

/* pointer-driven light + custom cursor */
let mouseX = innerWidth * .5;
let mouseY = innerHeight * .4;
let cursorX = mouseX;
let cursorY = mouseY;
let ringX = mouseX;
let ringY = mouseY;
const dot = $('.cursor-dot');
const ring = $('.cursor-ring');
let cursorReady = false;

function pointerMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  root.style.setProperty('--mx', `${mouseX}px`);
  root.style.setProperty('--my', `${mouseY}px`);
  if (finePointer && !reducedMotion && dot && ring) {
    if (!cursorReady) {
      cursorX = ringX = mouseX;
      cursorY = ringY = mouseY;
      dot.style.left = ring.style.left = `${mouseX}px`;
      dot.style.top = ring.style.top = `${mouseY}px`;
      root.classList.add('custom-cursor-ready');
      cursorReady = true;
    }
    body.classList.add('cursor-active');
  }
}
addEventListener('pointermove', pointerMove, { passive:true });
addEventListener('pointerdown', () => body.classList.add('cursor-down'), { passive:true });
addEventListener('pointerup', () => body.classList.remove('cursor-down'), { passive:true });

if (finePointer && !reducedMotion && dot && ring) {
  $$('a,button,input,.interactive-card').forEach(el => {
    el.addEventListener('pointerenter', () => body.classList.add('cursor-hover'));
    el.addEventListener('pointerleave', () => body.classList.remove('cursor-hover'));
  });

  const animateCursor = () => {
    cursorX += (mouseX - cursorX) * .45;
    cursorY += (mouseY - cursorY) * .45;
    ringX += (mouseX - ringX) * .14;
    ringY += (mouseY - ringY) * .14;
    dot.style.left = `${cursorX}px`;
    dot.style.top = `${cursorY}px`;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(animateCursor);
  };
  animateCursor();
}

/* spotlight, 3D tilt, image parallax */
if (finePointer && !reducedMotion) {
  $$('[data-spotlight]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 100;
      const py = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty('--px', `${px}%`);
      card.style.setProperty('--py', `${py}%`);
    });
  });

  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      const strength = card.classList.contains('hero-main') ? 2.4 : 5.8;
      card.style.transform = `perspective(1250px) rotateX(${-y * strength}deg) rotateY(${x * strength}deg) translateZ(0)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });

  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate3d(${x * .12}px,${y * .16}px,0)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });

  const hero = $('.hero-main');
  const heroImg = $('.hero-media img');
  hero?.addEventListener('pointermove', e => {
    if (!heroImg) return;
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    heroImg.style.transform = `scale(1.09) translate3d(${x * -18}px,${y * -14}px,0)`;
  });
  hero?.addEventListener('pointerleave', () => {
    if (heroImg) heroImg.style.transform = 'scale(1.05)';
  });

  $$('.news-media').forEach(media => {
    const img = $('img', media);
    media.addEventListener('pointermove', e => {
      if (!img) return;
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      img.style.transform = `scale(1.075) translate3d(${x * -9}px,${y * -7}px,0)`;
    });
    media.addEventListener('pointerleave', () => { if (img) img.style.transform = ''; });
  });
}

/* tiny press ripples */
document.addEventListener('pointerdown', e => {
  if (reducedMotion || !finePointer) return;
  const ripple = document.createElement('i');
  ripple.className = 'press-ripple';
  ripple.style.left = `${e.clientX}px`;
  ripple.style.top = `${e.clientY}px`;
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
});

/* animated ambient network canvas */
const canvas = $('#fx-canvas');
if (canvas && !reducedMotion) {
  const ctx = canvas.getContext('2d', { alpha:true });
  const particles = [];
  let cw = 0, ch = 0, dpr = 1;
  let raf;

  function resetCanvas() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    cw = innerWidth;
    ch = innerHeight;
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    particles.length = 0;
    const count = cw < 720 ? 22 : Math.min(54, Math.floor(cw / 28));
    for (let i = 0; i < count; i++) {
      particles.push({
        x:Math.random()*cw,
        y:Math.random()*ch,
        vx:(Math.random()-.5)*.16,
        vy:(Math.random()-.5)*.16,
        r:Math.random()*1.1+.35,
        phase:Math.random()*Math.PI*2
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0,0,cw,ch);
    for (let i=0;i<particles.length;i++) {
      const p=particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = cw+20;
      if (p.x > cw+20) p.x = -20;
      if (p.y < -20) p.y = ch+20;
      if (p.y > ch+20) p.y = -20;

      const dx = mouseX-p.x;
      const dy = mouseY-p.y;
      const md = Math.hypot(dx,dy);
      if (finePointer && md < 180 && md > 1) {
        p.x -= dx/md * .08;
        p.y -= dy/md * .08;
      }

      const pulse=.45 + Math.sin(time*.0009+p.phase)*.22;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(185,255,57,${Math.max(.08,pulse*.32)})`;
      ctx.fill();

      for (let j=i+1;j<particles.length;j++) {
        const q=particles[j];
        const d=Math.hypot(p.x-q.x,p.y-q.y);
        if (d<118) {
          ctx.beginPath();
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(q.x,q.y);
          ctx.strokeStyle=`rgba(185,255,57,${(1-d/118)*.055})`;
          ctx.lineWidth=.55;
          ctx.stroke();
        }
      }
    }

    if (finePointer) {
      ctx.beginPath();
      ctx.arc(mouseX,mouseY,72+Math.sin(time*.002)*8,0,Math.PI*2);
      ctx.strokeStyle='rgba(88,243,255,.055)';
      ctx.lineWidth=.8;
      ctx.stroke();
    }
    raf=requestAnimationFrame(draw);
  }
  resetCanvas();
  addEventListener('resize', resetCanvas, { passive:true });
  raf=requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf=requestAnimationFrame(draw);
  });
}
