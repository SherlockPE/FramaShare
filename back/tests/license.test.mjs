import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicationLicense } from '../dist/services/license.service.js';

test('license defaults preserve older uploads and only CC stores author credit', () => {
  assert.deepEqual(publicationLicense(), { license: 'unspecified', attribution: '' });
  assert.deepEqual(publicationLicense('reserved', 'Owner'), { license: 'reserved', attribution: '' });
  for (const license of ['CC-BY-4.0', 'CC-BY-SA-4.0']) {
    assert.deepEqual(publicationLicense(license, '  Author  '), { license, attribution: 'Author' });
    assert.throws(() => publicationLicense(license, '  '), { statusCode: 400 });
  }
  assert.throws(() => publicationLicense('unknown', 'Author'), { statusCode: 400 });
  assert.throws(() => publicationLicense('CC-BY-4.0', 'a'.repeat(201)), { statusCode: 400 });
});
