// Run: node scripts/test-duplicate-detection.mjs  (Node >= 23.6 strips TS types natively)
import assert from 'node:assert/strict'
import { findDuplicate } from '../src/lib/duplicateDetection.ts'

const existing = [
  {
    id: 'dengue-neem',
    text: 'Dengue fever can be cured by eating neem leaves and taking antibiotics within 24 hours of symptoms appearing. Forward this to all your family groups!',
  },
]

// Exact copy and light rewording are flagged.
assert.equal(findDuplicate(existing[0].text, existing)?.id, 'dengue-neem')
assert.equal(
  findDuplicate('Dengue fever can be cured by eating neem leaves and taking some antibiotics within 24 hrs of the symptoms appearing!!', existing)?.id,
  'dengue-neem'
)
assert.equal(findDuplicate('DENGUE fever can be CURED by eating neem leaves & taking antibiotics within 24 hrs of symptoms appearing 🙏🙏', existing)?.id, 'dengue-neem')

// Different claims on the same topic are not.
assert.equal(findDuplicate('Dengue cases are rising in Delhi this monsoon', existing), null)
assert.equal(findDuplicate('Papaya leaf juice cures dengue fever within 24 hours', existing), null)
assert.equal(findDuplicate('', existing), null)

console.log('duplicate detection: ok')
