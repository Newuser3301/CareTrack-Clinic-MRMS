const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeIcd10cmResponse } = require('../utils/icd10cmApi');

test('normalizeIcd10cmResponse maps NLM Clinical Tables rows', () => {
  const payload = [
    2,
    ['E11.9', 'I10'],
    null,
    [
      ['E11.9', 'Type 2 diabetes mellitus without complications'],
      ['I10', 'Essential hypertension']
    ]
  ];

  assert.deepEqual(normalizeIcd10cmResponse(payload), [
    { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications' },
    { code: 'I10', name: 'Essential hypertension' }
  ]);
});

test('normalizeIcd10cmResponse ignores incomplete rows', () => {
  assert.deepEqual(normalizeIcd10cmResponse([0, [], null, [['A00'], null, ['B00', 'Herpesviral infections']]]), [
    { code: 'B00', name: 'Herpesviral infections' }
  ]);
});
