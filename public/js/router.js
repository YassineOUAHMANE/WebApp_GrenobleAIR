import { icons } from './utils/icons.js'; 

const routes = {
  'map': () => import('./views/mapView.js'),
  'dashboard': () => import('./views/dashboardView.js'),
  'parking':   () => import('./views/parkingView.js'),
  'mobilite':  () => import('./views/mobiliteView.js'),
  'qualite-air': () => import('./views/qualiteAirView.js'),
  'quartier' : () => import('./views/quartiers.js'),
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

    //Make the current link active
    document.querySelectorAll('.topnav > a').forEach(i => i.classList.remove('active'));
    document.querySelector(`.topnav > a[href="#/${name}"`).classList.add('active');

    // unmount previous view
    if (typeof current.unmount === 'function') {
      try { current.unmount(); } catch {}
      current.unmount = null;
    }

    // load & mount new view
    const loader = routes[name] || routes['dashboard'];
    try {
      const mod = await loader();
      const view = mod.default;
      mountEl.innerHTML = ''; // clear
      const section = document.createElement('section');
      section.style.height = '100%';
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
    async start() {
      window.addEventListener('hashchange', navigate);
      if (!location.hash) location.hash = '#/dashboard';

      //Add links in navigation section
      for(const [route, loader] of Object.entries(routes)){
        try {
            const load = (await loader()).default;
            const el = document.createElement('a')
            el.setAttribute('href', `#/${route}`);
            el.innerHTML = (icons[load.icon] || icons.info) + `\n<p>${(load.linkTitle || load.title)}</p>`;
            document.querySelector('.topnav').append(el)
        }catch(e){
            console.error(e)
        }
      }
      navigate();
    }
  };
}
