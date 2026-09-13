import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {waitForFonts, capture} from '../lib/capture.mjs';
test('page-controlled font promises cannot hang font readiness', async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    await page.setContent('<p>Fixture</p><script>Object.defineProperty(document.fonts,"ready",{get:()=>new Promise(()=>{})});</script>');
    await waitForFonts(page,500);
    await page.evaluate(() => Object.defineProperty(document.fonts,'status',{get:()=> 'loading'}));
    await assert.rejects(waitForFonts(page,100), /Timeout/);
  } finally {await browser.close();}
});
test('capture deadline kills the browser and releases resources', async () => {
  const original = chromium.launchServer; let killed = false;
  chromium.launchServer = async options => {
    const server = await original.call(chromium,options);
    server.process().once('exit',()=>{killed=true;});
    return server;
  };
  try {
    await assert.rejects(capture({id:'11111111-1111-4111-8111-111111111111',website:'https://example.com'}, '.prospecting-data/test-capture-deadline', {timeoutMs:1}));
    assert.equal(killed,true);
  } finally {chromium.launchServer=original;}
});
