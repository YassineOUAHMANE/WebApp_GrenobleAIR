import { createRouter } from './router.js';
import { icons } from './utils/icons.js';

const state = Object.seal({               
  metadata: null,
  lastRoute: null,
  theme: (localStorage.getItem('theme') || 'dark')
});

function setTheme(next) {
//   console.log('Changing theme to:', next);
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;
  localStorage.setItem('theme', next);
  state.theme = next;
  updateThemeButton();
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
}

function initThemeToggle() {
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', (e) => {
    //   console.log('Theme button clicked!');
      toggleTheme();
    });
  }
}

function updateThemeButton(){
    document.getElementById('themeToggle').innerHTML = state.theme == 'dark' ? icons.sun : icons.moon;
}

function wireNavActive(route) {
  document.querySelectorAll('.topnav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#/${route}`);
  });
}

async function init() {
  setTheme(state.theme);
  updateThemeButton();

  // Initialize theme toggle button FIRST before everything else
  initThemeToggle();

  // Router
  const appEl = document.getElementById('app');
  const router = createRouter(appEl, { state });

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
    .then(meta => { state.metadata = meta; })
    .catch(() => {});
}

init();
