const fs = require('fs');
const content = fs.readFileSync('c:/Users/rauta/Videos/PROJECT X1/app/page.tsx', 'utf8');

// A very simple regex-based tag match scanner for JSX
const tagRegex = /<(\/?[a-zA-Z0-9_\.-]+)(?:\s+[^>]*)?>/g;
const stack = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    
    // Ignore self-closing tags like <br />, <img />, <input />, <Settings ... /> etc.
    if (fullTag.endsWith('/>')) {
      continue;
    }
    
    if (tagName.startsWith('/')) {
      const closingName = tagName.substring(1);
      if (stack.length === 0) {
        console.log(`Unmatched closing tag </${closingName}> at line ${i + 1}`);
        continue;
      }
      const top = stack.pop();
      if (top.name !== closingName) {
        console.log(`Mismatched closing tag </${closingName}> at line ${i + 1} (expected closing for <${top.name}> from line ${top.line})`);
      }
    } else {
      // Avoid matching standard comparisons like `i < length` or `value < 0.5`
      // Since our regex checks for `<tagName` followed by space or `>` or properties,
      // it matches standard tags. But let's check:
      const name = tagName;
      if (name === 'img' || name === 'br' || name === 'hr' || name === 'input') {
        // usually self closing, but if they don't have />, we still treat them as self closing in simple environments
        continue;
      }
      stack.push({ name, line: i + 1 });
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed tags:');
  for (const item of stack) {
    console.log(`  <${item.name}> at line ${item.line}`);
  }
} else {
  console.log('All tags match perfectly!');
}
