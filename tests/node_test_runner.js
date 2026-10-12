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

const PQ = sandbox.window.PQ;
const parsePrompts = PQ.panel.parsePrompts;
const splitImagePrompts = PQ.panel.splitImagePrompts;

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

test('panel.js: parsePrompts (legacy & fallback formats)', (t) => {
  deepEqual(parsePrompts(""), []);
  deepEqual(parsePrompts("   \n  \t"), []);

  deepEqual(parsePrompts("A red fox\nIsometric city"), ["A red fox", "Isometric city"]);

  deepEqual(parsePrompts("- A red fox\n* Isometric city\n1. Cyberpunk cat"), ["A red fox", "Isometric city", "Cyberpunk cat"]);

  deepEqual(parsePrompts("Here are your prompts:\n1. A dog\nLet me know if you need more!"), ["A dog"]);

  deepEqual(parsePrompts('["A red fox", "Isometric city"]'), ["A red fox", "Isometric city"]);
});

test('panel.js: parsePrompts & splitImagePrompts (editorial heading format)', (t) => {
  const sampleEditorial = `## Image 3 — What a suspicious configuration looks like

This is the practical visual for Section 4.

**Prompt: Editorial code illustration — Configuration Is an Execution Surface**

Create a minimalist technical illustration.

**Primary subject:** A clean code editor.

**Technical accuracy:** Use this JSON example:

\`\`\`json
{
  "label": "Initialize workspace",
  "type": "shell"
}
\`\`\`

**Format:** 4:3 landscape, 1600 × 1200 pixels.

Avoid rounded UI cards and excessive text.`;

  // Must produce exactly ONE prompt unit, preserving JSON, format, and instructions
  const result = parsePrompts(sampleEditorial);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0], sampleEditorial.trim());
  assert.ok(result[0].includes('"label": "Initialize workspace"'));
  assert.ok(result[0].includes('**Format:** 4:3 landscape'));

  // Test splitImagePrompts structure
  const structured = splitImagePrompts(sampleEditorial);
  assert.strictEqual(structured.length, 1);
  assert.strictEqual(structured[0].imageNumber, 3);
  assert.strictEqual(structured[0].title, "What a suspicious configuration looks like");
  assert.strictEqual(structured[0].content, sampleEditorial.trim());
});

test('panel.js: multi-image editorial article prompt package', (t) => {
  const multiImagePackage = `# Visual Plan: The Supply-Chain Attack Didn't Stop at npm
Overview of visual direction for Medium article.

---

## Image 1 — The cover image
Priority 1
Place this immediately after Section 3.

**Prompt: Cover illustration — The Supply-Chain Attack**
Communicates the article's central argument at a glance.

---

## Image 2 — Attack-chain infographic
Priority 2
Explains the technical sequence and causal relationships.

**Prompt: Infographic sequence**
Diagram showing vector flow.

---

## Image 3 — What a suspicious configuration looks like
Practical visual for Section 4.

**Prompt: Code editor illustration**
Shows risky setting.

---

## Image 4 — Investigation checklist
Converts recommendations into an actionable visual.

**Prompt: Checklist matrix**
Inspection checklist.`;

  const parsed = parsePrompts(multiImagePackage);
  assert.strictEqual(parsed.length, 4);

  const units = splitImagePrompts(multiImagePackage);
  assert.strictEqual(units.length, 4);
  assert.strictEqual(units[0].imageNumber, 1);
  assert.strictEqual(units[0].title, "The cover image");
  assert.strictEqual(units[1].imageNumber, 2);
  assert.strictEqual(units[1].title, "Attack-chain infographic");
  assert.strictEqual(units[2].imageNumber, 3);
  assert.strictEqual(units[2].title, "What a suspicious configuration looks like");
  assert.strictEqual(units[3].imageNumber, 4);
  assert.strictEqual(units[3].title, "Investigation checklist");

  // Ensure preamble was not included as an image
  assert.ok(!parsed[0].startsWith('# Visual Plan'));
  assert.ok(parsed[0].startsWith('## Image 1 — The cover image'));
  // Ensure trailing horizontal rules were cleanly trimmed
  assert.ok(!parsed[0].endsWith('---'));
});

test('panel.js: code fence edge case (headings inside code blocks)', (t) => {
  const codeBlockPrompt = `## Image 1 — Realistic illustration
Here is the code block with an example Markdown snippet:

\`\`\`markdown
## Image 2 — Fake heading inside code
This should not split Image 1.
\`\`\`

Still Image 1 instructions.

## Image 2 — Real second image
Actual image 2 content.`;

  const parsed = parsePrompts(codeBlockPrompt);
  assert.strictEqual(parsed.length, 2);
  assert.ok(parsed[0].includes('Fake heading inside code'));
  assert.ok(parsed[1].startsWith('## Image 2 — Real second image'));
});

