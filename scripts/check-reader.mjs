import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { articles, sections, readingIds, articleById, homePage } from '../content.js';
import { coreQuestions } from '../creator-interview.js';

assert.equal(new Set(articles.map(article => article.id)).size, articles.length, 'Duplicate article IDs');
assert.equal(new Set(readingIds).size, readingIds.length, 'Duplicate reader routes');
assert.deepEqual([...readingIds].sort(), articles.map(article => article.id).sort(), 'Every article must appear exactly once in navigation');
assert.equal(sections.length, 6, 'The reader should have six numbered themes');
assert.deepEqual(sections.map(section => section.title.slice(0, 2)), ['一、', '二、', '三、', '四、', '五、', '六、'], 'Theme headings should use Chinese numerals');
for (const section of sections) for (const group of section.groups) for (const id of group.ids) {
  assert.ok(articleById[id], 'Broken reader article: ' + id);
  assert.ok(group.title && !/^第.+部分|^第.+步/.test(group.title), 'Theme subheadings should not have numeric prefixes: ' + group.title);
}
for (const article of articles) {
  assert.match(article.id, /^[a-z][a-z0-9-]*$/, 'Invalid article route: ' + article.id);
  assert.ok(article.title && article.intro && article.status, 'Incomplete article: ' + article.id);
  assert.equal(new Set((article.sections || []).map(section => section.id)).size, (article.sections || []).length, 'Duplicate anchor: ' + article.id);
  for (const section of article.sections || []) {
    assert.match(section.id, /^[a-z][a-z0-9-]*$/, 'Invalid section anchor: ' + article.id + '/' + section.id);
    assert.ok(section.title && section.html.trim(), 'Empty section: ' + article.id + '/' + section.id);
  }
  assert.ok(!(article.sources && article.sections.some(section => section.id === 'sources')), 'The sources anchor is reserved: ' + article.id);
}
assert.equal(sections[1].title, '二、理解平台', 'Theme two should cover platform understanding');
assert.equal(sections[2].title, '三、形成方向与选题', 'Theme three should cover direction and topics');
for (const id of ['match', 'direction', 'vertical', 'vertical-methods', 'expectation', 'decide', 'topic', 'topic-gate']) {
  assert.ok(articleById[id] && readingIds.includes(id), 'Missing direction article: ' + id);
}
assert.ok(!articleById.interview && !readingIds.includes('interview'), 'The local questionnaire should not be integrated in the reader');
for (const id of ['match-bench', 'vertical-agent']) assert.ok(!articleById[id] && !readingIds.includes(id), 'Retired workbench is still in the reader: ' + id);
for (const id of ['xhs', 'douyin', 'wechat', 'bilibili', 'zhihu', 'toutiao', 'baijiahao']) {
  assert.ok(articleById[id] && readingIds.includes(id), 'Missing platform long-form article: ' + id);
  assert.ok((articleById[id].sections || []).length >= 12, 'Platform article should stay one long piece with all movements: ' + id);
}
for (const id of ['xhs-scene', 'xhs-mech', 'xhs-rules', 'xhs-practice', 'dy-mech', 'dy-rules', 'dy-practice', 'wx-mech', 'wx-rules', 'wx-practice', 'bl-mech', 'bl-rules', 'bl-practice', 'zh-mech', 'zh-rules', 'zh-practice', 'tt-mech', 'tt-rules', 'tt-practice', 'bj-mech', 'bj-rules', 'bj-practice']) {
  assert.ok(!articleById[id], 'Split article should be merged into the platform long-form: ' + id);
}
assert.ok(articleById['cross-mech'] && readingIds.includes('cross-mech'), 'Missing cross-platform long-form article');
for (const id of ['gates', 'hyp-m', 'hyp-c', 'hyp-t', 'hyp-e', 'hyp-l', 'lib-cross', 'lib-platform', 'lib-academic', 'lib-benchmark', 'lib-monetize', 'lib-methods', 'mapping']) {
  assert.ok(articleById[id] && readingIds.includes(id), 'Missing research-base long-form article: ' + id);
}
for (const id of ['platform-contract', 'topic-gate', 'production-brief', 'compliance-diff', 'prereg-manual', 'decision-record']) {
  assert.ok(articleById[id] && readingIds.includes(id), 'Missing guide article: ' + id);
}

assert.equal(coreQuestions.length, 20, 'The creator interview should have twenty core questions');
assert.equal(new Set(coreQuestions.map(question => question.id)).size, coreQuestions.length, 'Duplicate interview question IDs');
// Status prose changes as research progresses; validate the published content contract instead.
const profileQuestions = articleById.profile.sections.find(section => section.id === 'questions')?.html || '';
for (const question of coreQuestions) {
  assert.ok(question.title && question.group && question.why && question.example, 'Every core question needs its title, group, reason and example: ' + question.id);
  assert.ok(profileQuestions.includes(question.title), 'Profile article omits a core question: ' + question.id);
  if (question.kind === 'text') assert.ok(question.prompt && question.example.length >= 12, 'Text questions need instruction and example: ' + question.id);
}
assert.equal((profileQuestions.match(/class="profile-question"/g) || []).length, 20, 'The profile article must render all twenty questions');

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
assert.ok(!html.includes('announcement-bar') && !css.includes('.announcement-bar'), 'Purple announcement banner remains');
assert.ok(html.includes('id="theme-toggle"') && html.includes('content="light dark"'), 'Theme toggle or native dark color scheme is missing');
assert.ok(!html.includes('class="topnav"') && !html.includes('认识创作者</a>') && !html.includes('读懂平台</a>') && !html.includes('做出内容</a>'), 'Top-level shortcut links remain in the header');
assert.ok(css.includes(':root[data-theme="dark"]') && app.includes('start-media-theme-v1'), 'Persistent dark theme is not wired');
assert.ok(app.includes('section-toggle') && app.includes('topic-title') && app.includes('page-card'), 'Numbered-theme, unnumbered-topic, article navigation is missing');
assert.ok(!css.includes('.chapter-subsections') && !app.includes('chapter-subsections'), 'Old subsection navigation remains');
assert.ok(!css.includes('.topnav'), 'Removed top navigation styling remains');
assert.ok(!css.includes('#8b5cf6') && !css.includes('#7c3aed'), 'Purple reference color remains in the site theme');
// The accepted reading layout uses 17px prose, 14px navigation and 12–15px auxiliary text.
// Preserve readable body/table text without forcing every icon and caption to body size.
for (const match of css.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)) assert.ok(Number(match[1]) >= 12, 'Unreadably small auxiliary text: ' + match[0]);
for (const selector of ['body', '.article-section p', '.article-section li', 'table']) {
  const sizes = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(rule => rule[1].split(',').map(value => value.trim()).includes(selector))
    .flatMap(rule => [...rule[2].matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)].map(match => Number(match[1])));
  assert.ok(sizes.length && sizes.every(size => size >= 16), 'Reading text must stay at least 16px: ' + selector);
}
const textLength = id => (articleById[id].sections || []).map(section => section.html.replace(/<[^>]*>/g, '')).join('').length;
for (const [id, minimum] of [['profile', 2500], ['platform', 1200], ['topic', 1000], ['iteration', 1000], ...['match', 'vertical', 'vertical-methods'].map(id => [id, 1500]), ...['expectation', 'decide'].map(id => [id, 1000]), ...['xhs', 'douyin', 'wechat', 'bilibili', 'zhihu', 'toutiao', 'baijiahao'].map(id => [id, 2000]), ...['compliance', 'competition', 'constitution', 'hypotheses', 'cards', 'governance'].map(id => [id, 700]), ...['cross-mech', 'gates', 'hyp-m', 'hyp-c', 'hyp-t', 'hyp-e', 'hyp-l', 'lib-cross', 'lib-platform', 'lib-academic', 'lib-benchmark', 'lib-monetize', 'lib-methods', 'mapping', 'platform-contract', 'topic-gate', 'production-brief', 'compliance-diff', 'prereg-manual', 'decision-record'].map(id => [id, 450])]) {
  assert.ok(textLength(id) >= minimum, 'Core article is still outline-like: ' + id + ' (' + textLength(id) + ' characters)');
}

for (const file of ['index.html', 'content.js', 'creator-interview.js', 'app.js', 'styles.css', 'docs/agent-knowledge/01-profile.md']) {
  const contents = await readFile(new URL('../' + file, import.meta.url), 'utf8');
  assert.ok(!contents.includes('\uFFFD'), 'Invalid UTF-8 in ' + file);
  assert.ok(!contents.includes('AI 实用指南'), 'Old AI knowledge-base branding remains in ' + file);
}

for (const file of ['assets/creator-profile-map.webp', 'assets/learning-loop.webp', 'assets/home-hero-art.png']) {
  assert.ok((await stat(new URL('../' + file, import.meta.url))).size > 100_000, 'Illustration asset missing or too small: ' + file);
}

// Check actual home/article links, including section anchors, rather than just route counts.
function checkInternalLink(href, owner) {
  if (!href.startsWith('#/')) return;
  const [id, anchor] = href.slice(2).split('/');
  if (id === 'home' && !anchor) return;
  const target = articleById[id];
  assert.ok(target, 'Broken article link in ' + owner + ': ' + href);
  if (anchor) assert.ok(target.sections.some(section => section.id === anchor) || (anchor === 'sources' && target.sources?.length), 'Broken section link in ' + owner + ': ' + href);
}
for (const link of [homePage.primary, homePage.secondary, ...homePage.entries]) checkInternalLink(link.href, 'home');
for (const article of articles) {
  for (const section of article.sections) {
    for (const match of section.html.matchAll(/href=["']([^"']+)["']/g)) checkInternalLink(match[1], article.id);
  }
  for (const source of article.sources || []) {
    assert.ok(source[0] && /^https?:$/.test(new URL(source[1]).protocol), 'Invalid source link: ' + article.id);
  }
}

// The reader may load only the pure question bank and content modules, never old workbenches.
const readerModules = new Set(['app.js', 'content.js', 'creator-interview.js', 'content-plat-a.js', 'content-plat-b.js', 'content-plat-c.js', 'content-direction.js', 'content-guides.js', 'content-research-a.js', 'content-research-b.js', 'content-research-c.js']);
const loadedModules = new Set();
async function checkModule(name) {
  assert.ok(readerModules.has(name), 'Unexpected browser module: ' + name);
  if (loadedModules.has(name)) return;
  loadedModules.add(name);
  const code = await readFile(new URL('../' + name, import.meta.url), 'utf8');
  assert.ok(!code.includes('\uFFFD'), 'Invalid UTF-8 in ' + name);
  assert.ok(!/\b(?:fetch|WebSocket|XMLHttpRequest|sendBeacon)\s*\(/.test(code), 'The static reader must not send visitor data or call APIs: ' + name);
  for (const match of code.matchAll(/\bimport\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g)) {
    assert.ok(match[1].startsWith('./'), 'Unexpected nonlocal module: ' + match[1]);
    await checkModule(match[1].slice(2));
  }
}
await checkModule('app.js');
assert.deepEqual([...loadedModules].sort(), [...readerModules].sort(), 'Reader module graph changed; review its public boundary');
console.log('PASS reader: ' + articles.length + ' articles, 6 themes, 20 profile questions, internal routes/anchors, reading layout contracts and pure module graph.');
