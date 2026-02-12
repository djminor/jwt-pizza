import { test, expect } from "playwright-test-coverage";
import { Page } from "@playwright/test";
import { Role, User } from "../src/service/pizzaService";

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;

  // Track stores in a local variable so the UI updates dynamically during the test
  const dynamicStores = [
    { id: 4, name: 'Lehi' },
    { id: 5, name: 'Springville' }
  ];

  const validUsers: Record<string, User> = {
    'd@jwt.com': {
      id: '3',
      name: 'Kai Chen',
      email: 'd@jwt.com',
      password: 'a',
      roles: [{ role: Role.Diner }]
    },
    'a@jwt.com': {
      id: '1',
      name: 'Admin User',
      email: 'a@jwt.com',
      password: 'admin',
      roles: [{ role: Role.Admin }]
    },
    'f@jwt.com': {
      id: '2',
      name: 'Franchise Owner',
      email: 'f@jwt.com',
      password: 'franchisee',
      roles: [{ role: Role.Franchisee }]
    }
  };

  // --- Auth & User Mocking ---
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    
    if (method === 'DELETE') {
      loggedInUser = undefined;
      return route.fulfill({ json: { message: 'logout successful' } });
    }

    const payload = route.request().postDataJSON();
    if (!payload || !payload.email) {
      return route.fulfill({ status: 400, json: { message: 'Missing credentials' } });
    }

    if (method === 'POST' && payload.name) {
      loggedInUser = {
        id: '99',
        name: payload.name,
        email: payload.email,
        roles: [{ role: Role.Diner }]
      };
      return route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
    }

    const user = validUsers[payload.email];
    if (!user || user.password !== payload.password) {
      return route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
    }

    loggedInUser = user;
    await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
  });

  await page.route('*/**/api/user/me', async (route) => {
    if (!loggedInUser) {
      return route.fulfill({ status: 401, json: { message: 'Not logged in' } });
    }
    await route.fulfill({ json: loggedInUser });
  });

  // --- Menu Mocking ---
  await page.route('*/**/api/order/menu', async (route) => {
    await route.fulfill({
      json: [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
      ]
    });
  });

  // --- Franchise & Store Mocking ---
  
  // Handle Franchise GET (List) and Store POST (Creation)
  await page.route(/\/api\/franchise(\/.*)?$/, async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    // POST: Create a new store inside a franchise
    if (method === 'POST' && url.includes('/store')) {
      const payload = route.request().postDataJSON();
      const newStore = { 
        id: Math.floor(Math.random() * 10000), 
        name: payload.name,
        totalRevenue: 0 
      };
      
      dynamicStores.push(newStore);
      return route.fulfill({ status: 201, json: newStore });
    }

    // GET: Fetch franchises (Admin view or Franchisee view)
    if (method === 'GET') {
      return route.fulfill({
        json: [
          { 
            id: 2, 
            name: 'LotaPizza', 
            admins: [{ email: 'f@jwt.com', id: '2', name: 'Franchise Owner' }],
            stores: dynamicStores 
          },
          { 
            id: 3, 
            name: 'PizzaCorp', 
            admins: [],
            stores: [{ id: 7, name: 'Spanish Fork' }] 
          }
        ]
      });
    }

    await route.continue();
  });

  // --- Multi-Method Order Mocking ---
  await page.route('*/**/api/order', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        json: {
          dinerId: loggedInUser?.id || '3',
          orders: [{ id: 1, menuId: 1, storeId: 4, date: '2024-05-20' }],
          page: 1
        }
      });
    } else if (method === 'POST') {
      const orderReq = route.request().postDataJSON();
      await route.fulfill({
        json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' }
      });
    }
  });

  await page.goto('/');
}
  
  test('login', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
  
    await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  });
  
  test('purchase with login', async ({ page }) => {
    await basicInit(page);
  
    // Go to order page
    await page.getByRole('button', { name: 'Order now' }).click();
  
    // Create order
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
  
    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
  
    // Pay
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await expect(page.locator('tbody')).toContainText('Pepperoni');
    await expect(page.locator('tfoot')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Pay now' }).click();
  
    // Check balance
    await expect(page.getByText('0.008')).toBeVisible();
  });

  test('logout removes user session', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify Logged In
    await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();

    // Logout
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('invalid login does not navigate', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('wrong@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('bad');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('normal user cannot access admin dashboard', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.goto('/admin-dashboard');
    await expect(page.getByRole('main')).toContainText('Oops');
  });

  test('diner can view their own dashboard', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'KC' }).click();
    await expect(page).toHaveURL(/\/diner-dashboard$/);
  });

  test('docs page loads correctly', async ({ page }) => {
    await basicInit(page);
    await page.goto('/docs');
    await expect(page.getByRole('main')).toContainText('JWT Pizza API');
  });

  test('about page loads correctly', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('main')).toContainText('The secret sauce');
    await expect(page).toHaveURL(/\/about$/);
  });

  test('history page loads correctly', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'History'}).click();
    await expect(page.getByRole('main')).toContainText('Mama Rucci, my my');
    await expect(page).toHaveURL(/\/history$/);
  });

  test('admin dashboard loads correctly', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.locator('h2')).toContainText('Mama Ricci\'s kitchen');
    await expect(page).toHaveURL(/\/admin-dashboard$/);
  });

  test('register new user', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('New User');
    await page.getByRole('textbox', {name: 'Email'}).fill('new@jwt.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('newpassword');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  });

  test('admin can create franchise', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await page.getByRole('textbox', { name: 'franchise name' }).fill('Test Franchise');
    await page.getByRole('textbox', { name: 'franchisee admin email'}).fill('f@jwt.com');
    await page.getByRole('button', { name: 'Create' }).click();
  });

  test('franchisee can view their dashboard', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('list')).toContainText('franchise-dashboard');
  });

  test('franchisee can open new stores', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
    await page.getByRole('button', { name: 'Create store' }).click();
    await page.getByRole('textbox', { name: 'store name' }).click();
    await page.getByRole('textbox', { name: 'store name' }).fill('beststore');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('tbody')).toContainText('beststore');
  });

  test('user cannot access franchisee dashboard', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('t@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('test');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('main')).toContainText('So you want a piece of the pie?');
  });



