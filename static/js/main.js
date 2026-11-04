// JEPA-x project page interactions.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onVisible = (el, threshold, cb) =>
    new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);

  // Overview video: chapter seeking.
  const overview = document.querySelector('#overview-video');
  document.querySelectorAll('[data-seek]').forEach(b => b.addEventListener('click', () => {
    if (!b.closest('.chapters')) overview.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    overview.currentTime = Number(b.dataset.seek);
    overview.play().catch(() => {});
  }));

  // Similar pixels, different physics: model's camera -> rotated view -> same lift action.
  const ab = document.querySelector('#ab');
  if (ab) {
    const fps = +ab.dataset.fps, nO = +ab.dataset.nOrbit, nL = +ab.dataset.nLift;
    const say = ['From the model’s camera, the two scenes look almost identical.',
      'Turn the view: in A, the block is held in the jaws. In B, it rests just behind them.',
      'Under the same lift action, one block comes along. The other stays put.'];
    const tags = ['model’s camera direction', 'rotated view', 'rotated view'];
    const btns = [...ab.querySelectorAll('[data-ab-step]')];
    const cols = [...ab.querySelectorAll('.ab-col')].map(col => ({
      v: col.querySelector('video'), tag: col.querySelector('.ab-tag'),
      h: col.querySelector('[data-height]'), line: col.querySelector('.trace polyline'),
      hs: col.dataset.h.split(',').map(Number),
    }));
    const ft = k => (k + 0.5) / fps;
    const lift = k => cols.forEach(c => {   // k = lift frame shown, -1 before the lift
      c.h.textContent = (k < 0 ? 0 : c.hs[k]).toFixed(1);
      c.line.setAttribute('points', c.hs.slice(0, k + 1)
        .map((y, i) => `${(2 + 116 * i / (nL - 1)).toFixed(1)},${(40 - 26 * y / 13.2).toFixed(1)}`).join(' '));
    });
    let raf = 0, timers = [], touched = false;
    const play = (from, to, onFrame) => {
      cancelAnimationFrame(raf);
      const end = () => { cols.forEach(c => { c.v.pause(); c.v.currentTime = ft(to); }); onFrame && onFrame(to); };
      cols.forEach(c => { c.v.pause(); c.v.currentTime = ft(from); });
      if (reduced) return end();
      Promise.all(cols.map(c => c.v.play())).catch(() => end());
      const tick = () => {
        const t = cols[0].v.currentTime;
        if (t >= ft(to) || cols[0].v.ended) return end();
        cols.slice(1).forEach(c => { if (Math.abs(c.v.currentTime - t) > 0.06) c.v.currentTime = t; });
        onFrame && onFrame(Math.max(from, Math.min(to, Math.floor(t * fps))));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const go = s => {
      ab.dataset.step = s;
      btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === s)));
      ab.querySelector('.ab-say').textContent = say[s];
      cols.forEach(c => c.tag.textContent = tags[s]);
      if (s === 0) { cancelAnimationFrame(raf); cols.forEach(c => { c.v.pause(); c.v.currentTime = ft(0); }); lift(-1); }
      else if (s === 1) { lift(-1); play(0, nO - 1); }
      else play(nO, nO + nL - 1, k => lift(k - nO));
    };
    btns.forEach((b, i) => b.addEventListener('click', () => {
      touched = true; timers.forEach(clearTimeout); go(i);
    }));
    // Walk through the three steps once, the first time the figure is on screen.
    let seen = false;
    onVisible(ab, 0.6, v => {
      if (!v || seen || touched || reduced) return;
      seen = true;
      timers = [setTimeout(() => go(1), 2600), setTimeout(() => go(2), 2600 + 4800)];
    });
  }

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

  // One player, several clips: control demos (six tasks) and the same-scenario comparison.
  const switcher = (video, attr, onPick) => {
    const btns = [...document.querySelectorAll(`[${attr}]`)];
    if (!video) return;
    let userPaused = reduced, visible = false, switching = false;
    video.addEventListener('play', () => { userPaused = false; switching = false; });
    video.addEventListener('pause', () => { if (visible && !document.hidden && !switching) userPaused = true; });
    btns.forEach(btn => btn.addEventListener('click', () => {
      switching = true; userPaused = false;
      btns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      onPick(btn);
      video.play().catch(() => { switching = false; });
    }));
    onVisible(video, 0.3, v => { visible = v; visible && !userPaused && !document.hidden ? video.play().catch(() => {}) : video.pause(); });
  };
  const demo = document.querySelector('#demo-video');
  switcher(demo, 'data-demo', btn => {
    const k = btn.dataset.demo;
    demo.poster = `static/img/demo-${k}.jpg`;
    demo.src = `static/video/demo-${k}.mp4`;
    demo.setAttribute('aria-label', `${btn.textContent} demonstration`);
  });
  const pair = document.querySelector('#pair-video');
  switcher(pair, 'data-pair', btn => {
    const k = btn.dataset.pair;
    pair.poster = `static/img/pair-${k}.jpg`;
    pair.src = `static/video/pair-${k}.mp4`;
    pair.setAttribute('aria-label', `${btn.textContent}: visual-only baseline (left) and JEPA-x (right) from the same start`);
    document.querySelector('#pair-note').textContent = btn.dataset.note;
  });

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
