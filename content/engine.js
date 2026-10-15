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
    
    if (el.tagName === 'TEXTAREA') {
      el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (!el.value.trim()) throw new Error('Could not type the prompt in textarea');
      return;
    }

    // Set caret/selection inside the contenteditable element
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}

    document.execCommand('selectAll', false);
    document.execCommand('delete', false);
    const ok = document.execCommand('insertText', false, text);
    if (!ok || !el.textContent.trim()) {
      // Direct paragraph update if execCommand was prevented
      let p = el.querySelector('p');
      if (!p) {
        p = document.createElement('p');
        el.appendChild(p);
      }
      p.textContent = text;

      // Fallback: simulate paste event
      try {
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        el.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })
        );
      } catch (e) {}
    }

    // Always dispatch input and change events so React and ProseMirror update their state
    try {
      el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
    } catch (e) {}
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));

    if (!el.textContent.trim()) throw new Error('Could not type the prompt');
  }

  async function send() {
    const btn = await waitFor(() => {
      const b = PQ.find(PQ.SEL.send);
      if (!b) return null;
      const disabled = b.disabled || b.getAttribute('aria-disabled') === 'true' || b.classList.contains('disabled');
      return !disabled ? b : null;
    }, { timeout: 10000 });

    if (btn) {
      btn.click();
      const el = PQ.find(PQ.SEL.input);
      if (el) el.blur();
      return;
    }

    // Fallback: trigger Enter on the input element
    const el = PQ.find(PQ.SEL.input);
    if (el) {
      el.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
      el.blur();
    }
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
    
    // Check if generation started:
    // 1. Stop button appeared
    // 2. Turns increased (user message or assistant turn appeared)
    // 3. "Creating image" or "Generating" text appeared
    // 4. Any new image or placeholder appeared
    const started = await waitFor(
      () => {
        if (PQ.find(PQ.SEL.stop)) return true;
        if (turns().length > turnsBefore) return true;
        const bodyText = document.body ? document.body.innerText : '';
        if (/creating image|generating/i.test(bodyText)) return true;
        const newImgs = [...document.querySelectorAll('img')].filter((i) => !imagesBefore.has(i.src));
        if (newImgs.length > 0) return true;
        return false;
      },
      { timeout: startTimeout }
    );
    if (!started) return { ok: false, error: 'No response detected after sending' };

    let stableSince = 0;
    const minWaitTime = 6000; // An image generation takes at least 6s

    while (Date.now() - t0 < maxTotal) {
      const allTurns = turns();
      const last = allTurns.length ? allTurns[allTurns.length - 1] : null;
      const lastText = last ? last.innerText : '';
      const bodyText = document.body ? document.body.innerText : '';

      // Check for errors, limits, or policy refusals first
      const toast = PQ.find(PQ.SEL.toast);
      const fullText = (lastText + ' ' + (toast ? toast.innerText : '')).trim();
      const c = classify(fullText);
      if (c) return { ok: false, ...c };

      // Look for ANY new large image on the page
      const allNewImages = [...document.querySelectorAll('img')]
        .filter((i) => !imagesBefore.has(i.src));
        
      const completeImages = allNewImages
        .filter((i) => i.complete && i.naturalWidth >= 256)
        .map((i) => i.src);

      if (completeImages.length) return { ok: true, images: completeImages };

      // If new images exist but are still downloading, wait
      const isImageDownloading = allNewImages.some((i) => !i.complete || i.naturalWidth === 0);

      const busy = 
        !!PQ.find(PQ.SEL.stop) || 
        /creating image/i.test(lastText) || 
        /creating image/i.test(bodyText) ||
        isImageDownloading ||
        (Date.now() - t0 < minWaitTime);

      if (busy) {
        stableSince = 0;
      } else {
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince >= 4000) {
          // Re-check for images one final time
          const finalImages = [...document.querySelectorAll('img')]
            .filter((i) => !imagesBefore.has(i.src) && i.complete && i.naturalWidth >= 256)
            .map((i) => i.src);

          if (finalImages.length) return { ok: true, images: finalImages };

          return { ok: false, kind: 'noimage', error: 'Finished without an image' };
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
    
    // If ChatGPT is currently finishing a previous response or image, wait up to 15s for idle
    await waitFor(() => {
      const stop = PQ.find(PQ.SEL.stop);
      const input = PQ.find(PQ.SEL.input);
      return !stop && input ? input : null;
    }, { timeout: 15000 });

    setPrompt(text);
    await sleep(400);
    
    // Record ALL existing images on the page before sending
    const imagesBefore = new Set(
      [...document.querySelectorAll('img')].map((i) => i.src).filter(Boolean)
    );
    
    const before = turns().length;
    await send();
    return waitForCompletion(before, imagesBefore);
  }

  PQ.engine = { sleep, waitFor, runItem };
})();
