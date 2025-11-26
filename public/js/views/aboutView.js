
export default {
  title: 'À propos',
  icon: 'info',
  async mount(root) {
    root.innerHTML = `
    <h2 class="title">À propos</h2>
    <p></p>
        
    <section class="grid">
      <div class="span-6 card">
        <h2>Occupation moyenne</h2>
        <div id="chart-occup" class="chart"></div>
      </div>
      <div class="span-6 card">
        <h2>Dernières mesures</h2>
        <div id="table-last"></div>
      </div>
    </section>
    `;
  }
};
