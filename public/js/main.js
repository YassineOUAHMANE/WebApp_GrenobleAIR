import { createRouter } from './router.js';

const bus = new EventTarget();            // simple event bus
const state = Object.seal({               // global, extend as needed
  metadata: null,
  lastRoute: null,
  theme: (localStorage.getItem('theme') || 'dark')
});

function setTheme(next) {
  console.log('Changing theme to:', next);
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;
  localStorage.setItem('theme', next);
  state.theme = next;
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
}

// Exposer globalement pour onclick HTML
window.toggleTheme = toggleTheme;

function initThemeToggle() {
  // Attendre que le DOM soit complètement prêt
  const themeBtn = document.getElementById('themeToggle');
  console.log('Looking for themeToggle button:', themeBtn);
  
  if (themeBtn) {
    themeBtn.addEventListener('click', (e) => {
      console.log('Theme button clicked!');
      toggleTheme();
    });
    console.log('Theme button initialized');
  } else {
    console.log('Theme button NOT found!');
  }
}

function wireNavActive(route) {
  document.querySelectorAll('.topnav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#/${route}`);
  });
}

async function bootstrap() {
  setTheme(state.theme);

  // Initialize theme toggle button FIRST before everything else
  initThemeToggle();

  // Router
  const appEl = document.getElementById('app');
  const router = createRouter(appEl, { state, bus });

  // First navigation (defaults to dashboard)
  router.start();

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
