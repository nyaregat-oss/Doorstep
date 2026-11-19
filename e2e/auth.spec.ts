import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const mailboxUrl = process.env.E2E_MAILBOX_URL;
const hasAuthBackend = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && mailboxUrl);

async function readConfirmationUrl(request: APIRequestContext, email: string): Promise<string> {
  const mailbox = `${mailboxUrl}/api/v1/mailbox/${encodeURIComponent(email)}`;
  await expect.poll(async () => {
    const response = await request.get(mailbox);
    if (!response.ok()) return 0;
    const messages = await response.json();
    return Array.isArray(messages) ? messages.length : 0;
  }, { timeout: 30_000 }).toBeGreaterThan(0);

  const listing = await request.get(mailbox);
  const messages = await listing.json() as Array<{ id: string }>;
  const detailResponse = await request.get(`${mailbox}/${encodeURIComponent(messages[0].id)}`);
  expect(detailResponse.ok()).toBeTruthy();
  const detail: unknown = await detailResponse.json();
  const strings: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(detail);
  for (const body of strings) {
    const links = body.match(/https?:\/\/[^\s"'<>]+/g) || [];
    const link = links.map((candidate) => candidate.replaceAll('&amp;', '&')).find((candidate) => candidate.includes('/auth/v1/verify'));
    if (link) return link;
  }
  throw new Error('The local test mailbox did not contain a Supabase confirmation link.');
}

async function registerAndVerify(page: Page, role: 'customer' | 'provider') {
  const email = `doorstep-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto(`/register${role === 'provider' ? '?role=provider' : ''}`);
  if (role === 'provider') {
    await page.getByRole('button', { name: 'I offer a service' }).click();
    await page.getByLabel('Business name').fill('Test service business');
    await page.getByLabel('Main service').selectOption({ label: 'Plumbing' });
    await page.getByLabel('County, town, or area').fill('Nairobi');
  }
  await page.getByLabel('Full name').fill(role === 'provider' ? 'Test Provider' : 'Test Customer');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Phone (optional)').fill('+254700000111');
  await page.getByLabel('Password').fill('SafeTestPassword!2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status')).toContainText('Check your email');

  const confirmationUrl = await readConfirmationUrl(page.request, email);
  await page.goto(confirmationUrl);
  await expect(page).toHaveURL(new RegExp(`/dashboard/${role}`));
  await expect(page.getByRole('heading', { name: role === 'provider' ? 'Grow your business' : 'Your service requests' })).toBeVisible();
  return email;
}

test('registration forms expose customer and provider fields and role choice', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('button', { name: 'I need a service' })).toBeVisible();
  await expect(page.getByLabel('Full name')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.getByRole('button', { name: 'I offer a service' }).click();
  await expect(page.getByLabel('Business name')).toBeVisible();
  await expect(page.getByLabel('Main service')).toBeVisible();
  await expect(page.getByLabel('County, town, or area')).toBeVisible();
});

test('login and password reset pages use non-disclosing recovery copy', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await page.goto('/reset-password');
  await page.getByLabel('Email').fill('unknown@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'If an account matches that email' })).toBeVisible();
});

test.describe('Supabase registration and email confirmation', () => {
  test.skip(!hasAuthBackend, 'Set local Supabase URL/key and E2E_MAILBOX_URL to run real auth flows.');

  test('a customer can register, verify email, sign out, and sign back in', async ({ page }) => {
    const email = await registerAndVerify(page, 'customer');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('SafeTestPassword!2026');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Your service requests' })).toBeVisible();
  });

  test('a provider can register, verify email, and only reach the provider workspace', async ({ page }) => {
    await registerAndVerify(page, 'provider');
    await page.goto('/dashboard/customer');
    await expect(page).toHaveURL(/\/dashboard\/provider$/);
    await expect(page.getByRole('heading', { name: 'Grow your business' })).toBeVisible();
  });
});
