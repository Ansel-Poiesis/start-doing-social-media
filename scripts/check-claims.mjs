import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { articles } from '../content.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const registry = JSON.parse(await readFile(new URL('../docs/claims/registry.json', import.meta.url), 'utf8'));
const claimPattern = /^[A-Z][A-Z0-9-]+-\d{3}$/;

function parseClaimIds(source) {
  const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return [];
  const line = frontmatter[1].match(/^claim_ids:\s*\[([^\]]*)\]\s*$/m);
  if (!line) return [];
  return line[1].split(',').map(value => value.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function validateRegistry({ data, articleList, documentMarkers }) {
  const errors = [];
  const claims = data?.claims;
  if (data?.schemaVersion !== 1 || !Array.isArray(claims) || !claims.length) {
    return ['Unsupported or empty claim registry'];
  }

  const claimsById = new Map();
  const articleIndex = new Map(articleList.map(article => [article.id, article]));
  for (const claim of claims) {
    if (!claimPattern.test(claim.id || '')) errors.push(`Invalid claim ID: ${claim.id}`);
    if (claimsById.has(claim.id)) errors.push(`Duplicate claim ID: ${claim.id}`);
    claimsById.set(claim.id, claim);
    if (!claim.statement?.trim() || !claim.scope?.trim()) errors.push(`${claim.id}: statement and scope are required`);
    if (claim.reviewedAt !== data.reviewedAt || !/^\d{4}-\d{2}-\d{2}$/.test(claim.reviewedAt || '')) errors.push(`${claim.id}: missing or stale review date`);
    if (!claim.status || !Array.isArray(claim.sources) || !claim.sources.length) errors.push(`${claim.id}: status and at least one source record are required`);
    for (const source of claim.sources || []) {
      if (!source.kind || !source.status || !source.reviewedAt || !(source.url || source.ref)) errors.push(`${claim.id}: source needs kind, status, reviewedAt and url/ref`);
      if (!source.assessment?.trim()) errors.push(`${claim.id}: source needs a support/limitation assessment`);
      if (source.url && !/^https:\/\//.test(source.url)) errors.push(`${claim.id}: source URL must use HTTPS`);
    }
    if (!Array.isArray(claim.consumers) || !claim.consumers.length) errors.push(`${claim.id}: consumers are required`);
    for (const consumer of claim.consumers || []) {
      if (consumer.kind === 'article') {
        const article = articleIndex.get(consumer.articleId);
        if (!article) {
          errors.push(`${claim.id}: unknown article ${consumer.articleId}`);
          continue;
        }
        if (!(article.claimIds || []).includes(claim.id)) errors.push(`${claim.id}: propagation marker missing from article ${consumer.articleId}`);
        const sectionIndex = new Map(article.sections.map(section => [section.id, section]));
        for (const sectionId of consumer.sectionIds || []) {
          const section = sectionIndex.get(sectionId);
          if (!section) errors.push(`${claim.id}: unknown section ${consumer.articleId}.${sectionId}`);
          else for (const cardId of consumer.cardIds || []) {
            if (!section.html.includes(cardId)) errors.push(`${claim.id}: card marker ${cardId} not found in ${consumer.articleId}.${sectionId}`);
          }
        }
        if (!consumer.sectionIds?.length) errors.push(`${claim.id}: article consumer needs section IDs (${consumer.articleId})`);
      } else if (consumer.kind === 'protocol' || consumer.kind === 'skill') {
        const ids = documentMarkers.get(consumer.path);
        if (!ids) errors.push(`${claim.id}: consumer file not loaded: ${consumer.path}`);
        else if (!ids.includes(claim.id)) errors.push(`${claim.id}: propagation marker missing from ${consumer.path}`);
      } else {
        errors.push(`${claim.id}: unsupported consumer kind ${consumer.kind}`);
      }
    }
  }

  for (const article of articleList) {
    const ids = article.claimIds || [];
    if (new Set(ids).size !== ids.length) errors.push(`${article.id}: duplicate claimIds`);
    for (const id of ids) {
      const claim = claimsById.get(id);
      if (!claim) errors.push(`${article.id}: claim ID has no registry entry: ${id}`);
      else if (!claim.consumers.some(consumer => consumer.kind === 'article' && consumer.articleId === article.id)) errors.push(`${article.id}: claim ID has no matching consumer record: ${id}`);
    }
  }

  for (const [filename, ids] of documentMarkers) {
    if (new Set(ids).size !== ids.length) errors.push(`${filename}: duplicate claim_ids`);
    for (const id of ids) {
      const claim = claimsById.get(id);
      if (!claim) errors.push(`${filename}: claim ID has no registry entry: ${id}`);
      else if (!claim.consumers.some(consumer => consumer.path === filename)) errors.push(`${filename}: claim ID has no matching consumer record: ${id}`);
    }
  }
  return errors;
}

const documentPaths = new Set(registry.claims.flatMap(claim => claim.consumers)
  .filter(consumer => consumer.kind === 'protocol' || consumer.kind === 'skill')
  .map(consumer => consumer.path));
const documentMarkers = new Map();
for (const filename of documentPaths) {
  const absolute = path.resolve(root, filename);
  const relative = path.relative(root, absolute);
  assert.ok(relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative), `Consumer path escapes repository: ${filename}`);
  const source = await readFile(absolute, 'utf8');
  documentMarkers.set(filename, parseClaimIds(source));
}

const errors = validateRegistry({ data: registry, articleList: articles, documentMarkers });
assert.deepEqual(errors, [], `Claim registry errors:\n- ${errors.join('\n- ')}`);

const firstArticleConsumer = registry.claims.flatMap(claim => claim.consumers.map(consumer => ({ claim, consumer })))
  .find(({ consumer }) => consumer.kind === 'article');
const mutatedArticles = articles.map(article => ({ ...article, claimIds: [...(article.claimIds || [])] }));
const mutatedArticle = mutatedArticles.find(article => article.id === firstArticleConsumer.consumer.articleId);
mutatedArticle.claimIds = mutatedArticle.claimIds.filter(id => id !== firstArticleConsumer.claim.id);
const negativeErrors = validateRegistry({ data: registry, articleList: mutatedArticles, documentMarkers });
assert.ok(negativeErrors.some(message => message.includes(`propagation marker missing from article ${mutatedArticle.id}`)), 'Removing a consumer marker must fail validation');

for (const kind of ['protocol', 'skill']) {
  const target = registry.claims.flatMap(claim => claim.consumers.map(consumer => ({ claim, consumer })))
    .find(({ consumer }) => consumer.kind === kind);
  const mutatedDocuments = new Map([...documentMarkers].map(([filename, ids]) => [filename, [...ids]]));
  mutatedDocuments.set(target.consumer.path, mutatedDocuments.get(target.consumer.path).filter(id => id !== target.claim.id));
  const missingDocumentMarker = validateRegistry({ data: registry, articleList: articles, documentMarkers: mutatedDocuments });
  assert.ok(missingDocumentMarker.some(message => message.includes(`propagation marker missing from ${target.consumer.path}`)), `Removing a ${kind} marker must fail validation`);
}

const firstCardConsumer = registry.claims.flatMap(claim => claim.consumers.map(consumer => ({ claim, consumer })))
  .find(({ consumer }) => consumer.kind === 'article' && consumer.cardIds?.length);
const mutatedCardArticles = articles.map(article => ({
  ...article,
  claimIds: [...(article.claimIds || [])],
  sections: article.sections.map(section => ({ ...section }))
}));
const cardArticle = mutatedCardArticles.find(article => article.id === firstCardConsumer.consumer.articleId);
const cardSection = cardArticle.sections.find(section => section.id === firstCardConsumer.consumer.sectionIds[0]);
cardSection.html = cardSection.html.replace(firstCardConsumer.consumer.cardIds[0], 'MISSING-CARD');
const missingCard = validateRegistry({ data: registry, articleList: mutatedCardArticles, documentMarkers });
assert.ok(missingCard.some(message => message.includes(`card marker ${firstCardConsumer.consumer.cardIds[0]} not found`)), 'Removing a card anchor must fail validation');

function consumerText(articleId, sectionId) {
  const article = articles.find(item => item.id === articleId);
  assert.ok(article, "Missing regression article " + articleId);
  const section = article.sections.find(item => item.id === sectionId);
  assert.ok(section, "Missing regression section " + articleId + "." + sectionId);
  return section.title + " " + section.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

const propagationBoundaries = [
  { articleId: "cross-mech", sectionId: "searchfeed", forbidden: [/双重收益|推荐画像校准|训练出错误画像/], required: [/现有材料不足/, /按平台分别记录/, /M29\/L14/] },
  { articleId: "cross-mech", sectionId: "types", forbidden: [/算法赛马型|搜索混合型|社交分发型|平台三型分治|二级传播的扳机/], required: [/不预设/, /注明来源、时间、定义与分母/, /都可能对应不同意图/, /不根据审美风格推断/] },
  { articleId: "xhs", sectionId: "position", forbidden: [/去中心化内容场|搜索余命|不依赖好友关系链|吃不到结构性长尾/], required: [/M29\/L14/, /账号可见数据/] },
  { articleId: "xhs", sectionId: "papers", forbidden: [/搜索行为反哺推荐流画像|搜索词布局同时在训练系统/], required: [/不单独证明线上搜索/, /分别记录可见搜索与推荐来源/] },
  { articleId: "douyin", sectionId: "position", forbidden: [/算法赛马型|搜索反哺推荐|搜索兴趣实时调整推荐|冷启动靠内容语义质量/], required: [/没有确认搜索行为/, /编辑候选/] },
  { articleId: "wechat", sectionId: "typology", forbidden: [/学术侧互证|平台三型分治|预测变量结构不同|主指标应侧重转发与在看/], required: [/已撤回/, /仍需直接证据/, /按作品目标/, /不能唯一代表一种心理意图/] },
  { articleId: "topic-gate", sectionId: "q1", forbidden: [/按平台类型预设主指标/], required: [/心理动机一一对应/, /下沉也不能由审美风格推断/] },
  { articleId: "platform-contract", sectionId: "howto", forbidden: [/按账号策略匹配分型/], required: [/不用固定类型代替核验/, /证据范围相符/, /AC-16 来源状态/] },
  { articleId: "vertical-methods", sectionId: "m-comments", forbidden: [/5–8 条|前 50|50 条评论|是这个垂域的需求证据|只出现一次.*不入结论/], required: [/自我选择/, /不能单独证明稳定需求/, /不设跨垂域通用/] }
];

for (const boundary of propagationBoundaries) {
  const text = consumerText(boundary.articleId, boundary.sectionId);
  for (const pattern of boundary.forbidden) assert.doesNotMatch(text, pattern, boundary.articleId + "." + boundary.sectionId + " reintroduced a withdrawn claim");
  for (const pattern of boundary.required) assert.match(text, pattern, boundary.articleId + "." + boundary.sectionId + " lost its evidence boundary");
}

const baijiaChange = articles.find(article => article.id === "baijiahao")?.sections.find(section => section.id === "change");
assert.ok(baijiaChange, "Baijiahao entrance-change section must remain available");
assert.doesNotMatch(baijiaChange.title + baijiaChange.html, /2026-09-22/, "An unverified migration date must not return");
assert.match(baijiaChange.html, /2026-05-26/, "The official announcement date must remain traceable");
assert.match(baijiaChange.html, /二手报道/);
assert.match(baijiaChange.html, /待核/);

const requiredConsumers = [
  ["M29-SEARCH-REC-001", "cross-mech", "searchfeed"],
  ["M29-SEARCH-REC-001", "xhs", "papers"],
  ["M29-SEARCH-REC-001", "douyin", "searchfeed"],
  ["M29-SEARCH-REC-001", "platform-contract", "howto"],
  ["M29-SEARCH-REC-001", "hyp-m", "m3"],
  ["M29-SEARCH-REC-001", "hyp-l", "l2"],
  ["C2-DEMAND-SIGNAL-001", "vertical-methods", "m-comments"],
  ["C2-DEMAND-SIGNAL-001", "vertical", "demand"],
  ["C2-DEMAND-SIGNAL-001", "hyp-c", "c1"],
  ["AC16-SOCIAL-CHAIN-001", "cross-mech", "types"],
  ["AC16-SOCIAL-CHAIN-001", "wechat", "typology"],
  ["AC16-SOCIAL-CHAIN-001", "lib-academic", "china"],
  ["AC16-SOCIAL-CHAIN-001", "platform-contract", "howto"],
  ["D17-INTERACTION-INTENT-001", "cross-mech", "types"],
  ["D17-INTERACTION-INTENT-001", "wechat", "typology"],
  ["D17-INTERACTION-INTENT-001", "topic-gate", "q1"]
];
for (const [claimId, articleId, sectionId] of requiredConsumers) {
  const claim = registry.claims.find(item => item.id === claimId);
  assert.ok(claim, "Missing correction claim " + claimId);
  assert.ok(claim.consumers.some(consumer => consumer.kind === "article" && consumer.articleId === articleId && consumer.sectionIds.includes(sectionId)), "Missing consumer map " + claimId + " -> " + articleId + "." + sectionId);
}

const consumerCount = registry.claims.reduce((total, claim) => total + claim.consumers.length, 0);
console.log(`Claim checks passed: ${registry.claims.length} registered claims, ${consumerCount} declared consumers; required correction mappings and text/date regression guards pass.`);
