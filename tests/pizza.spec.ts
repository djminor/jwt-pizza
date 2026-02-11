import { test, expect } from "playwright-test-coverage";
import { Page } from "@playwright/test";
import { Role, User } from "../src/service/pizzaService";

async function basicInit(page: Page) {
    let loggedInUser: User | undefined;
    const validUsers: Record<string, User> = {
      'd@jwt.com': {
        id: '3',
        name: 'Kai Chen',
        email: 'd@jwt.com',
        password: 'a',
        roles: [{ role: Role.Diner }]
      }
    };
  
    // --- Auth & User Mocking ---
    await page.route('*/**/api/auth', async (route) => {
      const method = route.request().method();
      if (method === 'DELETE') {
        loggedInUser = undefined;
        return route.fulfill({ json: { message: 'logout successful' } });
      }
  
      const loginReq = route.request().postDataJSON();
      if (!loginReq || !loginReq.email) {
        return route.fulfill({ status: 400, json: { message: 'Missing credentials' } });
      }
  
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
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
  
    // --- Menu & Franchise Mocking ---
    await page.route('*/**/api/order/menu', async (route) => {
      await route.fulfill({
        json: [
          { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
          { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
        ]
      });
    });
  
    await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
      await route.fulfill({
        json: {
          franchises: [
            { id: 2, name: 'LotaPizza', stores: [{ id: 4, name: 'Lehi' }, { id: 5, name: 'Springville' }] },
            { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
          ]
        }
      });
    });
  
    // --- Multi-Method Order Mocking (FIXED) ---
    await page.route('*/**/api/order', async (route) => {
      const method = route.request().method();
  
      if (method === 'GET') {
        // Dashboard/History view
        await route.fulfill({
          json: {
            dinerId: loggedInUser?.id || '3',
            orders: [
              { id: 1, menuId: 1, storeId: 4, date: '2024-05-20' },
              { id: 2, menuId: 2, storeId: 7, date: '2024-05-21' }
            ],
            page: 1
          }
        });
      } else if (method === 'POST') {
        // Create Order
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



