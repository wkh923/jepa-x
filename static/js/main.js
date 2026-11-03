// JEPA-x project page interactions.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onVisible = (el, threshold, cb) =>
    new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

  // Overview video: chapter seeking.
  const overview = document.querySelector('#overview-video');
  document.querySelectorAll('[data-seek]').forEach(b => b.addEventListener('click', () => {
    overview.currentTime = Number(b.dataset.seek);
    overview.play().catch(() => {});
  }));

  // Two visual views + physical configuration: keep the three clips in sync.
  const views = [...document.querySelectorAll('.views video')];
  const viewsBtn = document.querySelector('#views-toggle');
  if (views.length) {
    const master = views[0];
    let userPaused = reduced, visible = false;
    const play = () => views.forEach(v => { if (v !== master) v.currentTime = master.currentTime; v.play().catch(() => {}); });
    const pause = () => views.forEach(v => v.pause());
    master.addEventListener('play', () => viewsBtn.textContent = 'Pause');
    master.addEventListener('pause', () => viewsBtn.textContent = 'Play');
    master.addEventListener('timeupdate', () => views.slice(1).forEach(v => {
      if (Math.abs(v.currentTime - master.currentTime) > 0.1) v.currentTime = master.currentTime;
    }));
    viewsBtn.addEventListener('click', () => { userPaused = !master.paused; userPaused ? pause() : play(); });
    onVisible(views[0].closest('.views'), 0.2, v => { visible = v; visible && !userPaused ? play() : pause(); });
  }

  // Drift chart: highlight one baseline against JEPA-x.
  const driftBtns = [...document.querySelectorAll('[data-drift-method]')];
  const traces = [...document.querySelectorAll('[data-drift-series]')];
  const rows = [...document.querySelectorAll('[data-drift-row]')];
  driftBtns.forEach(btn => btn.addEventListener('click', () => {
    const sel = btn.dataset.driftMethod;
    driftBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    traces.forEach(t => {
      const on = t.dataset.driftSeries === 'fw' || t.dataset.driftSeries === sel;
      t.setAttribute('opacity', String(on ? 1 : t.dataset.driftKind === 'band' ? 0.25 : 0.45));
    });
    rows.forEach(r => r.classList.toggle('sel', r.dataset.driftRow === sel && sel !== 'fw'));
    document.querySelector('#drift-status').textContent =
      sel === 'fw' ? 'JEPA-x highlighted.' : `${btn.textContent.trim()} and JEPA-x highlighted.`;
  }));

  // Control demos: one player, six tasks.
  const demo = document.querySelector('#demo-video');
  const demoBtns = [...document.querySelectorAll('[data-demo]')];
  if (demo) {
    let userPaused = reduced, visible = false, switching = false;
    demo.addEventListener('play', () => { userPaused = false; switching = false; });
    demo.addEventListener('pause', () => { if (visible && !document.hidden && !switching) userPaused = true; });
    demoBtns.forEach(btn => btn.addEventListener('click', () => {
      const k = btn.dataset.demo;
      switching = true; userPaused = false;
      demoBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      demo.poster = `static/img/demo-${k}.jpg`;
      demo.src = `static/video/demo-${k}.mp4`;
      demo.setAttribute('aria-label', `${btn.textContent} demonstration`);
      demo.play().catch(() => { switching = false; });
    }));
    onVisible(demo, 0.3, v => { visible = v; visible && !userPaused && !document.hidden ? demo.play().catch(() => {}) : demo.pause(); });
  }

  // BibTeX copy.
  const copy = document.querySelector('#copy-bib');
  copy && copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.querySelector('#bibtex').textContent.trim());
      copy.textContent = 'Copied';
    } catch { copy.textContent = 'Select & copy'; }
    setTimeout(() => copy.textContent = 'Copy', 1600);
  });
})();
