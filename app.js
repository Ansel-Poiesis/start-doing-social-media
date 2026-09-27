import { sections, articles, articleById, readingIds, homePage } from './content.js';

const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
let currentId = '';
let sectionObserver;
const collapsedSections = new Set();
const collapsedTopics = new Set();

function siteFooter() {
  return '<footer class="site-footer">开始做自媒体吧 · 从理解走向创作</footer>';
}

function renderSidebar(activeId = '') {
  const activeSection = sections.find(section => section.groups.some(group => group.ids.includes(activeId)));
  if (activeSection) collapsedSections.delete(activeSection.id);
  $('#chapters').innerHTML = sections.map(section => {
    const collapsed = collapsedSections.has(section.id);
    const bodyId = 'nav-' + section.id;
    const groups = section.groups.map(group => {
      const topicKey = section.id + ':' + group.ids.join(',');
      if (group.ids.includes(activeId)) collapsedTopics.delete(topicKey);
      const topicCollapsed = collapsedTopics.has(topicKey);
      const topicBodyId = 'topic-' + section.id + '-' + group.ids[0];
      return '<section class="topic-block' + (group.ids.includes(activeId) ? ' current' : '') + '" data-topic="' + escapeHTML(topicKey) + '">' +
      '<h2 class="topic-title"><button type="button" class="topic-toggle" aria-expanded="' + !topicCollapsed + '" aria-controls="' + topicBodyId + '"><span>' + escapeHTML(group.title) + '</span><span class="topic-chevron" aria-hidden="true">▾</span></button></h2>' +
      '<div class="topic-body" id="' + topicBodyId + '"' + (topicCollapsed ? ' hidden' : '') + '><div class="chapter-list">' + group.ids.map(id => {
        const article = articleById[id];
        if (!article) return '';
        const active = id === activeId;
        return '<a href="#/' + id + '" class="chapter-link' + (active ? ' active' : '') + '" data-chapter="' + id + '" ' + (active ? 'aria-current="page"' : '') + '><span class="chapter-name">' + escapeHTML(article.short) + '</span></a>';
      }).join('') + '</div></div></section>';
    }).join('');
    return '<section class="nav-group" data-section="' + section.id + '"><button type="button" class="section-toggle" aria-expanded="' + !collapsed + '" aria-controls="' + bodyId + '"><span class="section-chevron" aria-hidden="true">▾</span><span class="section-name">' + escapeHTML(section.title) + '</span></button><div class="section-body" id="' + bodyId + '"' + (collapsed ? ' hidden' : '') + '>' + groups + '</div></section>';
  }).join('');
}

function setTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  const button = $('#theme-toggle');
  const dark = theme === 'dark';
  button.setAttribute('aria-pressed', String(dark));
  button.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
  button.querySelector('[data-theme-label]').textContent = dark ? '浅色' : '深色';
  button.querySelector('.theme-glyph').textContent = dark ? '☼' : '◐';
  if (persist) {
    try { localStorage.setItem('start-media-theme-v1', theme); } catch {}
  }
}

function renderArticle(article) {
  const index = readingIds.indexOf(article.id);
  const previous = index > 0 ? articleById[readingIds[index - 1]] : null;
  const next = index >= 0 && index < readingIds.length - 1 ? articleById[readingIds[index + 1]] : null;
  const contentSections = article.sections || [];
  const tocItems = contentSections.map(section => ({ id: section.id, title: section.title }));
  if (article.sources) tocItems.push({ id: 'sources', title: '参考资料' });
  const inlineToc = tocItems.length > 1
    ? '<details class="inline-toc"><summary>本页目录</summary><nav class="toc-links">' + tocItems.map(item => '<a href="#/' + article.id + '/' + escapeHTML(item.id) + '" data-section="' + escapeHTML(item.id) + '">' + escapeHTML(item.title) + '</a>').join('') + '</nav></details>'
    : '';
  const sources = article.sources ? '<section class="article-sources" id="sources"><h2>参考资料</h2><ul>' + article.sources.map(source => '<li><a href="' + escapeHTML(source[1]) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(source[0]) + '</a></li>').join('') + '</ul></section>' : '';
  const pagination = '<nav class="article-pagination" aria-label="上一篇与下一篇">' +
    '<a class="page-card" href="#/' + (previous ? previous.id : 'resources') + '"><span class="page-card-label">← 上一篇</span><span class="page-card-title">' + escapeHTML(previous ? previous.title : '研究资料与更新') + '</span></a>' +
    '<a class="page-card is-next" href="#/' + (next ? next.id : 'resources') + '"><span class="page-card-label">下一篇 →</span><span class="page-card-title">' + escapeHTML(next ? next.title : '研究资料与更新') + '</span></a></nav>';
  $('#main').innerHTML = '<article><header class="article-header"><h1>' + escapeHTML(article.title) + '</h1><p class="lead">' + escapeHTML(article.intro) + '</p><p class="article-status">建设状态：' + escapeHTML(article.status) + '</p></header>' + inlineToc +
    contentSections.map(section => '<section class="article-section" id="' + escapeHTML(section.id) + '"><h2>' + escapeHTML(section.title) + '</h2>' + section.html + '</section>').join('') + sources + pagination + '</article>' + siteFooter();
  labelScrollableTables();
  renderToc(tocItems, article.id);
}

function renderHomePage() {
  const links = (link, className = '') => '<a class="' + className + '" href="' + escapeHTML(link.href) + '">' + escapeHTML(link.label) + '</a>';
  $('#main').innerHTML = '<article class="home-page"><section class="home-hero" aria-labelledby="home-title"><div class="home-hero-copy"><p class="home-eyebrow">' + escapeHTML(homePage.eyebrow) + '</p><h1 id="home-title">' + escapeHTML(homePage.title) + '</h1><p class="home-intro">' + escapeHTML(homePage.intro) + '</p><p class="home-note">' + escapeHTML(homePage.note) + '</p><div class="home-actions">' + links(homePage.primary, 'home-action home-action-primary') + links(homePage.secondary, 'home-action home-action-secondary') + '</div></div><figure class="home-hero-art"><img src="./assets/home-hero-art.png" alt="' + escapeHTML(homePage.artAlt) + '"><figcaption>认识创作者，理解观众，让每一次创作都有据可循。</figcaption></figure></section>' +
    '<section class="home-section" aria-labelledby="home-entry-title"><header class="home-section-heading"><p class="home-eyebrow">从这里继续</p><h2 id="home-entry-title">' + escapeHTML(homePage.entryTitle) + '</h2></header><div class="home-pathways">' + homePage.entries.map((entry, index) => '<article class="home-path-card"><span class="home-card-index">0' + (index + 1) + '</span><h3>' + escapeHTML(entry.title) + '</h3><p>' + escapeHTML(entry.body) + '</p>' + links({ label: entry.label, href: entry.href }, 'home-text-link') + '</article>').join('') + '</div></section>' +
    '<section class="home-section" aria-labelledby="home-principles-title"><header class="home-section-heading"><p class="home-eyebrow">阅读方法</p><h2 id="home-principles-title">' + escapeHTML(homePage.principlesTitle) + '</h2></header><div class="home-principles">' + homePage.principles.map(item => '<section class="home-principle"><h3>' + escapeHTML(item.title) + '</h3><p>' + escapeHTML(item.body) + '</p></section>').join('') + '</div></section>' +
    '</article>' + siteFooter();
  $('#page-toc').classList.add('is-empty');
  $('#page-toc').innerHTML = '';
  sectionObserver?.disconnect();
}

function renderToc(items, id) {
  $('#page-toc').classList.toggle('is-empty', !items.length);
  $('#page-toc').innerHTML = items.length ? '<div class="toc-label">本页目录</div><nav class="toc-links">' + items.map(item => '<a href="#/' + id + '/' + item.id + '" data-section="' + item.id + '">' + escapeHTML(item.title) + '</a>').join('') + '</nav>' : '';
  sectionObserver?.disconnect();
  if (!items.length || !('IntersectionObserver' in window)) return;
  sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (!visible.length) return;
    document.querySelectorAll('#page-toc a[data-section], .inline-toc a[data-section]').forEach(link => link.classList.toggle('current', link.dataset.section === visible[0].target.id));
  }, { rootMargin: '-80px 0px -62% 0px', threshold: 0 });
  items.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) sectionObserver.observe(element);
  });
}

function labelScrollableTables() {
  document.querySelectorAll('#main .table-scroll').forEach((region, index) => {
    const sectionTitle = region.closest('.article-section')?.querySelector(':scope > h2')?.textContent.trim();
    const caption = region.querySelector('caption')?.textContent.trim();
    const label = caption || `${sectionTitle || '文章'}表格 ${index + 1}`;
    region.tabIndex = 0;
    region.setAttribute('role', 'group');
    region.setAttribute('aria-label', `${label}（可横向滚动）`);
  });
}

function route() {
  const [rawId, anchor] = location.hash.replace(/^#\/?/, '').split('/');
  const id = rawId || 'home';
  if (id !== currentId) {
    const shouldMoveFocus = currentId !== '';
    currentId = id;
    renderSidebar(id === 'home' ? '' : id);
    if (id === 'home') renderHomePage();
    else if (Object.hasOwn(articleById, id)) renderArticle(articleById[id]);
    else {
      $('#main').innerHTML = '<article><h1>没有找到这篇内容</h1><p>请从文章导航中选择已收录的主题。</p></article>' + siteFooter();
      $('#page-toc').innerHTML = '';
      $('#page-toc').classList.add('is-empty');
      sectionObserver?.disconnect();
    }
    document.title = id === 'home' ? '开始做自媒体吧｜创作者学习与实践' : (Object.hasOwn(articleById, id) ? articleById[id].title : '开始做自媒体吧') + ' · 开始做自媒体吧';
    if (isNarrowNav()) setSidebar(false);
    if (shouldMoveFocus) $('#main').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
}

const isNarrowNav = () => matchMedia('(max-width: 899px)').matches;

function setSidebar(open, reveal = false) {
  const sidebar = $('#sidebar');
  sidebar.classList.toggle('is-open', open);
  const expanded = sidebar.classList.contains('is-open');
  $('#sidebar-heading')?.setAttribute('aria-expanded', String(expanded));
  $('#menu-toggle')?.setAttribute('aria-expanded', String(expanded));
  $('#menu-toggle')?.setAttribute('aria-label', expanded ? '收起文章导航' : '展开文章导航');
  if (expanded && reveal) sidebar.scrollIntoView({ block: 'start' });
}

setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
$('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  $('#main').focus({ preventScroll: true });
  $('#main').scrollIntoView({ block: 'start' });
});
$('#theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
$('#menu-toggle').addEventListener('click', () => setSidebar(!$('#sidebar').classList.contains('is-open'), true));
$('#sidebar-heading').addEventListener('click', () => setSidebar(!$('#sidebar').classList.contains('is-open')));
$('#chapters').addEventListener('click', event => {
  const topicToggle = event.target.closest('.topic-toggle');
  if (topicToggle) {
    const topic = topicToggle.closest('.topic-block');
    const body = document.getElementById(topicToggle.getAttribute('aria-controls'));
    const willCollapse = !body.hidden;
    body.hidden = willCollapse;
    topicToggle.setAttribute('aria-expanded', String(!willCollapse));
    if (willCollapse) collapsedTopics.add(topic.dataset.topic); else collapsedTopics.delete(topic.dataset.topic);
    return;
  }
  const toggle = event.target.closest('.section-toggle');
  if (toggle) {
    const sectionId = toggle.closest('.nav-group').dataset.section;
    const body = document.getElementById('nav-' + sectionId);
    const willCollapse = !body.hidden;
    body.hidden = willCollapse;
    toggle.setAttribute('aria-expanded', String(!willCollapse));
    if (willCollapse) collapsedSections.add(sectionId); else collapsedSections.delete(sectionId);
    return;
  }
  if (event.target.closest('a') && isNarrowNav()) setSidebar(false);
});
window.addEventListener('hashchange', route);
document.addEventListener('keydown', event => { if (event.key === 'Escape') setSidebar(false); });
route();
