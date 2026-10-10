const fs = require('fs');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert');

// 1. Setup Mock DOM Context
const sandbox = {
  window: {},
  document: {
    createElement: () => ({ attachShadow: () => ({ innerHTML: '' }), id: '', dataset: {} }),
    body: { appendChild: () => {} },
    querySelectorAll: () => [],
    documentElement: {},
    execCommand: () => true
  },
  setTimeout: setTimeout,
  MutationObserver: class { observe() {} },
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  console: console
};
sandbox.window.document = sandbox.document;
sandbox.window.innerWidth = 1000;
vm.createContext(sandbox);

// 2. Load Extension Scripts into Context
const files = ['selectors.js', 'engine.js', 'panel.js'];
files.forEach(f => {
  const code = fs.readFileSync(`../content/${f}`, 'utf8');
  vm.runInContext(code, sandbox);
});

// We need to extract parsePrompts from panel.js for testing
const panelCode = fs.readFileSync('../content/panel.js', 'utf8');
const parsePromptsMatch = panelCode.match(/const parsePrompts = \(raw\) => \{[\s\S]*?return prompts;\n\s*\};/);
if (parsePromptsMatch) {
  vm.runInContext(parsePromptsMatch[0] + '\nwindow.parsePrompts = parsePrompts;', sandbox);
}

const PQ = sandbox.window.PQ;
const parsePrompts = sandbox.window.parsePrompts;

// --- TESTS ---

function deepEqual(actual, expected) {
  assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));
}

test('engine.js: classify', (t) => {
  const engineCode = fs.readFileSync('../content/engine.js', 'utf8');
  const classifyMatch = engineCode.match(/function classify\(text\) \{[\s\S]*?return null;\n\s*\}/);
  vm.runInContext(classifyMatch[0] + '\nwindow.classify = classify;', sandbox);
  const classify = sandbox.window.classify;

  deepEqual(classify("You've reached your image generation limit."), { kind: 'limit', error: 'Usage limit reached' });
  deepEqual(classify("I cannot generate this image as it violates our content policy."), { kind: 'policy', error: 'Prompt was refused by ChatGPT' });
  assert.strictEqual(classify("Here is your image of a cute dog."), null);
});

test('panel.js: parsePrompts', (t) => {
  deepEqual(parsePrompts(""), []);
  deepEqual(parsePrompts("   \n  \t"), []);

  deepEqual(parsePrompts("A red fox\nIsometric city"), ["A red fox", "Isometric city"]);

  deepEqual(parsePrompts("- A red fox\n* Isometric city\n1. Cyberpunk cat"), ["A red fox", "Isometric city", "Cyberpunk cat"]);

  deepEqual(parsePrompts("Here are your prompts:\n1. A dog\nLet me know if you need more!"), ["A dog"]);

  deepEqual(parsePrompts('["A red fox", "Isometric city"]'), ["A red fox", "Isometric city"]);
});
