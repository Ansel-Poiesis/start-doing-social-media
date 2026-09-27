import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { articles, articleById } from '../content.js';
import { coreQuestions } from '../creator-interview.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('../skills/manifest.json', import.meta.url), 'utf8'));
const packageInfo = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(manifest.version, packageInfo.version, 'Skill manifest and package versions differ');
assert.equal(manifest.schemaVersion, 1, 'Unsupported skill manifest schema');
assert.equal(new Set(manifest.skills.map(skill => skill.name)).size, manifest.skills.length, 'Duplicate skill names');
assert.ok(manifest.skills.length >= 6, 'Missing workflow skill');
const names = new Set(manifest.skills.map(skill => skill.name));
function projectPath(filename) {
  const resolved = path.resolve(root, filename);
  const relative = path.relative(root, resolved);
  assert.ok(relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative), 'Skill dependency must stay inside the repository: ' + filename);
  return resolved;
}
for (const skill of manifest.skills) {
  assert.match(skill.name, /^[a-z][a-z0-9-]*$/, 'Invalid skill name');
  assert.ok(skill.output && skill.inputs?.length && skill.articles?.length, 'Skill must declare inputs, output and article dependencies: ' + skill.name);
  const source = (await readFile(projectPath(skill.path), 'utf8')).replace(/\r\n/g, '\n');
  assert.match(source, new RegExp(`^---\\nname: ${skill.name}\\n`));
  assert.match(source, /\ndescription: .{25,}/);
  for (const heading of ['输入', '按需读取', '工作步骤', '输出与交接', '停止条件']) assert.ok(source.includes(`## ${heading}`), `${skill.name}: missing ${heading}`);
  assert.ok(!source.includes('[TODO:'), 'Unfinished skill scaffold');
  for (const id of skill.articles) assert.ok(Object.hasOwn(articleById, id), `Unknown article: ${id}`);
  for (const filename of [skill.template, skill.reference]) assert.ok((await stat(projectPath(filename))).isFile(), `Missing dependency: ${filename}`);
  if (skill.next) assert.ok(names.has(skill.next), 'Broken skill handoff');
  for (const [, link] of source.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:/.test(link)) continue;
    const resolved = path.resolve(path.dirname(path.join(root, skill.path)), link.split('#')[0]);
    projectPath(resolved);
    assert.ok((await stat(resolved)).isFile(), `Broken skill link: ${skill.path} -> ${link}`);
  }
  const template = await readFile(path.join(root, skill.template), 'utf8');
  assert.ok(template.includes('材料性质：真实 / 匿名化 / 合成教学'), 'Template omits provenance boundary');
  for (const field of ['产物 ID 与保存路径', '上游产物 ID、版本与读取日期', '本轮依赖的 claim_id / 证据 ID', '本人确认人、日期与范围', '阻断项、负责人与允许的下一动作']) {
    assert.ok(template.includes(field), `${skill.name}: template omits handoff field ${field}`);
  }
}
for (const filename of ['README.md', 'skills/README.md', 'skills/examples/synthetic-workflow.md']) {
  const source = await readFile(projectPath(filename), 'utf8');
  for (const [, link] of source.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|mailto:)/i.test(link) || link.startsWith('#')) continue;
    const target = link.split('#')[0].split('?')[0];
    if (!target) continue;
    const resolved = projectPath(path.resolve(path.dirname(path.join(root, filename)), decodeURIComponent(target)));
    assert.ok((await stat(resolved)).isFile(), `Broken repository link: ${filename} -> ${link}`);
  }
}
const pairIndex = await readFile(new URL('../docs/agent-knowledge/README.md', import.meta.url), 'utf8');
for (const article of articles) assert.ok(pairIndex.includes('`' + article.id + '`'), `Article has no paired-reference index: ${article.id}`);
// Test a real generated article (including its twenty questions), not just CLI exit status.
const profile = spawnSync(process.execPath, ['scripts/read-article.mjs', 'profile'], { cwd: root, encoding: 'utf8' });
assert.equal(profile.status, 0, profile.stderr);
assert.ok(profile.stdout.length > 5000 && profile.stdout.includes('创作者档案'), 'Article export dropped its body');
for (const question of coreQuestions) assert.ok(profile.stdout.includes(question.title), 'Article export omits a creator question: ' + question.id);
for (const article of articles) {
  const result = article.id === 'profile' ? profile : spawnSync(process.execPath, ['scripts/read-article.mjs', article.id], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, 'Article export failed: ' + article.id);
  assert.ok(result.stdout.includes(article.status), 'Article export dropped status: ' + article.id);
  for (const [label, url] of article.sources || []) assert.ok(result.stdout.includes(label) && result.stdout.includes(url), 'Article export dropped a source: ' + article.id);
}
for (const id of ['does-not-exist', 'constructor', 'toString', '__proto__']) {
  const missing = spawnSync(process.execPath, ['scripts/read-article.mjs', id], { cwd: root, encoding: 'utf8' });
  assert.equal(missing.status, 1, 'Invalid article ID must fail: ' + id);
  assert.match(missing.stderr, /^Usage:/, 'Invalid article ID must return usage instead of a stack trace: ' + id);
}
console.log(`Knowledge checks passed: ${manifest.skills.length} skills, ${articles.length} paired articles, readable full-text export.`);
