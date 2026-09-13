import {test,expect} from '@playwright/test';

test('public pages and embedded previews remain usable under CSP', async ({page,request}) => {
  const blocked:string[]=[];
  page.on('console', message=>{if(message.type()==='error' && /content security policy|violates.*directive/i.test(message.text())) blocked.push(message.text());});
  const response=await page.goto('/pl');
  expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['content-security-policy']).toContain("object-src 'none'");
  await expect(page.locator('h1')).toBeVisible();
  for (const project of ['kierunek','marcin-bak','flc']) {
    await page.goto(`/previews/${project}/`);
    await expect(page.locator('h1').first()).toBeVisible();
  }
  expect(blocked).toEqual([]);
  expect((await request.get('/prospecting/api')).status()).toBe(401);
  expect((await request.get('/prospecting/report/'+'a'.repeat(48))).status()).toBe(401);
});
