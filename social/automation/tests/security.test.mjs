import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordHash,passwordMatches,authorized,cookieOptions} from '../lib/auth.mjs';
import {normalize,exactDuplicate} from '../lib/duplicates.mjs';
test('password hashes are salted and reject wrong passwords',()=>{const h=passwordHash('test-password');assert(passwordMatches('test-password',h));assert(!passwordMatches('wrong',h));assert.notEqual(h,passwordHash('test-password'));});
test('forged and missing session cookies fail closed',async()=>{assert.equal(await authorized(new Request('https://example.test')),false);assert.equal(await authorized(new Request('https://example.test',{headers:{cookie:'__Secure-mv-social-session=forged'}})),false);assert(cookieOptions.httpOnly&&cookieOptions.secure);assert.equal(cookieOptions.sameSite,'strict');});
test('duplicate normalization ignores tags, punctuation and case',()=>{const h=[{ref:'old',caption:'Make the next step clear. #MindVortex'}];assert.equal(exactDuplicate({caption:'MAKE THE NEXT STEP CLEAR! #WebDesign'},h)?.ref,'old');assert.equal(exactDuplicate({caption:'How to compress a product image'},h),undefined);assert.equal(normalize('#MindVortex'),'');});
