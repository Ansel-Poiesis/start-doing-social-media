import { expect, test } from '@playwright/test';
import { articleById, readingIds } from '../../content.js';

test('每篇文章可直达，导航与本页目录指向有效内容', async ({ page }) => {
  await page.goto('/#/home');
  const navigationLinks = page.locator('#chapters .chapter-link');
  await expect(navigationLinks).toHaveCount(readingIds.length);

  for (const id of readingIds) {
    await page.goto(`/#/${id}`);
    await expect(page.locator('#main h1')).toHaveText(articleById[id].title);
    await expect(page.locator(`#chapters .chapter-link[data-chapter="${id}"]`))
      .toHaveAttribute('aria-current', 'page');

    const brokenAnchors = await page.locator('#page-toc a[data-section], .inline-toc a[data-section]')
      .evaluateAll(links => links
        .filter(link => !document.getElementById(link.dataset.section))
        .map(link => `${link.getAttribute('href')} (${link.textContent.trim()})`));
    expect(brokenAnchors, `${id} 包含无效目录锚点`).toEqual([]);
  }
});

test('键盘可以跳过导航并把焦点移到正文', async ({ page }) => {
  await page.goto('/#/profile');
  await page.keyboard.press('Tab');
  const skipLink = page.locator('.skip-link');
  await expect(skipLink).toBeFocused();
  expect(await skipLink.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);

  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page).toHaveURL(/#\/profile$/);
  await expect(page.locator('#main h1')).toBeVisible();
});

test('首页与未知路由清空本页目录并给出明确状态', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.locator('#main #home-title')).toBeVisible();
  await expect(page.locator('#page-toc')).toHaveClass(/is-empty/);
  await expect(page.locator('#page-toc a')).toHaveCount(0);

  await page.goto('/#/not-a-real-article');
  await expect(page.locator('#main h1')).toHaveText('没有找到这篇内容');
  await expect(page.locator('#page-toc')).toHaveClass(/is-empty/);
  await expect(page.locator('#page-toc a')).toHaveCount(0);
});

test('深浅主题切换后状态与选择都能持久化', async ({ page }) => {
  await page.goto('/#/home');
  const toggle = page.locator('#theme-toggle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const lightCanvas = await page.locator('html')
    .evaluate(element => getComputedStyle(element).getPropertyValue('--canvas').trim());

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const darkCanvas = await page.locator('html')
    .evaluate(element => getComputedStyle(element).getPropertyValue('--canvas').trim());
  expect(darkCanvas).not.toBe(lightCanvas);
  expect(await page.evaluate(() => localStorage.getItem('start-media-theme-v1'))).toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('start-media-theme-v1'))).toBe('light');
});

async function openFirstWideTable(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of readingIds) {
    await page.goto(`/#/${id}`);
    const index = await page.locator('#main .table-scroll').evaluateAll(regions => regions.findIndex(region =>
      region.scrollWidth > region.clientWidth + 1 &&
      region.querySelectorAll('thead th').length >= 3 &&
      region.querySelectorAll('tbody tr').length >= 3));
    if (index >= 0) return { id, index };
  }
  throw new Error('未找到至少三列、三行且需要横向滚动的文章表格');
}

for (const theme of ['light', 'dark']) {
  test(`390px 窄屏的长表格在${theme === 'light' ? '浅色' : '深色'}主题可用键盘滚动`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('start-media-theme-v1', value), theme);
    const { index } = await openFirstWideTable(page);
    const region = page.locator('#main .table-scroll').nth(index);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(region).toHaveAttribute('role', 'group');
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(region).toHaveAttribute('aria-label', /可横向滚动/);

    const initial = await region.evaluate(element => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(initial.scrollWidth).toBeGreaterThan(initial.clientWidth);
    expect(initial.pageWidth).toBeLessThanOrEqual(initial.viewportWidth);

    await page.evaluate(() => document.activeElement?.blur());
    let reachedByTab = false;
    for (let index = 0; index < 120; index += 1) {
      await page.keyboard.press('Tab');
      if (await region.evaluate(element => document.activeElement === element)) {
        reachedByTab = true;
        break;
      }
    }
    expect(reachedByTab, '表格滚动区域应能通过顺序键盘导航到达').toBe(true);
    const focusStyle = await region.evaluate(element => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focusStyle.outlineStyle).not.toBe('none');
    expect(parseFloat(focusStyle.outlineWidth)).toBeGreaterThan(0);

    for (let step = 0; step < 30; step += 1) {
      await page.keyboard.press('ArrowRight');
      const atEnd = await region.evaluate(element => element.scrollLeft + element.clientWidth >= element.scrollWidth - 1);
      if (atEnd) break;
    }
    const final = await region.evaluate(element => ({
      scrollLeft: element.scrollLeft,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(final.scrollLeft).toBeGreaterThan(0);
    expect(final.scrollLeft + final.clientWidth).toBeGreaterThanOrEqual(final.scrollWidth - 1);
    expect(final.pageWidth).toBeLessThanOrEqual(final.viewportWidth);
  });
}
