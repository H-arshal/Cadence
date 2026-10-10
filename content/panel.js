// The ChatGPT-styled side panel, rendered inside a Shadow DOM so
// ChatGPT's CSS can't leak in and ours can't leak out.
(() => {
  const PQ = (window.PQ = window.PQ || {});

  const CSS = `
  :host{all:initial;
    --bg:#f9f9f9;
    --surface:#ffffff;
    --surface2:#e5e5e5;
    --text:#0d0d0d;
    --muted:#676767;
    --border:rgba(0,0,0,0.1);
    --btn:#000000;
    --btnText:#ffffff;
    --green:#10a37f;
    --red:#ef4444;
    --amber:#f59e0b;
    --ring:rgba(0,0,0,0.15);
    font-family: Söhne, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif, "Helvetica Neue", Arial;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  :host([data-theme=dark]){
    --bg:#171717;
    --surface:#212121;
    --surface2:#2f2f2f;
    --text:#ececec;
    --muted:#b4b4b4;
    --border:rgba(255,255,255,0.1);
    --btn:#ffffff;
    --btnText:#000000;
    --ring:rgba(255,255,255,0.15);
  }
  *{box-sizing:border-box}
  
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(136, 136, 136, 0.3); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(136, 136, 136, 0.5); }
  
  #fab{position:fixed;bottom:80px;right:24px;z-index:2147483000;background:var(--surface);color:var(--text);
    border:1px solid var(--border);border-radius:999px;padding:12px 20px;font:500 14px inherit;cursor:pointer;
    box-shadow:0 4px 12px rgba(0,0,0,.08); transition:transform .2s ease, background .2s, box-shadow .2s;
    display:flex;align-items:center;gap:8px;}
  #fab:hover{transform:translateY(-1px); box-shadow:0 6px 16px rgba(0,0,0,.12); background:var(--surface)}
  #fab:active{transform:translateY(1px); box-shadow:0 2px 8px rgba(0,0,0,.08);}
  #fab svg{width:18px;height:18px}
  
  #panel{position:fixed;top:0;right:0;height:100vh;width:var(--panel-width, 320px);z-index:2147483001;background:var(--bg);
    border-left:1px solid var(--border);display:flex;flex-direction:column; overflow:hidden;
    transform:translateX(100%); transition:transform .3s cubic-bezier(0.4,0,0.2,1);
    box-shadow: -4px 0 24px rgba(0,0,0,0.05);}
  #panel.open{transform:none}
  
  .resizer{position:absolute;left:0;top:0;bottom:0;width:6px;cursor:col-resize;z-index:10;transition:background .2s}
  .resizer:hover, .resizer.active{background:var(--ring)}
  
  .ph{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);height:60px;}
  .ph b{font-size:16px;font-weight:600;letter-spacing:-0.01em;display:flex;align-items:center;gap:8px; color:var(--text)}
  .badge{font-size:12px;color:var(--muted);background:var(--surface2);padding:2px 8px;border-radius:12px;font-weight:500}
  .x{background:none;border:0;color:var(--muted);cursor:pointer;font-size:18px;padding:6px;border-radius:6px;transition:all .2s;display:flex;align-items:center;justify-content:center}
  .x:hover{background:var(--surface2);color:var(--text)}
  
  .pb{padding:16px;display:flex;flex-direction:column;gap:24px;overflow:auto;flex:1}
  .sec{font-size:12px;font-weight:500;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.04em}
  
  textarea{width:100%;min-height:100px;resize:vertical;background:var(--surface);color:var(--text);
    border:1px solid var(--border);border-radius:12px;padding:12px;font:inherit;outline:none;transition:border-color .2s, box-shadow .2s; line-height:1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.02)}
  textarea:focus{border-color:var(--text); box-shadow: 0 0 0 1px var(--text);}
  
  .row{display:flex;gap:8px;align-items:center;justify-content:space-between}
  
  button{font:inherit;cursor:pointer;border:0;border-radius:8px;padding:8px 14px;transition:all .2s;font-weight:500; display:flex; align-items:center; justify-content:center; gap:6px;}
  button:hover{opacity:0.85}
  button:active{transform:scale(0.98)}
  .pri{background:var(--btn);color:var(--btnText); box-shadow: 0 1px 2px rgba(0,0,0,0.05)}
  .ghost{background:var(--surface);color:var(--text);border:1px solid var(--border);}
  .ghost:hover{background:var(--surface2)}
  
  .bar{height:6px;background:var(--surface2);border-radius:999px;overflow:hidden;margin-top:8px}
  .bar i{display:block;height:100%;width:0;background:var(--text);transition:width .4s cubic-bezier(0.4,0,0.2,1)}
  
  .list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
  .item{display:flex;gap:12px;align-items:flex-start;background:var(--surface);border-radius:10px;padding:12px;border:1px solid var(--border);transition:all .2s; box-shadow: 0 1px 2px rgba(0,0,0,0.02)}
  .item:hover{border-color:var(--ring); transform:translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.04)}
  .item p{margin:0;flex:1;min-width:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.4;font-size:14px; color:var(--text)}
  .n{color:var(--muted);width:16px;font-size:12px;font-weight:600;padding-top:2px}
  
  .st{font-size:11px;padding:2px 8px;border-radius:999px;white-space:nowrap;font-weight:500;letter-spacing:0.02em; display:flex; align-items:center;}
  .st.done{color:var(--green);background:rgba(16, 163, 127, 0.1)}
  .st.run{color:var(--text);background:var(--surface2)}
  .st.fail{color:var(--red);background:rgba(239, 68, 68, 0.1)}
  .st:not(.done):not(.run):not(.fail){color:var(--muted);background:transparent; border:1px solid var(--border)}
  
  .spin{display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;
    border-radius:50%;margin-right:6px;animation:s .8s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
  
  .set{background:transparent;display:flex;flex-direction:column;gap:2px}
  .opt{display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:14px; border-bottom:1px solid var(--border)}
  .opt:last-child{border-bottom:none}
  
  .tg{width:40px;height:22px;border-radius:999px;background:var(--surface2);position:relative;cursor:pointer;border:1px solid transparent;transition:all .2s cubic-bezier(0.4,0,0.2,1)}
  .tg::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.2s cubic-bezier(0.4,0,0.2,1);box-shadow:0 1px 2px rgba(0,0,0,0.1)}
  .tg.on{background:var(--green)}.tg.on::after{left:20px; box-shadow:none}
  
  .num{width:60px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:6px;font:inherit;text-align:center;transition:all .2s}
  .num:focus{border-color:var(--text);outline:none; box-shadow: 0 0 0 1px var(--text)}
  
  .notice{background:rgba(245, 158, 11, 0.1);border:1px solid rgba(245, 158, 11, 0.3);border-radius:10px;padding:12px;display:none;color:var(--text);font-size:14px; line-height:1.4}
  .notice.on{display:block}
  
  .foot{padding:16px;border-top:1px solid var(--border);display:flex;gap:12px;background:var(--bg)}
  .foot button{flex:1;padding:12px; font-weight:600;}`;

  const HTML = `
  <button id="fab">
    <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
      <path d="M77.5 30 H52 C34.2 30 21 43.5 21 64 C21 84.5 34.2 98 52 98 H77.5" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="46" y="57" width="52" height="14" rx="7" fill="#F86D1A" stroke="none" />
    </svg>
    Cadence
  </button>
  <aside id="panel">
    <div class="resizer" id="resizer"></div>
    <div class="ph"><b>Cadence</b><span style="display:flex;align-items:center;gap:4px"><span class="badge" id="count">0 / 0</span><button class="x" id="theme-btn" title="Toggle Theme"></button><button class="x" id="close">✕</button></span></div>
    <div class="pb">
      <div>
        <div class="sec">Paste prompts — one per line</div>
        <textarea id="ta" placeholder="A red fox in watercolor&#10;Isometric city at night"></textarea>
        <div class="row" style="margin-top:8px">
          <button class="ghost" id="imp">Import .txt</button><input type="file" id="file" accept=".txt,.csv" hidden>
          <button class="pri" id="add">Add to queue</button>
        </div>
      </div>
      <div class="notice" id="notice"></div>
      <div>
        <div class="row"><span class="sec" style="margin:0">Queue</span><span class="sec" style="margin:0" id="pct">0%</span></div>
        <div class="bar" style="margin-top:6px"><i id="fill"></i></div>
        <div class="list" id="list"></div>
      </div>
      <div>
        <div class="sec">Settings</div>
        <div class="set">
          <div class="opt"><span>New chat for each prompt</span><span class="tg" data-k="newChat"></span></div>
          <div class="opt"><span>Auto-download images</span><span class="tg" data-k="download"></span></div>
          <div class="opt"><span>Delay between prompts (s)</span><input class="num" id="delay" type="number" min="0"></div>
          <div class="opt"><span>Retry failed once</span><span class="tg" data-k="retry"></span></div>
        </div>
      </div>
    </div>
    <div class="foot"><button class="ghost" id="clr">Clear</button><button class="pri" id="go">Start</button></div>
  </aside>`;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const chip = (it) =>
    it.status === 'done' ? '<span class="st done">✓ Done</span>'
    : it.status === 'running' ? '<span class="st run"><span class="spin"></span>Generating</span>'
    : it.status === 'failed' ? `<span class="st fail" title="${esc(it.error || '')}">Failed</span>`
    : '<span class="st">Pending</span>';

  let host, root, api;
  let manualTheme = null;
  const $ = (s) => root.querySelector(s);

  const icons = {
    sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
  };

  function updateTheme() {
    if (!root) return;
    const isDark = manualTheme ? manualTheme === 'dark' : document.documentElement.classList.contains('dark');
    host.dataset.theme = isDark ? 'dark' : 'light';
    const btn = $('#theme-btn');
    if (btn) btn.innerHTML = isDark ? icons.sun : icons.moon;
  }

  function mount(a) {
    api = a;
    host = document.createElement('div');
    host.id = 'pq-host';
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>${HTML}`;
    
    document.documentElement.appendChild(host);

    // keep ChatGPT's global hotkeys from hijacking typing in our panel
    ['keydown', 'keypress', 'keyup'].forEach((t) => host.addEventListener(t, (e) => e.stopPropagation()));

    let currentWidth = 320;
    let isResizing = false;

    const togglePanel = (open) => {
      $('#panel').classList.toggle('open', open);
      $('#fab').style.display = open ? 'none' : '';
      
      let spacer = document.getElementById('cadence-spacer');
      
      if (open) {
        if (!spacer) {
          spacer = document.createElement('div');
          spacer.id = 'cadence-spacer';
          // Initialize at 0px width for a smooth entrance
          spacer.style.cssText = 'width: 0px; flex-shrink: 0; transition: width 0.3s cubic-bezier(0.4,0,0.2,1);';
          
          const main = document.querySelector('main');
          if (main) {
            let container = main;
            let targetRow = null;
            
            // Climb up to find the FIRST parent that is a flex row.
            while (container.parentElement) {
              container = container.parentElement;
              const style = window.getComputedStyle(container);
              if (style.display === 'flex' && style.flexDirection === 'row') {
                targetRow = container;
                break;
              }
            }
            
            const target = targetRow || container;
            if (target) {
              target.appendChild(spacer);
            }
          }
        }
        
        // Force a layout reflow so the browser registers the 0px starting state
        void spacer.offsetWidth;
        // Trigger the CSS transition to currentWidth
        spacer.style.width = `${currentWidth}px`;
        
      } else {
        if (spacer) {
          // Trigger the CSS transition back to 0px
          spacer.style.width = '0px';
          // Wait for the transition (0.3s) to finish before removing the element
          setTimeout(() => {
            if (!$('#panel').classList.contains('open') && spacer.parentNode) {
              spacer.remove();
            }
          }, 300);
        }
      }
    };

    $('#resizer').addEventListener('mousedown', (e) => {
      isResizing = true;
      $('#resizer').classList.add('active');
      const spacer = document.getElementById('cadence-spacer');
      if (spacer) spacer.style.transition = 'none';
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < 280) newWidth = 280;
      if (newWidth > 800) newWidth = 800;
      currentWidth = newWidth;
      
      $('#panel').style.setProperty('--panel-width', `${newWidth}px`);
      const spacer = document.getElementById('cadence-spacer');
      if (spacer) spacer.style.width = `${newWidth}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        $('#resizer').classList.remove('active');
        const spacer = document.getElementById('cadence-spacer');
        if (spacer) spacer.style.transition = 'width 0.3s cubic-bezier(0.4,0,0.2,1)';
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });

    $('#fab').onclick = () => togglePanel(true);
    $('#theme-btn').onclick = () => {
      manualTheme = (host.dataset.theme === 'dark') ? 'light' : 'dark';
      updateTheme();
    };
    $('#close').onclick = () => togglePanel(false);
    const parsePrompts = (raw) => {
      try { const j = JSON.parse(raw); if (Array.isArray(j)) return j.map(String); } catch(e){}
      
      let lines = raw.replace(/\r/g, '').split('\n');
      let prompts = [];
      let currentPrompt = [];
      
      const isMarker = (l) => /^\s*(?:\d+[\.\)]|\-|\*|•|Prompt \d+:?|Image \d+:?)/i.test(l);
      const cleanMarker = (l) => {
        let c = l.replace(/^\s*(?:\d+[\.\)]|\-|\*|•|Prompt \d+:?|Image \d+:?)\s*/i, '').trim();
        return c.replace(/^["'](.*)["']$/, '$1').trim();
      };
      const isFiller = (l) => {
        const lower = l.toLowerCase();
        return /^(here (are|is)|sure|certainly|below (are|is)|these are|enjoy|let me know|feel free|hope this helps)/.test(lower) || 
               /^[-=_]+$/.test(l) || 
               l.length < 3;
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) {
          if (currentPrompt.length > 0) {
            prompts.push(currentPrompt.join('\n'));
            currentPrompt = [];
          }
          continue;
        }
        
        if (isMarker(line)) {
          if (currentPrompt.length > 0) {
            prompts.push(currentPrompt.join('\n'));
          }
          let cleaned = cleanMarker(line);
          currentPrompt = cleaned ? [cleaned] : [];
        } else {
          if (isFiller(line)) {
            continue;
          }
          if (currentPrompt.length === 0) {
             line = cleanMarker(line);
          }
          currentPrompt.push(line);
        }
      }
      if (currentPrompt.length > 0) {
        prompts.push(currentPrompt.join('\n'));
      }
      
      prompts = prompts.filter(p => !isFiller(p) && p.length >= 5);
      
      if (prompts.length === 1 && prompts[0].includes('\n')) {
         const splitByLines = prompts[0].split('\n').map(l => l.trim()).filter(l => l.length >= 5);
         if (splitByLines.length > 1) return splitByLines;
      }
      
      return prompts;
    };

    $('#add').onclick = () => { 
      const p = parsePrompts($('#ta').value);
      if (p.length) api.add(p);
      $('#ta').value = ''; 
    };
    $('#imp').onclick = () => $('#file').click();
    $('#file').onchange = async (e) => {
      const target = e.target;
      const f = target.files[0];
      if (f) {
        const p = parsePrompts(await f.text());
        if (p.length) api.add(p);
      }
      target.value = '';
    };
    $('#go').onclick = () => api.toggleRun();
    $('#clr').onclick = () => api.clear();
    $('#delay').onchange = (e) => api.setting('delay', Math.max(0, Number(e.target.value) || 0));
    root.querySelectorAll('[data-k]').forEach((t) => {
      t.onclick = () => api.setting(t.dataset.k, !t.classList.contains('on'));
    });
    $('#list').onclick = (e) => {
      const b = e.target.closest('[data-rm]');
      if (b) api.remove(b.dataset.rm);
    };
  }

  function render(state, busy) {
    if (!root) return;
    updateTheme();
    const done = state.items.filter((i) => i.status === 'done').length;
    const pct = state.items.length ? Math.round((done / state.items.length) * 100) : 0;
    $('#count').textContent = `${done} / ${state.items.length}`;
    $('#pct').textContent = `${pct}%`;
    $('#fill').style.width = `${pct}%`;
    $('#list').innerHTML = state.items.map((it, i) =>
      `<div class="item"><span class="n">${i + 1}</span><p>${esc(it.text)}</p>${chip(it)}` +
      (it.status === 'running' ? '' : `<button class="x" data-rm="${it.id}" title="Remove">✕</button>`) + '</div>'
    ).join('');
    $('#go').textContent = state.running ? (busy ? 'Pause' : 'Pausing…') : 'Start';
    $('#delay').value = state.settings.delay;
    root.querySelectorAll('[data-k]').forEach((t) => t.classList.toggle('on', !!state.settings[t.dataset.k]));
    const n = $('#notice');
    n.textContent = state.notice || '';
    n.classList.toggle('on', !!state.notice);
  }

  PQ.panel = { mount, render };
})();
