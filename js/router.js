const routes = {
  'dashboard': () => import('./views/dashboardView.js'),
  'parking':   () => import('./views/parkingView.js'),
  'mobilite':  () => import('./views/mobiliteView.js').catch(() => import('./views/aboutView.js')),
  'zfe':       () => import('./views/zfeView.js').catch(() => import('./views/aboutView.js')),
  'irve':      () => import('./views/irveView.js').catch(() => import('./views/aboutView.js')),
  'qualite-air': () => import('./views/qualiteAirView.js').catch(() => import('./views/aboutView.js')),
  'lignes': () => import('./views/lignesTransportView.js'),
  'about':     () => import('./views/aboutView.js')
};

export function createRouter(mountEl, ctx) {
  let current = { unmount: null, name: null };

  function parseRoute() {
    const hash = location.hash.replace(/^#\//, '') || 'dashboard';
    const [name, qs] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs || ''));
    return { name, params };
  }

  async function navigate() {
    const { name, params } = parseRoute();
    if (name === current.name) return;

    // unmount previous
    if (typeof current.unmount === 'function') {
      try { current.unmount(); } catch {}
      current.unmount = null;
    }

    // load & mount new
    const loader = routes[name] || routes['dashboard'];
    try {
      const mod = await loader();
      const view = mod.default;
      mountEl.innerHTML = ''; // clear
      const section = document.createElement('section');
      section.className = 'grid';
      mountEl.appendChild(section);

      const maybeCleanup = await view.mount(section, { ...ctx, params });
      current = { unmount: maybeCleanup || view.unmount || null, name };
      ctx.state.lastRoute = name;
      document.title = (view.title || 'App') + ' — Observatoire';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      mountEl.innerHTML = `<div class="card">Erreur de navigation.</div>`;
      current = { unmount: null, name };
    }
  }

  return {
    start() {
      window.addEventListener('hashchange', navigate);
      if (!location.hash) location.hash = '#/dashboard';
      navigate();
    }
  };
}
