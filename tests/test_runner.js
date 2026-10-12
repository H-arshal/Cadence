// Browser test runner for Cadence
(async () => {
  const results = [];
  const log = (msg, ok = true) => {
    results.push({ msg, ok });
    const div = document.createElement('div');
    div.style.cssText = `padding: 8px 12px; margin: 4px 0; border-radius: 6px; font-family: monospace; font-size: 13px; ${
      ok ? 'background: #e6f4ea; color: #137333; border: 1px solid #ceead6;' : 'background: #fce8e6; color: #c5221f; border: 1px solid #fad2cf;'
    }`;
    div.textContent = `${ok ? '✔' : '✖'} ${msg}`;
    document.body.appendChild(div);
  };

  const header = document.createElement('h2');
  header.textContent = 'Cadence Browser Test Suite';
  header.style.fontFamily = 'system-ui, sans-serif';
  document.body.appendChild(header);

  try {
    const PQ = window.PQ;
    if (!PQ || !PQ.panel || !PQ.panel.parsePrompts) {
      throw new Error('PQ.panel.parsePrompts is not loaded');
    }

    const { parsePrompts, splitImagePrompts } = PQ.panel;

    // Test 1: Empty input
    if (parsePrompts('').length === 0 && parsePrompts('   \n  \t').length === 0) {
      log('Empty / whitespace input handled correctly');
    } else {
      log('Empty input failed', false);
    }

    // Test 2: Standard single-line prompts
    const simple = parsePrompts('A red fox\nIsometric city');
    if (simple.length === 2 && simple[0] === 'A red fox' && simple[1] === 'Isometric city') {
      log('Simple line-separated prompts parsed correctly');
    } else {
      log('Simple line-separated prompts failed', false);
    }

    // Test 3: List markers
    const markers = parsePrompts('- A red fox\n* Isometric city\n1. Cyberpunk cat');
    if (markers.length === 3 && markers[0] === 'A red fox' && markers[1] === 'Isometric city' && markers[2] === 'Cyberpunk cat') {
      log('List markers stripped and parsed correctly');
    } else {
      log('List markers failed', false);
    }

    // Test 4: JSON array
    const json = parsePrompts('["A red fox", "Isometric city"]');
    if (json.length === 2 && json[0] === 'A red fox') {
      log('JSON array format parsed correctly');
    } else {
      log('JSON array parsing failed', false);
    }

    // Test 5: Editorial Heading Visual Plan
    const editorialSample = `## Image 3 — What a suspicious configuration looks like

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

    const editorialResult = parsePrompts(editorialSample);
    const structured = splitImagePrompts(editorialSample);
    if (
      editorialResult.length === 1 &&
      editorialResult[0] === editorialSample.trim() &&
      structured.length === 1 &&
      structured[0].imageNumber === 3 &&
      structured[0].title === 'What a suspicious configuration looks like'
    ) {
      log('Editorial prompt with JSON code block preserved as 1 unit');
    } else {
      log('Editorial prompt failed to preserve full unit', false);
    }

    // Test 6: Code fence boundary protection
    const codeBlockPrompt = `## Image 1 — First
\`\`\`markdown
## Image 2 — Inside code block
\`\`\`
End of first.

## Image 2 — Second`;
    const codeFenceResult = parsePrompts(codeBlockPrompt);
    if (codeFenceResult.length === 2 && codeFenceResult[0].includes('Inside code block')) {
      log('Code fence boundary protection verified (nested headings ignored)');
    } else {
      log('Code fence boundary protection failed', false);
    }

    // Summary
    const passed = results.filter(r => r.ok).length;
    const summary = document.createElement('div');
    summary.style.cssText = 'margin-top: 16px; font-weight: bold; font-family: system-ui, sans-serif;';
    summary.textContent = `All Tests Completed: ${passed} / ${results.length} Passed`;
    document.body.appendChild(summary);

  } catch (err) {
    log(`Test execution error: ${err.message}`, false);
  }
})();
