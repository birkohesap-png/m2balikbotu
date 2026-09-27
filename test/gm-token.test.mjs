import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenTemizle } from '../lib/gm.js';

const T = 'AAAA.BBBB.CCCC';

test('temiz token aynen kalir', () => {
  assert.equal(tokenTemizle(T), T);
});

test('bas/son bosluk ve satir sonu temizlenir', () => {
  assert.equal(tokenTemizle(`  ${T}\r\n`), T);
});

test('cevreleyen tirnak temizlenir', () => {
  assert.equal(tokenTemizle(`"${T}"`), T);
  assert.equal(tokenTemizle(`'${T}'`), T);
});

test('Bearer oneki temizlenir', () => {
  assert.equal(tokenTemizle(`Bearer ${T}`), T);
  assert.equal(tokenTemizle(`bearer   ${T}`), T);
});

test('bos / tanimsiz degerde bos doner', () => {
  assert.equal(tokenTemizle(undefined), '');
  assert.equal(tokenTemizle('   '), '');
});
