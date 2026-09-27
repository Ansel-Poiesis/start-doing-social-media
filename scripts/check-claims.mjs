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

const consumerCount = registry.claims.reduce((total, claim) => total + claim.consumers.length, 0);
console.log(`Claim checks passed: ${registry.claims.length} registered claims, ${consumerCount} declared consumers; missing article/card/protocol/skill propagation is rejected.`);
