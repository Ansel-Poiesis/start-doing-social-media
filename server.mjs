import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const publicFiles = new Set(['index.html','styles.css','app.js','content.js','content-plat-a.js','content-plat-b.js','content-plat-c.js','content-research-a.js','content-research-b.js','content-research-c.js','content-guides.js','content-direction.js','creator-interview.js','mark.svg','assets/creator-profile-map.webp','assets/learning-loop.webp','assets/home-hero-art.png','docs/audit/2026-09-27-metrics-hypothesis-card-review.md','skills/examples/synthetic-workflow.md','skills/examples/operations-distribution-commercial.md','skills/account-operations/SKILL.md','skills/account-operations/assets/template.md','skills/cross-platform-adaptation/SKILL.md','skills/cross-platform-adaptation/assets/template.md','skills/commercial-cooperation/SKILL.md','skills/commercial-cooperation/assets/template.md','skills/creator-profile/SKILL.md','skills/creator-profile/assets/template.md','skills/platform-research/SKILL.md','skills/platform-research/assets/template.md','skills/topic-planning/SKILL.md','skills/topic-planning/assets/template.md','skills/production-brief/SKILL.md','skills/production-brief/assets/template.md','skills/publication-review/SKILL.md','skills/publication-review/assets/template.md','skills/content-retrospective/SKILL.md','skills/content-retrospective/assets/template.md']);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.md':'text/markdown; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};

// Importing the factory does not bind a port. Checks run their own loopback server.
export function createReaderServer() {
  return http.createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }
    let name;
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      name = decodeURIComponent(pathname).replace(/^\//, '') || 'index.html';
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (!publicFiles.has(name)) {
      res.writeHead(404);
      res.end(req.method === 'HEAD' ? undefined : 'Not found');
      return;
    }
    try {
      const file = await readFile(path.join(root, name));
      res.writeHead(200, {
        'Content-Type': mime[path.extname(name)],
        'Content-Length': file.byteLength,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : file);
    } catch {
      res.writeHead(500);
      res.end(req.method === 'HEAD' ? undefined : 'Unable to read file');
    }
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT || 8784);
  const server = createReaderServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log('开始做自媒体吧 http://127.0.0.1:' + server.address().port));
}
