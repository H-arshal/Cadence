// Queue state, persistence, and the run loop. Glues engine + panel.
(async () => {
  const PQ = window.PQ;
  const KEY = 'pq_state';
  const defaults = {
    items: [],
    running: false,
    notice: '',
    settings: { newChat: false, download: false, delay: 3, retry: true }
  };
  let state = structuredClone(defaults);
  let loopActive = false;

  const uid = () => Math.random().toString(36).slice(2, 9);
  const save = () => chrome.storage.local.set({ [KEY]: state });
  const emit = () => { save(); PQ.panel.render(state, loopActive); };

  async function load() {
    const o = await chrome.storage.local.get(KEY);
    if (o[KEY]) {
      state = { ...defaults, ...o[KEY], settings: { ...defaults.settings, ...o[KEY].settings } };
    }
    // a page reload mid-generation leaves an item "running": retry it
    state.items.forEach((i) => { if (i.status === 'running') i.status = 'pending'; });
  }

  function download(item, images) {
    const n = String(state.items.indexOf(item) + 1).padStart(2, '0');
    images.forEach((url, k) => {
      chrome.runtime.sendMessage({
        type: 'download',
        url,
        filename: `Cadence/${n}${images.length > 1 ? '-' + (k + 1) : ''}.png`
      });
    });
  }

  async function loop() {
    if (loopActive) return;
    loopActive = true;
    try {
      while (state.running) {
        const item = state.items.find((i) => i.status === 'pending');
        if (!item) { state.running = false; state.notice = 'Queue finished.'; break; }

        item.status = 'running';
        item.error = null;
        emit();

        let res;
        try { res = await PQ.engine.runItem(item.text, state.settings); }
        catch (e) { res = { ok: false, error: e.message }; }

        if (res.ok) {
          item.status = 'done';
          if (state.settings.download) download(item, res.images);
        } else if (res.kind === 'limit') {
          item.status = 'pending';
          state.running = false;
          state.notice = 'Usage limit reached — queue paused. Press Start to resume later.';
        } else if (state.settings.retry && !item.retried && res.kind !== 'policy') {
          item.retried = true;
          item.status = 'pending';
          item.error = res.error;
        } else {
          item.status = 'failed';
          item.error = res.error;
        }
        emit();
        if (state.running) await PQ.engine.sleep(state.settings.delay * 1000);
      }
    } finally {
      loopActive = false;
      emit();
    }
  }

  const api = {
    add(lines) {
      lines.map((t) => t.trim()).filter(Boolean)
        .forEach((text) => state.items.push({ id: uid(), text, status: 'pending', error: null }));
      emit();
    },
    remove(id) { state.items = state.items.filter((i) => i.id !== id); emit(); },
    clear() { state.running = false; state.items = []; state.notice = ''; emit(); },
    setting(k, v) { state.settings[k] = v; emit(); },
    toggleRun() {
      if (state.running) { state.running = false; emit(); return; } // current prompt finishes first
      state.items.forEach((i) => { if (i.status === 'failed') { i.status = 'pending'; i.retried = false; } });
      state.running = true;
      state.notice = '';
      emit();
      loop();
    }
  };

  await load();
  PQ.panel.mount(api);
  PQ.panel.render(state, loopActive);
  if (state.running) setTimeout(loop, 2000); // resume after reload
})();
