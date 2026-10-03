import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const template = JSON.parse(fs.readFileSync('public/templates/guide.bundle.json', 'utf8'));
const jsonFile = (data: unknown) => ({ name: 'guide.bundle.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });

test('playback pauses motion, reveals items in order and resumes', async ({ page }) => {
  await page.goto('/#/guide/steps');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  const timeline = page.getByRole('slider', { name: '再生位置' });
  await timeline.fill('2000');
  await expect(page.locator('.slide-items .slide-item').first()).toHaveAttribute('aria-hidden', 'true');
  const clock = await timeline.inputValue();
  const titleOpacity = await page.locator('.slide-title').evaluate(element => getComputedStyle(element.parentElement!).opacity);
  await page.waitForTimeout(400);
  expect(await timeline.inputValue()).toBe(clock);
  expect(await page.locator('.slide-title').evaluate(element => getComputedStyle(element.parentElement!).opacity)).toBe(titleOpacity);
  await timeline.fill('6000');
  await expect(page.locator('.slide-items .slide-item').nth(0)).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.slide-items .slide-item').nth(1)).toHaveAttribute('aria-hidden', 'true');
  await timeline.fill('10000');
  await expect(page.locator('.slide-items .slide-item').nth(2)).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(10000);
});

test('automatic playback advances, then pauses at a document action', async ({ page }) => {
  await page.goto('/#/guide/steps');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  const timeline = page.getByRole('slider', { name: '再生位置' });
  await expect.poll(async () => Number(await timeline.getAttribute('max'))).toBeGreaterThan(16500);
  await timeline.fill(String(Math.floor(Number(await timeline.getAttribute('max')) / 50) * 50 - 100));
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect(page).toHaveURL(/guide\/documents$/);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate((element: HTMLAudioElement) => element.readyState)).toBeGreaterThan(0);
  await timeline.fill(String(Math.floor(Number(await timeline.getAttribute('max')) / 50) * 50 - 100));
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect(page.getByRole('button', { name: '再生', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/guide\/documents$/);
  await expect(page.getByRole('link', { name: '契約書・資料を見る', exact: true })).toBeVisible();
});

test('narration pauses and switches to audio in the selected language', async ({ page }) => {
  await page.goto('/#/guide/welcome');
  const audio = page.locator('audio');
  await page.getByRole('button', { name: '音声をオン', exact: true }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
  const before = await audio.evaluate((element: HTMLAudioElement) => element.currentTime);
  await page.waitForTimeout(300);
  expect(await audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeCloseTo(before, 1);
  await page.getByRole('combobox').selectOption('en');
  await expect(audio).toHaveAttribute('src', /\/en\/welcome\.mp3$/);
  await expect(page).toHaveURL(/guide\/welcome$/);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false);
  await page.getByRole('button', { name: 'Replay this slide', exact: true }).click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeLessThan(1);
});

test('language switches preserve the slide and documents return after refresh', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/guide/documents');
  await expect(page.locator('article[data-slide-id="documents"]')).toBeVisible();
  await page.getByRole('combobox').selectOption('en');
  await expect(page).toHaveURL(/guide\/documents$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Review your contract');
  await page.getByRole('link', { name: 'View contract and documents', exact: true }).click();
  await expect(page).toHaveURL(/documents\?from=documents$/);
  await page.reload();
  await page.getByRole('link', { name: 'Back to the guide', exact: true }).first().click();
  await expect(page.locator('article[data-slide-id="documents"]')).toBeVisible();
  for (const lang of ['ne', 'vi', 'ja']) { await page.getByRole('combobox').selectOption(lang); await expect(page.locator('html')).toHaveAttribute('lang', lang); await expect(page).toHaveURL(/guide\/documents$/); }
  expect(errors).toEqual([]);
});

test('navigation, contents, browser back and completion work', async ({ page }, info) => {
  await page.goto('/'); await page.getByRole('link', { name: 'スライド動画を見る', exact: true }).click();
  await expect(page.getByRole('button', { name: '前へ', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '次へ', exact: true }).click();
  await expect(page.locator('article[data-slide-id="language"]')).toBeVisible();
  await page.goBack(); await expect(page.locator('article[data-slide-id="welcome"]')).toBeVisible();
  if (info.project.name === 'mobile') await page.getByRole('button', { name: '目次', exact: true }).click();
  await page.getByRole('button', { name: /05.*わからない/ }).click();
  await expect(page.locator('article[data-slide-id="complete"]')).toBeVisible();
  await page.getByRole('link', { name: '完了', exact: true }).click(); await expect(page).toHaveURL(/#\/complete$/);
});

test('keyboard and swipe navigation advance exactly one slide', async ({ page }) => {
  await page.goto('/#/guide/welcome'); await expect(page.locator('article[data-slide-id="welcome"]')).toBeVisible();
  await page.locator('main').focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('article[data-slide-id="language"]')).toBeVisible();
  await page.locator('.deck-frame').evaluate(frame => {
    const make = (x: number) => new Touch({ identifier: 1, target: frame, clientX: x, clientY: 250 });
    frame.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [make(280)], changedTouches: [make(280)] }));
    frame.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [make(100)] }));
  });
  await expect(page).toHaveURL(/guide\/steps$/); await expect(page.locator('article[data-slide-id="steps"]')).toBeVisible();
});

test('valid JSON imports, persists, exports and resets', async ({ page }) => {
  const custom = structuredClone(template); custom.guide.id = 'custom'; custom.locales.ja['guide.title'] = '投入テスト'; custom.guide.slides = [custom.guide.slides[0],custom.guide.slides[3]];
  await page.goto('/#/studio'); await page.locator('input[type="file"][accept="application/json,.json"]').setInputFiles(jsonFile(custom));
  await expect(page).toHaveURL(/guide\/welcome$/); await expect(page).toHaveTitle(/投入テスト/);
  await page.reload(); await expect(page).toHaveTitle(/投入テスト/);
  await page.goto('/#/studio'); const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: '設定JSONを書き出す', exact: true }).click();
  const download = await downloadPromise; const stream = await download.createReadStream(); const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk); const exported = JSON.parse(Buffer.concat(chunks).toString()); expect(exported.guide.id).toBe('custom'); expect(exported.guide.slides).toHaveLength(2);
  page.on('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'サンプルに戻す', exact: true }).click(); await expect(page.getByRole('heading', { name: '契約前のご案内', exact: true })).toBeVisible();
});

test('invalid JSON and unsafe links preserve existing content', async ({ page }) => {
  await page.goto('/#/studio'); const invalid = structuredClone(template); invalid.guide.documents[0].href = 'javascript:alert(1)';
  await page.locator('input[accept="application/json,.json"]').setInputFiles(jsonFile(invalid)); await expect(page.getByRole('alert')).toContainText('読み込めませんでした'); await expect(page.getByRole('heading', { name: '契約前のご案内', exact: true })).toBeVisible();
  await page.locator('input[accept="application/json,.json"]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') }); await expect(page.getByRole('alert')).toBeVisible();
});

test('PDF imports as an image slide and persists after reload', async ({ page }) => {
  await page.goto('/#/studio'); await page.locator('input[multiple]').setInputFiles('public/documents/sample.pdf');
  await expect(page).toHaveURL(/guide\/page-1$/, { timeout: 20000 }); await expect(page.locator('.image-button img')).toBeVisible();
  await expect(page.locator('.image-button img')).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await page.reload(); await expect(page.locator('.image-button img')).toBeVisible();
  await page.getByRole('button', { name: '画像を拡大', exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('image imports follow numeric filename order', async ({ page }) => {
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64');
  await page.goto('/#/studio'); await page.locator('input[multiple]').setInputFiles([{ name: '10.png', mimeType: 'image/png', buffer },{ name: '2.png', mimeType: 'image/png', buffer }]);
  await expect(page.locator('.slide-title')).toHaveText('2.png'); await page.getByRole('button', { name: '次へ', exact: true }).click(); await expect(page.locator('.slide-title')).toHaveText('10.png');
});

test('pages fit the viewport and the sample document is a real PDF', async ({ page, request }) => {
  for (const route of ['/', '/#/guide/steps', '/#/documents', '/#/studio']) {
    await page.goto(route); await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (route.includes('/guide/') && ((await page.viewportSize())!.width < 760 || (await page.viewportSize())!.height <= 500)) {
      await expect(page.locator('.player-navigation')).toBeVisible();
      expect(await page.locator('.player-navigation').evaluate(element => element.getBoundingClientRect().bottom <= window.innerHeight)).toBe(true);
    }
  }
  const response = await request.get('/documents/sample.pdf'); expect(response.ok()).toBe(true); expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
});
