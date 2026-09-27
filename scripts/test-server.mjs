import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { createReaderServer } from '../server.mjs';
import { articles } from '../content.js';

const expectedFiles = [
  'index.html', 'styles.css', 'app.js', 'content.js', 'content-plat-a.js',
  'content-plat-b.js', 'content-plat-c.js', 'content-research-a.js',
  'content-research-b.js', 'content-research-c.js', 'content-guides.js',
  'content-direction.js', 'creator-interview.js', 'mark.svg',
  'assets/creator-profile-map.webp', 'assets/learning-loop.webp', 'assets/home-hero-art.png',
  'docs/audit/2026-09-27-metrics-hypothesis-card-review.md', 'skills/examples/synthetic-workflow.md',
  'skills/creator-profile/SKILL.md', 'skills/creator-profile/assets/template.md',
  'skills/platform-research/SKILL.md', 'skills/platform-research/assets/template.md',
  'skills/topic-planning/SKILL.md', 'skills/topic-planning/assets/template.md',
  'skills/production-brief/SKILL.md', 'skills/production-brief/assets/template.md',
  'skills/publication-review/SKILL.md', 'skills/publication-review/assets/template.md',
  'skills/content-retrospective/SKILL.md', 'skills/content-retrospective/assets/template.md',
];
const expectedTypes = { html: 'text/html', css: 'text/css', js: 'text/javascript', md: 'text/markdown', svg: 'image/svg+xml', webp: 'image/webp', png: 'image/png' };
const server = createReaderServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const port = server.address().port;
let requests = 0;

// Use raw request paths so URL normalization cannot hide traversal/malformed cases.
function request(path, method = 'GET') {
  requests++;
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method, agent: false }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(5000, () => req.destroy(new Error('HTTP check timed out: ' + method + ' ' + path)));
    req.on('error', reject);
    req.end();
  });
}

try {
  for (const file of expectedFiles) {
    const body = await readFile(new URL('../' + file, import.meta.url));
    const response = await request('/' + file);
    assert.equal(response.status, 200, 'GET ' + file);
    assert.deepEqual(response.body, body, 'HTTP response differs from file: ' + file);
    assert.ok(response.headers['content-type'].startsWith(expectedTypes[file.split('.').at(-1)]), 'Incorrect MIME type: ' + file);
    assert.equal(response.headers['x-content-type-options'], 'nosniff', 'Missing MIME isolation: ' + file);
    assert.equal(response.headers['cache-control'], 'no-store', 'Stale reader cache policy: ' + file);
    const head = await request('/' + file, 'HEAD');
    assert.equal(head.status, 200, 'HEAD ' + file);
    assert.equal(head.body.length, 0, 'HEAD must not send a body: ' + file);
    assert.equal(Number(head.headers['content-length']), body.length, 'HEAD length must match GET: ' + file);
    assert.equal(head.headers['content-type'], response.headers['content-type'], 'HEAD type must match GET: ' + file);
  }
  const home = await request('/');
  assert.equal(home.status, 200, 'Home route');
  assert.deepEqual(home.body, await readFile(new URL('../index.html', import.meta.url)), 'Home must serve index.html');
  assert.equal((await request('/app.js?v=smoke')).status, 200, 'Static file query strings');
  for (const file of [
    'README.md', 'TODO.md', 'CHECKPOINT.md', 'package.json', 'server.mjs', 'check.mjs',
    'docs/audit/README.md', 'docs/claims/registry.json', 'skills/manifest.json', 'skills/PROTOCOL.md',
    'skills/platform-research/assets/nonexistent.md', 'skills/creator-profile/private-notes.md',
    'docs/agent-knowledge/01-profile.md', 'creator-interview-runtime.js', 'creator-agent.js',
    'match-engine.js', 'market-agent.js', 'agent.config.json', '.git/config', '.env',
    '.local/baseline-2026-09-27/agent.config.json', 'scripts/test-server.mjs',
    'assets/creator-profile-map.png', 'unknown', 'api/agent',
    '%2e%2e%2fREADME.md', '%2e%2e%5cREADME.md', '%252e%252e%252fREADME.md',
    '..%2fserver.mjs', 'assets/../server.mjs', 'app.js%00',
  ]) {
    assert.equal((await request('/' + file)).status, 404, 'Unexpected public file: ' + file);
  }
  for (const article of articles) {
    for (const section of article.sections) {
      for (const match of section.html.matchAll(/href=["']([^"']+)["']/g)) {
        const href = match[1].split('#')[0];
        if (href.startsWith('skills/') || href.startsWith('docs/audit/')) {
          assert.ok(expectedFiles.includes(href), 'Reader link must target an explicitly public file: ' + article.id + ' -> ' + href);
        }
      }
    }
  }
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    for (const route of ['/app.js', '/api/agent']) {
      const response = await request(route, method);
      assert.equal(response.status, 405, 'Disabled method: ' + method + ' ' + route);
      assert.equal(response.headers.allow, 'GET, HEAD', '405 must advertise supported methods');
    }
  }
  for (const path of ['/%', '/%E0%A4%A', 'http://[']) {
    assert.equal((await request(path)).status, 400, 'Malformed path should be rejected: ' + path);
  }
  assert.equal((await request('/')).status, 200, 'Server must survive malformed request targets');
  assert.equal((await request('/unknown', 'HEAD')).body.length, 0, '404 HEAD must not send a body');
  console.log('PASS server: ' + requests + ' HTTP requests; ' + expectedFiles.length + ' public files, GET/HEAD, MIME, methods, private files, traversal and malformed paths.');
} finally {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
