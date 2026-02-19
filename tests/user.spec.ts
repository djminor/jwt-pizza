import { test, expect } from 'playwright-test-coverage';
import { Page } from "@playwright/test";
import { Role, User } from "../src/service/pizzaService";

async function basicInit(page: Page) {
    let loggedInUser: User | undefined;
    
    // Track stores in a variable so 'Create Store' actually shows up in the UI
    const dynamicStores = [
      { id: 4, name: 'Lehi' },
      { id: 5, name: 'Springville' },
      { id: 6, name: 'American Fork' },
    ];
  
    const validUsers: Record<string, User> = { 
      'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
      'a@jwt.com': { id: '1', name: 'Admin User', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
      'f@jwt.com': { id: '2', name: 'Franchise Owner', email: 'f@jwt.com', password: 'franchisee', roles: [{ role: Role.Franchisee }] }
    };
  
    // --- Auth Mock ---
    await page.route('*/**/api/auth', async (route) => {
      const method = route.request().method();
      
      // Support Logout
      if (method === 'DELETE') {
        loggedInUser = undefined;
        return route.fulfill({ json: { message: 'logout successful' } });
      }
  
      const loginReq = route.request().postDataJSON();
      
      // Support Registration (POST)
      if (method === 'POST' && loginReq.name) {
        const newUser: User = { id: `${Math.floor(100 + Math.random() * 900)}`, name: loginReq.name, email: loginReq.email, password: loginReq.password, roles: [{ role: Role.Diner }] };
        // persist the registered user so subsequent login works in the mock
        validUsers[newUser.email!] = newUser;
        loggedInUser = newUser;
        return route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
      }
  
      // Support Login (PUT)
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        return route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      }
      loggedInUser = user;
      await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
    });
  
    // --- User Me Mock ---
    await page.route('*/**/api/user/me', async (route) => {
      await route.fulfill({ json: loggedInUser });
    });

    // --- User Update Mock ---
    await page.route(/\/api\/user(\/.*|\?.*)?$/, async (route) => {
      const method = route.request().method();
      // handle update (PUT /api/user/:id)
      if (method === 'PUT') {
        const payload = route.request().postDataJSON() || {};
        // merge with existing user so we don't drop the password (or other fields)
        const existing = loggedInUser || (payload.email && validUsers[payload.email]) || {};
        const merged = { ...existing, ...payload } as User;
        // preserve existing password if payload didn't include one
        if (!payload.password && (existing as any).password) {
          (merged as any).password = (existing as any).password;
        }
        loggedInUser = merged;
        if (merged?.email) validUsers[merged.email!] = merged;
        return route.fulfill({ json: { user: merged, token: 'abcdef' } });
      }
      // fallback for other user calls
      await route.fulfill({ json: loggedInUser || null });
    });
  
    // --- Menu Mock ---
    await page.route('*/**/api/order/menu', async (route) => {
      await route.fulfill({ json: [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
      ]});
    });
  
    // --- Franchise Mock (Fixed for both Order page & Dashboard) ---
    await page.route(/\/api\/franchise(\/.*|\?.*)?$/, async (route) => {
      const method = route.request().method();
      const url = route.request().url();
  
      // Handle Store Creation
      if (method === 'POST' && url.includes('/store')) {
        const payload = route.request().postDataJSON();
        const newStore = { id: Math.floor(Math.random() * 10000), name: payload.name, totalRevenue: 0 };
        dynamicStores.push(newStore);
        return route.fulfill({ status: 201, json: newStore });
      }
  
      // Handle Franchise List
      const franchiseRes = {
        franchises: [
          { id: 2, name: 'LotaPizza', admins: [{email:'f@jwt.com', id:'2', name:'Owner'}], stores: dynamicStores },
          { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        ],
      };
  
      // If it's a specific user's dashboard request, the app might want the array directly
      if (url.includes('/api/franchise/') && !url.includes('/store')) {
          return route.fulfill({ json: franchiseRes.franchises });
      }
  
      await route.fulfill({ json: franchiseRes });
    });
  
    // --- Order Mock ---
    await page.route('*/**/api/order', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
          return route.fulfill({ json: { dinerId: loggedInUser?.id || '3', orders: [], page: 1 } });
      }
      const orderReq = route.request().postDataJSON();
      await route.fulfill({ json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' } });
    });
  
    await page.goto('/');
  }

test('updateUser', async ({ page }) => {
  await basicInit(page);
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });  await expect(page.getByRole('main')).toContainText('pizza diner');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('pizza dinerx');
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});