import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/overview');await page.getByRole('button',{name:'Use author role'}).click();
for(const width of [1440,390,320]){
 await page.setViewportSize({width,height:900});
 for(const [name,path,open] of [
 ['profile-menu','/app/library',()=>page.locator('.header-actions .dropdown>button').click()],
 ['publication-menu','/app/library',()=>page.locator('.publication').first().getByRole('button',{name:'More actions'}).click()],
 ['library-sort','/app/library',()=>page.getByRole('button',{name:'Sort',exact:true}).click()],
 ['library-filters','/app/library',()=>page.getByRole('button',{name:'Filters',exact:true}).click()],
 ['document-menu','/app/documents/doc1',()=>page.getByRole('button',{name:'Document actions'}).click()],
 ['link-menu','/app/documents/doc1',()=>page.locator('.link-row').first().getByRole('button',{name:'More actions'}).click()]
 ]){
  await page.goto('http://127.0.0.1:5173'+path);await open();await expect(page.locator('.dropdown-panel')).toBeVisible();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`${name} overflow at ${width}`);
  const bounds=await page.locator('.dropdown-panel').boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);await page.screenshot({path:`docs/verification/screenshots/${name}-${width}.png`});
  await page.keyboard.press('Escape');await expect(page.locator('.dropdown-panel')).toHaveCount(0);
 }
}
await page.goto('http://127.0.0.1:5173/share/workshop');await page.getByRole('button',{name:'Start reading'}).click();await page.getByLabel('PDF page',{exact:true}).waitFor();
await page.getByRole('button',{name:'Enter fullscreen'}).click();await expect(page.getByRole('button',{name:'Exit fullscreen'})).toBeVisible();await page.getByRole('button',{name:'Exit fullscreen'}).click();
const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download publication'}).click();expect((await download).suggestedFilename()).toContain('.pdf');
await page.getByRole('button',{name:'Report abuse'}).click();await page.screenshot({path:'docs/verification/screenshots/report-mobile.png'});await page.keyboard.press('Escape');
await page.goto('http://127.0.0.1:5173/app/documents/doc1');await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Clipboard blocked')}}}));await page.locator('.link-row').first().getByRole('button',{name:'Copy link',exact:true}).click();await expect(page.getByRole('status')).toContainText('Copy unavailable');expect(await page.evaluate(()=>getSelection()?.toString())).toBe('http://127.0.0.1:5173/share/workshop');
console.log(JSON.stringify({openControls:18,fullscreen:true,download:true,errors}));expect(errors).toEqual([]);await browser.close();
