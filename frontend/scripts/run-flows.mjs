import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:4300';

function normalizeNumber(text) {
  const raw = (text || '').trim().toUpperCase();
  if (!raw) return 0;
  if (raw.endsWith('M')) return Number.parseFloat(raw.slice(0, -1)) * 1_000_000;
  if (raw.endsWith('K')) return Number.parseFloat(raw.slice(0, -1)) * 1_000;
  const digits = raw.replace(/[^0-9.]/g, '');
  return Number.parseFloat(digits || '0');
}

async function maybeLogout(page) {
  const avatar = page.locator('.avatar-btn');
  if (await avatar.count()) {
    await avatar.first().click({ timeout: 3000 }).catch(() => {});
    const logoutBtn = page.getByRole('button', { name: 'Log out' });
    if (await logoutBtn.count()) {
      await logoutBtn.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];

  const record = (flow, ok, detail) => results.push({ flow, ok, detail });

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    const uniq = Date.now();
    const regUser = `qa_user_${uniq}`;
    const regEmail = `${regUser}@mado.demo`;
    const regPass = 'QATest!234';

    // 1) Register -> login -> avatar in navbar
    try {
      await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
      await page.locator('input[formcontrolname="username"]').fill(regUser);
      await page.locator('input[formcontrolname="displayName"]').fill(`QA ${uniq}`);
      await page.locator('input[formcontrolname="email"]').fill(regEmail);
      await page.locator('input[formcontrolname="password"]').fill(regPass);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });
      await page.locator('.avatar-btn').waitFor({ state: 'visible', timeout: 10000 });

      await maybeLogout(page);
      await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
      await page.locator('input[formcontrolname="email"]').fill(regEmail);
      await page.locator('input[formcontrolname="password"]').fill(regPass);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });
      await page.locator('.avatar-btn').waitFor({ state: 'visible', timeout: 10000 });

      record(1, true, 'Registered, logged in, and avatar button is visible in navbar.');
    } catch (e) {
      record(1, false, `Failed register/login/avatar flow: ${e.message}`);
    }

    // 2) Click channel -> channel page + video player
    try {
      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      await page.locator('a[href=\"/pixelarena\"]').first().click();
      await page.waitForURL(/http:\/\/127\.0\.0\.1:4300\/[^/?#]+$/, { timeout: 12000 });
      const hasVideo = await page.locator('mado-video-player').count();
      if (!hasVideo) throw new Error('Channel page opened, but video player component not found.');
      record(2, true, 'Channel page opened and video player component is present.');
    } catch (e) {
      record(2, false, `Failed channel/video flow: ${e.message}`);
    }

    // 3) Send chat message -> appears realtime
    try {
      const msg = `qa-msg-${Date.now()}`;
      const input = page.getByPlaceholder('Send a message…');
      await input.fill(msg);
      await page.getByRole('button', { name: 'Chat' }).click();
      await page.locator('.line .text', { hasText: msg }).first().waitFor({ timeout: 12000 });
      record(3, true, 'Sent chat message and it appeared in chat feed.');
    } catch (e) {
      record(3, false, `Failed realtime chat flow: ${e.message}`);
    }

    // 4) /wallet buy package -> balance updates
    try {
      await page.goto(`${baseUrl}/wallet`, { waitUntil: 'domcontentloaded' });
      const beforeText = await page.locator('.amt').first().innerText();
      const before = normalizeNumber(beforeText);

      await page.locator('.tier').first().click();
      await page.locator('.modal').waitFor({ state: 'visible', timeout: 10000 });
      await page.getByRole('button', { name: 'Buy Now' }).click();

      const successToast = page.locator('.toast-success');
      const cardError = page.locator('.card-error');
      const state = await Promise.race([
        successToast.waitFor({ timeout: 12000 }).then(() => 'success').catch(() => null),
        cardError.waitFor({ timeout: 12000 }).then(() => 'card_error').catch(() => null)
      ]);

      if (state === 'success') {
        await page.waitForTimeout(2000);
        const afterText = await page.locator('.amt').first().innerText();
        const after = normalizeNumber(afterText);
        if (after <= before) {
          throw new Error(`Payment reported success but balance did not increase (before=${beforeText}, after=${afterText}).`);
        }
        record(4, true, `Coins purchase succeeded and balance increased (${beforeText} -> ${afterText}).`);
      } else {
        const errMsg = await cardError.first().innerText().catch(() => 'Unknown wallet payment error.');
        throw new Error(`Wallet purchase did not complete: ${errMsg}`);
      }
    } catch (e) {
      record(4, false, `Failed wallet purchase flow: ${e.message}`);
    }

    // 5) Subscribe click opens payment modal
    try {
      await page.goto(`${baseUrl}/pixelarena`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Subscribe' }).click({ timeout: 10000 });
      const subModal = page.locator('.sub-modal');
      await subModal.waitFor({ state: 'visible', timeout: 8000 });
      record(5, true, 'Subscribe button opens payment modal.');
    } catch (e) {
      record(5, false, `Failed subscribe modal flow: ${e.message}`);
    }

    // 6) /dashboard stream key visible (seed streamer)
    try {
      await maybeLogout(page);
      await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
      await page.locator('input[formcontrolname="email"]').fill('mo_irlgta@mado.demo');
      await page.locator('input[formcontrolname="password"]').fill('MadoDemo!24');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });

      await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.locator('text=Stream key:').first().waitFor({ timeout: 10000 });
      const streamKey = (await page.locator('code').nth(1).innerText()).trim();
      if (!streamKey) throw new Error('Stream key code is empty.');
      record(6, true, `Dashboard stream key is visible (${streamKey}).`);
    } catch (e) {
      record(6, false, `Failed dashboard stream-key flow: ${e.message}`);
    }

    // 7) Search channel -> dropdown appears
    try {
      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      const search = page.locator('.search-pill');
      await search.fill('mo_');
      await page.locator('.search-dropdown .search-result').first().waitFor({ timeout: 10000 });
      record(7, true, 'Search dropdown appears with channel results.');
    } catch (e) {
      record(7, false, `Failed search dropdown flow: ${e.message}`);
    }

    // 8) /leaderboard total views shows real numbers
    try {
      await page.goto(`${baseUrl}/leaderboard`, { waitUntil: 'domcontentloaded' });
      await page.locator('.lb-row').first().waitFor({ timeout: 12000 });
      const label = ((await page.locator('.lb-row .stat-label').first().innerText()) || '').toLowerCase();
      const valueText = await page.locator('.lb-row .stat-value').first().innerText();
      const value = normalizeNumber(valueText);
      if (!label.includes('total views')) throw new Error(`Expected 'total views' label, got '${label}'.`);
      if (!Number.isFinite(value) || value <= 0) throw new Error(`Total views is not a positive real value: '${valueText}'.`);
      record(8, true, `Leaderboard shows total views value '${valueText}' on top row.`);
    } catch (e) {
      record(8, false, `Failed leaderboard views flow: ${e.message}`);
    }
  } finally {
    await browser.close();
  }

  const failures = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ results, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
