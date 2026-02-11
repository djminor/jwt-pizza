import { test, expect } from 'playwright-test-coverage';

// Utility to generate unique identifiers to prevent collisions during parallel runs
const getRandomUser = () => {
    const id = Math.floor(Math.random() * 10000);
    return {
        name: `User${id}`,
        email: `user${id}@jwt.com`,
        password: 'password123'
    };
};

test.beforeEach(async ({ page }) => {
    // Navigate to base URL defined in playwright.config.ts
    await page.goto('/');
});

test('home page', async ({ page }) => {
    await expect(page).toHaveTitle('JWT Pizza');
});

test('login with wrong password should fail', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('t@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong-pass');
    await page.getByRole('button', { name: 'Login' }).click();
    // Using a more robust locator than just clicking the error text
    await expect(page.locator('text=/code":404/')).toBeVisible();
});

test('logout', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('t@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('test');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});

test('register user', async ({ page }) => {
    const user = getRandomUser(); // Unique data prevents 409 Conflict errors
    
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill(user.name);
    await page.getByRole('textbox', { name: 'Email address' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
    await page.getByRole('button', { name: 'Register' }).click();

    // Verify profile page details
    await page.getByRole('link', { name: 'U', exact: true }).click();
    await expect(page.getByRole('main')).toContainText(user.name);
    await expect(page.getByRole('main')).toContainText(user.email);
});

test('logging in as admin gives access to admin dashboard', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.getByRole('link', { name: 'admin-dashboard' })).toBeVisible();
});

test('admin can create franchises', async ({ page }) => {
    const franchiseName = `Pizza Palace ${Math.floor(Math.random() * 1000)}`;
    
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await page.getByRole('textbox', { name: 'franchise name' }).fill(franchiseName);
    await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('f@jwt.com');
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify the new franchise appears in the list
    await page.getByRole('textbox', { name: 'Filter franchises' }).click();
    await page.getByRole('textbox', { name: 'Filter franchises' }).fill(franchiseName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('tbody')).toContainText(franchiseName);
});

test('not found page loads', async ({ page }) => {
    await page.goto('/nonexistent');
    await expect(page.getByRole('heading')).toContainText('Oops');
});

// Static content checks
const staticPages = [
    { name: 'About', expected: 'The secret sauce' },
    { name: 'History', expected: 'Mama Rucci, my my' },
    { name: 'docs', url: '/docs', expected: 'JWT Pizza API' }
];

for (const pageInfo of staticPages) {
    test(`${pageInfo.name} page loads`, async ({ page }) => {
        if (pageInfo.url) {
            await page.goto(pageInfo.url);
        } else {
            await page.getByRole('link', { name: pageInfo.name }).click();
        }
        await expect(page.getByRole('main')).toContainText(pageInfo.expected);
    });
}