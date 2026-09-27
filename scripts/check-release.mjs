import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
assert.ok(files.length > 20, 'Stage the public files before release scanning');
const forbidden = /(^|\/)(\.local|node_modules|\.env[^/]*|agent\.config\.json|CHECKPOINT\.md|server\.log|creator-agent\.js|market-agent\.js|match-engine\.js|creator-interview-runtime\.js|design-references)(\/|$)|(^|\/)cdp-[^/]+/;
const findings = [];
const localPath = /\b[A-Za-z]:[\\/]|file:\/\/|\/(?:Users|home)\/[A-Za-z0-9._-]+(?:\/|$)|\\\\[A-Za-z0-9][A-Za-z0-9.-]*\\[A-Za-z0-9_$.-]+/;
const secret = /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{24,}|(?:AKIA|ASIA)[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{35}|-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----)/;
function scanText(filename, bytes) {
  // Inspect any UTF-8 text, including extensionless files, TOML, CSV, TXT and PEM.
  // Binary contents/metadata still need the manual release review.
  if (bytes.includes(0)) return;
  let source;
  try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return; }
  if (localPath.test(source)) findings.push(`${filename}: local absolute path`);
  if (secret.test(source)) findings.push(`${filename}: possible secret`);
}
for (const filename of files) {
  if (forbidden.test(filename)) findings.push(`${filename}: private or legacy file`);
  // The staged blob is authoritative even if the working file was removed or cleaned.
  scanText(filename, execFileSync('git', ['show', ':' + filename], { cwd: root, maxBuffer: 32 * 1024 * 1024 }));
  try {
    // File paths must not be interpreted as URLs: '#' and '%' are valid filename characters.
    scanText(filename, await readFile(path.join(root, filename)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
assert.deepEqual([...new Set(findings)], [], 'Public-release scan failed (values intentionally redacted)');
console.log(`Release scan passed: ${files.length} tracked files; working and index content checked. Manual rights/content review remains required.`);
