import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Order' }).click();
    await page.getByRole('combobox').selectOption('1');
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await page.getByRole('link', { name: 'Image Description Margarita' }).click();
    await page.getByRole('link', { name: 'Image Description Crusty A' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('t@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('test');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('button', { name: 'Pay now' }).click();
});

test('login with wrong password should fail', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('t@jwt.com');
    await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
    await page.getByRole('textbox', { name: 'Password' }).fill('terst');
    await page.getByRole('textbox', { name: 'Password' }).press('Enter');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByText('{"code":404,"message":"').click();
});

test('logout', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('t@jwt.com');
    await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
    await page.getByRole('textbox', { name: 'Password' }).fill('test');
    await page.getByRole('textbox', { name: 'Password' }).press('Enter');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.locator('#navbar-dark')).toContainText('Register');
});

test('register user', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('blup');
    await page.getByRole('textbox', { name: 'Email address' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('blup@blup.blup');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('blup');
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByRole('link', { name: 'b', exact: true }).click();
    await page.getByText('blup', { exact: true }).click();
    await page.getByText('blup@blup.blup').click();
    await page.getByText('diner', { exact: true }).click();
});

test('logging in as admin gives access to admin dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('link', { name: 'admin-dashboard' }).click();
});

test('user can create stores', async ({ page }) => {});

test('about page loads', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('main')).toContainText('The secret sauce');
});



test('admin can create franchises', async ({ page }) => {
});

test('admin can close franchises', async ({ page }) => {});