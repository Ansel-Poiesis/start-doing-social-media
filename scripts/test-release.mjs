import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, unlink, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// All values and files below are synthetic fixtures in a new isolated temporary Git repository.
const scratch = await mkdtemp(path.join(os.tmpdir(), 'media-release-test-'));
const stage = () => execFileSync('git', ['add', '-A'], { cwd: scratch, stdio: 'ignore' });
const scan = () => spawnSync(process.execPath, ['scripts/check-release.mjs'], { cwd: scratch, encoding: 'utf8' });
let cases = 0;
function expectScan(expected, description, category) {
  const result = scan();
  // Do not print scanner stdout/stderr on failure: a regression could expose a fixture value.
  assert.equal(result.status, expected, 'Release scan regression: ' + description);
  if (category) assert.ok(result.stderr.includes(category), 'Expected redacted finding category: ' + description);
  cases++;
}
async function fileCase(filename, body, expected, category) {
  await writeFile(path.join(scratch, filename), body);
  stage();
  expectScan(expected, filename, category);
  await unlink(path.join(scratch, filename));
  stage();
}

try {
  await mkdir(path.join(scratch, 'scripts'));
  await writeFile(path.join(scratch, 'scripts/check-release.mjs'), await readFile(new URL('./check-release.mjs', import.meta.url)));
  for (let i = 0; i < 21; i++) await writeFile(path.join(scratch, `fixture-${i}.md`), 'Harmless synthetic fixture.\n');
  execFileSync('git', ['init', '-q'], { cwd: scratch, stdio: 'ignore' });
  stage();
  expectScan(0, 'clean baseline');
  const fakeToken = 'ghp_' + 'A'.repeat(40);
  for (const filename of ['token.md', 'token.txt', 'config.toml', 'credentials']) await fileCase(filename, fakeToken, 1, 'possible secret');
  await fileCase('key.pem', '-----BEGIN ' + 'EC PRIVATE KEY-----\nSYNTHETIC\n-----END EC PRIVATE KEY-----', 1, 'possible secret');
  await fileCase('key-encrypted.pem', '-----BEGIN ' + 'ENCRYPTED PRIVATE KEY-----\nSYNTHETIC', 1, 'possible secret');
  await fileCase('posix.txt', '/' + ['home', 'example', 'private', 'account.json'].join('/'), 1, 'local absolute path');
  await fileCase('windows.txt', 'Z:' + String.fromCharCode(92) + 'private' + String.fromCharCode(92) + 'account.json', 1, 'local absolute path');
  await fileCase('unc.txt', String.fromCharCode(92).repeat(2) + 'example-host' + String.fromCharCode(92) + 'private-share', 1, 'local absolute path');
  await fileCase('doc#draft.md', 'Harmless draft with a fragment character in its filename.', 0);
  await fileCase('doc%20literal.md', 'Harmless draft with a literal percent escape in its filename.', 0);
  await fileCase('configuration.txt', 'API_KEY=replace-me\nhttps://example.com/source\n', 0);
  await fileCase('image.bin', Buffer.from([0, 255, 128, 1]), 0);
  await writeFile(path.join(scratch, 'staged.md'), fakeToken);
  stage();
  await writeFile(path.join(scratch, 'staged.md'), 'Working copy is clean, but the staged version is not.');
  expectScan(1, 'staged secret with clean working file', 'possible secret');
  await unlink(path.join(scratch, 'staged.md'));
  expectScan(1, 'staged secret with absent working file', 'possible secret');
  stage();
  await writeFile(path.join(scratch, 'removed.md'), 'Harmless staged file.');
  stage();
  await unlink(path.join(scratch, 'removed.md'));
  expectScan(0, 'harmless staged file with absent working file');
  console.log(`PASS release scanner: ${cases} isolated fixtures; text formats, secret headers, private paths, literal filenames and staged/working differences.`);
} finally {
  // Recursive cleanup is restricted to the exact newly-created test directory.
  assert.equal(path.dirname(path.resolve(scratch)), path.resolve(os.tmpdir()), 'Unsafe fixture cleanup parent');
  assert.ok(path.basename(scratch).startsWith('media-release-test-'), 'Unsafe fixture cleanup name');
  await rm(scratch, { recursive: true, force: true });
}
