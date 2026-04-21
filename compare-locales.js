const fs = require('fs');
const path = require('path');

function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

function extractPlaceholders(str) {
  const matches = str.match(/\{\{(\w+)\}\}/g);
  return matches ? matches.map(m => m.replace(/\{\{|\}\}/g, '')).sort() : [];
}

function comparePair(enPath, itPath, label) {
  const en = flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')));
  const it = flatten(JSON.parse(fs.readFileSync(itPath, 'utf8')));

  const enKeys = Object.keys(en).sort();
  const itKeys = Object.keys(it).sort();

  const missingInIt = enKeys.filter(k => !(k in it));
  const missingInEn = itKeys.filter(k => !(k in en));

  const commonKeys = enKeys.filter(k => k in it);
  const mismatches = [];
  for (const key of commonKeys) {
    const enPlaceholders = extractPlaceholders(en[key]);
    const itPlaceholders = extractPlaceholders(it[key]);
    if (enPlaceholders.join(',') !== itPlaceholders.join(',')) {
      mismatches.push({
        key,
        en: en[key],
        it: it[key],
        enPlaceholders,
        itPlaceholders
      });
    }
  }

  console.log(`\n=== ${label} ===`);
  console.log(`Missing in IT: ${missingInIt.length}${missingInIt.length ? ' → ' + missingInIt.join(', ') : ''}`);
  console.log(`Missing in EN: ${missingInEn.length}${missingInEn.length ? ' → ' + missingInEn.join(', ') : ''}`);
  console.log(`Placeholder mismatches: ${mismatches.length}`);
  for (const m of mismatches) {
    console.log(`  ${m.key}`);
    console.log(`    EN: ${m.en}`);
    console.log(`    IT: ${m.it}`);
    console.log(`    EN placeholders: [${m.enPlaceholders.join(', ')}]`);
    console.log(`    IT placeholders: [${m.itPlaceholders.join(', ')}]`);
  }
}

const pairs = [
  ['frontend/public/locales/en/pos.json', 'frontend/public/locales/it/pos.json', 'Frontend: pos.json'],
  ['frontend/public/locales/en/auth.json', 'frontend/public/locales/it/auth.json', 'Frontend: auth.json'],
  ['frontend/public/locales/en/errors.json', 'frontend/public/locales/it/errors.json', 'Frontend: errors.json'],
  ['frontend/public/locales/en/validation.json', 'frontend/public/locales/it/validation.json', 'Frontend: validation.json'],
  ['backend/locales/en/api.json', 'backend/locales/it/api.json', 'Backend: api.json'],
  ['backend/locales/en/common.json', 'backend/locales/it/common.json', 'Backend: common.json'],
  ['backend/locales/en/email.json', 'backend/locales/it/email.json', 'Backend: email.json'],
  ['backend/locales/en/invoice.json', 'backend/locales/it/invoice.json', 'Backend: invoice.json'],
  ['backend/locales/en/receipt.json', 'backend/locales/it/receipt.json', 'Backend: receipt.json'],
  ['backend/locales/en/settings.json', 'backend/locales/it/settings.json', 'Backend: settings.json'],
];

for (const [en, it, label] of pairs) {
  comparePair(path.join('/home/pippo/tev2', en), path.join('/home/pippo/tev2', it), label);
}
