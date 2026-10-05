// Automation engine: types a prompt, sends it, waits for the image.
// No UI and no queue state in here — just "run one prompt".
(() => {
  const PQ = (window.PQ = window.PQ || {});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(fn, { timeout = 30000, interval = 250 } = {}) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const v = fn();
      if (v) return v;
      await sleep(interval);
    }
    return null;
  }

  const turns = () => PQ.findAll(PQ.SEL.turn);

  function setPrompt(text) {
    const el = PQ.find(PQ.SEL.input);
    if (!el) throw new Error('ChatGPT input box not found');
    el.focus();
    document.execCommand('selectAll', false);
    document.execCommand('delete', false);
    const ok = document.execCommand('insertText', false, text);
    if (!ok || !el.textContent.trim()) {
      // Fallback: simulate a paste
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      el.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })
      );
    }
    if (!el.textContent.trim()) throw new Error('Could not type the prompt');
  }

  async function send() {
    const btn = await waitFor(() => {
      const b = PQ.find(PQ.SEL.send);
      return b && !b.disabled ? b : null;
    }, { timeout: 10000 });
    if (btn) { btn.click(); return; }
    const el = PQ.find(PQ.SEL.input);
    el.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
    }));
  }



  function classify(text) {
    if (/(reached|hit|exceeded).{0,50}limit|too many (requests|images)|(try again|come back) (in|later)/i.test(text))
      return { kind: 'limit', error: 'Usage limit reached' };
    if (/(can['’]t|cannot|unable to|not able to).{0,60}(generate|create)|content polic|violates/i.test(text))
      return { kind: 'policy', error: 'Prompt was refused by ChatGPT' };
    return null;
  }

  async function waitForCompletion(turnsBefore, imagesBefore, { startTimeout = 45000, maxTotal = 300000 } = {}) {
    const t0 = Date.now();
    const started = await waitFor(
      () => PQ.find(PQ.SEL.stop) || turns().length >= turnsBefore + 2,
      { timeout: startTimeout }
    );
    if (!started) return { ok: false, error: 'No response detected after sending' };

    let stableSince = 0;
    while (Date.now() - t0 < maxTotal) {
      const last = turns().pop();
      const text = last ? last.innerText : '';
      const busy = !!PQ.find(PQ.SEL.stop) || /creating image/i.test(text);

      if (busy) {
        stableSince = 0;
      } else {
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince >= 3000) {
          // DOM-agnostic image check: look for ANY new large image on the page
          const currentImages = [...document.querySelectorAll('img')]
            .filter((i) => i.complete && i.naturalWidth >= 256)
            .map((i) => i.src);
            
          const newImages = currentImages.filter(src => !imagesBefore.has(src));

          if (newImages.length) return { ok: true, images: newImages };

          const c = classify(text);
          return c
            ? { ok: false, ...c }
            : { ok: false, kind: 'noimage', error: 'Finished without an image' };
        }
      }
      await sleep(500);
    }
    return { ok: false, kind: 'timeout', error: 'Timed out waiting for the image' };
  }

  async function newChat() {
    const link = PQ.find(PQ.SEL.newChat);
    if (!link) throw new Error('New chat button not found');
    link.click();
    await sleep(800);
    const ready = await waitFor(() => PQ.find(PQ.SEL.input) && turns().length === 0, { timeout: 10000 });
    if (!ready) throw new Error('New chat did not open');
  }

  async function runItem(text, { newChat: nc = false } = {}) {
    if (nc) await newChat();
    setPrompt(text);
    await sleep(300);
    
    // Record all existing images on the page before we send
    const imagesBefore = new Set(
      [...document.querySelectorAll('img')]
        .filter((i) => i.naturalWidth >= 256)
        .map((i) => i.src)
    );
    
    const before = turns().length;
    await send();
    return waitForCompletion(before, imagesBefore);
  }

  PQ.engine = { sleep, waitFor, runItem };
})();
