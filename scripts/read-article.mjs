import { articles, articleById } from '../content.js';

const id = process.argv[2];
if (id === '--list') {
  console.log(articles.map(article => `${article.id}\t${article.title}`).join('\n'));
} else if (!id || !Object.hasOwn(articleById, id)) {
  console.error('Usage: node scripts/read-article.mjs <article_id | --list>');
  process.exitCode = 1;
} else {
  const article = articleById[id];
  const content = `<p>${article.intro}</p>` + article.sections.map(section => `<h2>${section.title}</h2>${section.html}`).join('\n');
  const text = content
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, title) => `\n${'#'.repeat(Number(n))} ${title}\n`)
    .replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<\/(?:p|div|section|tr|ul|ol|blockquote)>/gi, '\n\n')
    .replace(/<(?:li)\b[^>]*>/gi, '\n- ')
    .replace(/<\/(?:td|th)>/gi, ' | ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n').trim();
  const sources = article.sources?.length
    ? '\n\n## 参考资料\n\n' + article.sources.map(([title, url]) => `- [${title}](${url})`).join('\n')
    : '';
  console.log(`# ${article.title}\n\narticle_id: ${id}\n建设状态：${article.status}\n\n${text}${sources}`);
}
