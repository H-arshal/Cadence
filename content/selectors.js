// ALL ChatGPT DOM knowledge lives here. When ChatGPT changes its UI,
// this is the only file that should need fixing. Put the most specific
// selector first; later ones are fallbacks.
(() => {
  const PQ = (window.PQ = window.PQ || {});

  PQ.SEL = {
    input: [
      'div[contenteditable="true"].ProseMirror',
      'div[aria-label="Ask ChatGPT"]',
      '#prompt-textarea',
      'form div[contenteditable="true"]'
    ],
    send: [
      'button[aria-label="Send"]',
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ],
    stop: [
      'button[data-testid="stop-button"]',
      'button[aria-label="Stop streaming"]',
      'button[aria-label*="Stop"]'
    ],
    turn: [
      'article[data-testid^="conversation-turn"]',
      'div[data-message-author-role="assistant"]',
      'div[data-message-author-role]',
      'div[data-message-id]',
      'div.w-full.text-token-text-primary'
    ],
    newChat: [
      'a[data-testid="create-new-chat-button"]',
      'a[aria-label="New chat"]',
      'a[href="/"]'
    ],
    toast: [
      'div[role="alert"]',
      '.toast',
      '.go3958317564' // Often used by react-hot-toast
    ]
  };

  PQ.find = (list, root = document) => {
    for (const s of list) {
      const el = root.querySelector(s);
      if (el) return el;
    }
    return null;
  };

  PQ.findAll = (list, root = document) => {
    for (const s of list) {
      const els = root.querySelectorAll(s);
      if (els.length) return [...els];
    }
    return [];
  };
})();
