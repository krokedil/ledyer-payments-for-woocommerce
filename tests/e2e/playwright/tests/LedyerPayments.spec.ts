import { test } from '@playwright/test';

let URL = 'http://localhost/'
let userName = 'username'
let passWord = 'password'

test('cart11', async ({ page }) => {  
	const ledyerIframe = page.frameLocator('iframe');
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple Downloadable 25%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple Virtual 25%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple 25%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple 12%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple 12%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple 12%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple 12%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple 12%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple 12%”').click();
  await page.goto(`${URL}shop/`);
  await page.getByLabel('Add to cart: “Simple 12%”').click();
  await page.goto(`${URL}shop/`);  
	await page.locator('a:has-text("Variable 25%")').click();
  await page.getByLabel('Color').selectOption('Red');
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Add to cart' }).click();

  await page.goto(URL + 'checkout/');
  await page.getByText('Företagsfaktura').click();
  await page.getByRole('textbox', { name: 'First name *' }).fill('Bodil');
  await page.getByRole('textbox', { name: 'Last name *' }).fill('Andersson');
  await page.getByRole('textbox', { name: 'Company name' }).fill('Alfons kritor AB');
  await page.getByPlaceholder('Company number').fill('556158-7634');
  await page.getByRole('textbox', { name: 'Street address *' }).fill('Sveavägen 49');
  await page.getByRole('textbox', { name: 'Postcode / ZIP *' }).fill('11359');
  await page.getByRole('textbox', { name: 'Town / City *' }).fill('Stockholm');
  await page.getByLabel('Email address *').fill('bodil.andersson@alfonskritor.com');
  await page.getByLabel('Phone').fill('0700000000');
  await page.getByLabel('I have read and agree to the').check();
  await page.getByRole('button', { name: 'Place order' }).click();
	
	await ledyerIframe.locator('button:has-text("Fortsätt")').click();
	await ledyerIframe.locator('button:has-text("Slutför köp")').click();
	await page.waitForURL(/order-received/);
});

test('cart22', async ({ page }) => {
	const ledyerIframe = page.frameLocator('iframe');

	await page.goto(URL + '/wp-login.php');
	await page.getByLabel('Username or Email Address').fill(userName);
	await page.getByLabel('Password', { exact: true }).click();
	await page.getByLabel('Password', { exact: true }).fill(passWord);
	await page.getByRole('button', { name: 'Log In' }).click();

	await page.goto(`${URL}shop/`);
	await page.getByLabel('Add to cart:  “Simple Virtual/Downloadable 0%”').click();
	await page.goto(`${URL}shop/`);
	await page.getByLabel('Add to cart:  “Simple Virtual/Downloadable 25%”').click();
	await page.waitForTimeout(1000);

	await page.goto(URL + 'checkout/');
	await page.getByText('Företagsfaktura').click();
	await page.getByRole('textbox', { name: 'First name *' }).fill('Bodil');
	await page.getByRole('textbox', { name: 'Last name *' }).fill('Andersson');
	await page.getByRole('textbox', { name: 'Company name' }).fill('Alfons kritor AB');
	await page.getByPlaceholder('Company number').fill('556751-5019');
	await page.getByRole('textbox', { name: 'Street address *' }).fill('Sveavägen 49');
	await page.getByRole('textbox', { name: 'Postcode / ZIP *' }).fill('11359');
	await page.getByRole('textbox', { name: 'Town / City *' }).fill('Stockholm');
	await page.getByLabel('Email address *').fill('bodil.andersson@alfonskritor.com');
	await page.getByLabel('Phone').fill('0700000000');
	await page.getByLabel('I have read and agree to the').check();
	await page.getByRole('button', { name: 'Place order' }).click();

	await ledyerIframe.locator('button:has-text("Fortsätt")').click();
	await ledyerIframe.locator('button:has-text("Slutför köp")').click();
	await page.waitForURL(/order-received/);
});