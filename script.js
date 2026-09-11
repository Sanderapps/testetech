const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

const body = document.body;
const menuBtn = $('[data-menu-toggle]');
const mobileMenu = $('#mobile-menu');
const searchPanel = $('.search-panel');
const searchOpen = $('[data-search-open]');
const searchClose = $('[data-search-close]');
const searchInput = $('#site-search');
const newsCards = $$('.news-card');
const noResults = $('.no-results');

function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  mobileMenu.classList.toggle('is-open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
  body.classList.toggle('menu-open', open);
}
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
$$('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

let lastFocus;
function setSearch(open) {
  searchPanel.classList.toggle('is-open', open);
  searchPanel.setAttribute('aria-hidden', String(!open));
  body.classList.toggle('search-open', open);
  if (open) { lastFocus = document.activeElement; setTimeout(() => searchInput.focus(), 100); }
  else { lastFocus?.focus(); }
}
searchOpen.addEventListener('click', () => setSearch(true));
searchClose.addEventListener('click', () => setSearch(false));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { setMenu(false); setSearch(false); }
  if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); setSearch(true); }
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
  });
}, { threshold: .12, rootMargin: '0px 0px -40px' });
$$('.reveal').forEach(el => revealObserver.observe(el));

function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const value = max > 0 ? scrollY / max : 0;
  $('.progress span').style.transform = `scaleX(${value})`;
}
addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

let activeFilter = 'all';
function filterNews() {
  const term = searchInput.value.trim().toLowerCase();
  let visible = 0;
  newsCards.forEach(card => {
    const cats = card.dataset.category.split(' ');
    const filterMatch = activeFilter === 'all' || cats.includes(activeFilter);
    const textMatch = !term || `${card.dataset.title} ${card.textContent}`.toLowerCase().includes(term);
    const show = filterMatch && textMatch;
    card.classList.toggle('is-hidden', !show);
    if (show) visible++;
  });
  noResults.hidden = visible !== 0;
}
$$('.filter').forEach(btn => btn.addEventListener('click', () => {
  $$('.filter').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  activeFilter = btn.dataset.filter;
  filterNews();
}));
searchInput.addEventListener('input', filterNews);

const canHover = matchMedia('(hover:hover) and (pointer:fine)').matches;
if (canHover && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(1100px) rotateX(${-y * 4.5}deg) rotateY(${x * 5.5}deg) translateZ(0)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });

  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * .11}px, ${y * .16}px)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });
}

$('[data-newsletter]').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#email');
  $('.form-status').textContent = `Checkpoint salvo: ${email.value}. Nos vemos na próxima edição.`;
  e.currentTarget.reset();
});

$$('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
