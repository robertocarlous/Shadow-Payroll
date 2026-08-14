import { chromium } from 'playwright-core';

const FAUCET_URL = process.env.FAUCET_URL ?? 'https://midnight-tmnight-preview.nethermind.dev';
const RECIPIENT = process.env.FAUCET_RECIPIENT;
const HEADLESS = process.env.FAUCET_HEADLESS === '1';

if (!RECIPIENT) {
  console.error('Set FAUCET_RECIPIENT to the wallet address to fund.');
  process.exit(2);
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: HEADLESS,
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'en-US',
});
const page = await context.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') console.log(`[console.${msg.type()}] ${msg.text().slice(0, 300)}`);
});
page.on('response', async (res) => {
  if (res.url().includes('/api/drips')) {
    let body = '';
    try {
      body = (await res.text()).slice(0, 500);
    } catch {
      /* ignore */
    }
    console.log(`[response] ${res.status()} ${res.url()}`);
    console.log(`[response body] ${body}`);
  }
});

try {
  console.log('navigating to faucet...');
  await page.goto(FAUCET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const input = page.getByPlaceholder('Enter your wallet address');
  await input.waitFor({ state: 'visible', timeout: 20000 });
  await input.fill(RECIPIENT);
  console.log('address filled');

  await page.waitForTimeout(1500);

  let token = '';
  for (let i = 0; i < 180; i++) {
    token = await page
      .locator('input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]')
      .first()
      .inputValue()
      .catch(() => '');
    if (token && token.length > 20) break;

    const frames = page.frames().filter((f) => f.url().includes('challenges.cloudflare.com'));
    if (i % 3 === 0 && frames.length > 0) {
      for (const frame of frames) {
        try {
          const cb = frame.locator('#challenge-stage input[type="checkbox"], #challenge-stage .ctp-checkbox, .ctp-checkbox, input#checkbox').first();
          if ((await cb.count().catch(() => 0)) > 0) {
            await cb.click({ timeout: 1500 }).catch(() => {});
            console.log('clicked turnstile checkbox');
          }
        } catch {
          /* frame not ready */
        }
      }
    }
    if (i % 10 === 0) console.log(`waiting for turnstile token (${i + 1}/180)...`);
    await page.waitForTimeout(1000);
  }
  if (!token || token.length <= 20) {
    await page.screenshot({ path: '/tmp/faucet-turnstile-blocked.png' });
    console.error('No Turnstile token minted (likely interactive challenge). Screenshot: /tmp/faucet-turnstile-blocked.png');
    await browser.close();
    process.exit(3);
  }
  console.log(`turnstile token minted (${token.length} chars)`);

  const btn = page
    .locator('button')
    .filter({ hasText: /Request|Drip|Get tNIGHT/i })
    .first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  console.log('clicking submit...');
  await btn.click();

  const dripResponse = page.waitForResponse(
    (res) => res.url().includes('/api/drips') && res.request().method() === 'POST',
    { timeout: 30000 },
  ).catch(() => null);
  await dripResponse;
  await page.waitForTimeout(4000);

  await page.screenshot({ path: '/tmp/faucet-result.png' });
  console.log('screenshot: /tmp/faucet-result.png');
} finally {
  await browser.close();
}
