import { createRouter } from './router.js';

const bus = new EventTarget();            // simple event bus
const state = Object.seal({               // global, extend as needed
  metadata: null,
  lastRoute: null,
  theme: (localStorage.getItem('theme') || 'light')
});

function setTheme(next) {
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('themeToggle').setAttribute('aria-pressed', String(next === 'dark'));
  state.theme = next;
}
function toggleTheme() { setTheme(state.theme === 'dark' ? 'light' : 'dark'); }

function wireNavActive(route) {
  document.querySelectorAll('.topnav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#/${route}`);
  });
}

async function bootstrap() {
  setTheme(state.theme);

  // Router
  const appEl = document.getElementById('app');
  const router = createRouter(appEl, { state, bus });

  // First navigation (defaults to dashboard)
  router.start();

  // UI events
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Keep nav active class synced
  window.addEventListener('hashchange', () => {
    const route = location.hash.replace(/^#\//, '') || 'dashboard';
    wireNavActive(route.split('?')[0]);
  });
  wireNavActive((location.hash.replace(/^#\//, '') || 'dashboard').split('?')[0]);

  // Example: load metadata once (optional)
  fetch('./data/metadata/manifest.json')
    .then(r => r.ok ? r.json() : null)
    .then(meta => { state.metadata = meta; bus.dispatchEvent(new CustomEvent('metadata:ready')); })
    .catch(() => {});
}

bootstrap();
