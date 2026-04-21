#!/usr/bin/env node
/**
 * i18n Audit Script
 * - Extracts all translation keys used in source code
 * - Compares against translation JSON files
 * - Identifies orphaned keys
 * - Checks placeholder integrity across languages
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = '/home/pippo/tev2';

// ============================================================
// 1. Collect all source files
// ============================================================
function getAllFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, dist, .git
      if (['node_modules', 'dist', '.git', '__tests__', 'coverage'].includes(entry.name)) continue;
      results.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ============================================================
// 2. Extract translation keys from source code
// ============================================================
function extractKeysFromSource(files) {
  const keys = new Set();
  const dynamicPatterns = new Set();
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Pattern 1: t('key') or t("key") - with namespace prefix
    const singleQuoteRegex = /\bt\(\s*'([^']+)'/g;
    const doubleQuoteRegex = /\bt\(\s*"([^"]+)"/g;
    
    // Pattern 2: i18n.t('key') or i18n.t("key")
    const i18nSingleRegex = /i18n\.t\(\s*'([^']+)'/g;
    const i18nDoubleRegex = /i18n\.t\(\s*"([^"]+)"/g;
    
    // Pattern 3: req.t('key') or req.t("key")
    const reqSingleRegex = /req\.t\(\s*'([^']+)'/g;
    const reqDoubleRegex = /req\.t\(\s*"([^"]+)"/g;
    
    // Pattern 4: Handlebars {{t 'key'}} or {{t "key"}}
    const hbsSingleRegex = /\{\{t\s+'([^']+)'/g;
    const hbsDoubleRegex = /\{\{t\s+"([^"]+)"/g;
    // Pattern 5: Handlebars variable keys like {{t paymentMethodLabelKey}}
    const hbsVarRegex = /\{\{t\s+(\w+Key)\}\}/g;
    
    const allRegexes = [singleQuoteRegex, doubleQuoteRegex, i18nSingleRegex, i18nDoubleRegex, reqSingleRegex, reqDoubleRegex, hbsSingleRegex, hbsDoubleRegex];
    
    for (const regex of allRegexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        // Check if it contains interpolation (dynamic)
        if (key.includes('${') || key.includes('{{')) {
          dynamicPatterns.add(key);
        } else {
          keys.add(key);
        }
      }
    }
    
    // Handle Handlebars concat patterns like {{t (concat 'invoice.status.' invoice.status)}}
    const hbsConcatRegex = /\{\{t\s+\(concat\s+'([^']+)'/g;
    let concatMatch;
    while ((concatMatch = hbsConcatRegex.exec(content)) !== null) {
      // This is a dynamic prefix - add as dynamic
      dynamicPatterns.add(concatMatch[1]);
    }
    
    // Handle Handlebars variable keys (resolved at render time by template)
    // These are like paymentMethodLabelKey which are passed as template variables
    // We skip these as they're resolved dynamically
  }
  
  return { keys, dynamicPatterns };
}

// ============================================================
// 3. Flatten nested JSON to dot-notation keys
// ============================================================
function flattenJson(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

// ============================================================
// 4. Parse namespace:key format
// ============================================================
function resolveKey(rawKey, defaultNamespace) {
  if (rawKey.includes(':')) {
    const [ns, ...rest] = rawKey.split(':');
    return { namespace: ns, key: rest.join(':') };
  }
  return { namespace: defaultNamespace, key: rawKey };
}

// ============================================================
// 5. Extract placeholders from a string value
// ============================================================
function extractPlaceholders(value) {
  if (typeof value !== 'string') return [];
  // i18next uses {{var}} syntax
  const i18nextPlaceholders = [...value.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
  // Also check for %s, %d style placeholders
  const printfPlaceholders = [...value.matchAll(/%[sd]/g)].map(m => m[0]);
  // Check for {count}, {name} style (without doubling)
  const singleBracePlaceholders = [...value.matchAll(/\{(\w+)\}/g)]
    .filter(m => {
      // Exclude {{var}} matches (already captured above)
      const idx = m.index;
      return !(idx > 0 && value[idx-1] === '{') && !(idx + m[0].length < value.length && value[idx + m[0].length] === '{');
    })
    .map(m => m[1]);
  
  return [...new Set([...i18nextPlaceholders, ...printfPlaceholders, ...singleBracePlaceholders])];
}

// ============================================================
// MAIN
// ============================================================

console.log('=== i18n Audit Script ===\n');

// Collect source files - scan ALL frontend and backend source directories
const frontendSrcFiles = getAllFiles(path.join(PROJECT_ROOT, 'frontend/src'), ['.ts', '.tsx', '.js', '.jsx']);
const frontendComponentFiles = getAllFiles(path.join(PROJECT_ROOT, 'frontend/components'), ['.ts', '.tsx', '.js', '.jsx']);
const frontendUtilFiles = getAllFiles(path.join(PROJECT_ROOT, 'frontend/utils'), ['.ts', '.tsx', '.js', '.jsx']);
const frontendHookFiles = getAllFiles(path.join(PROJECT_ROOT, 'frontend/hooks'), ['.ts', '.tsx', '.js', '.jsx']);
const frontendRootFiles = getAllFiles(path.join(PROJECT_ROOT, 'frontend'), ['.ts', '.tsx', '.js', '.jsx']).filter(f => !f.includes('/components/') && !f.includes('/src/') && !f.includes('/utils/') && !f.includes('/hooks/') && !f.includes('/node_modules/'));
const backendSrcFiles = getAllFiles(path.join(PROJECT_ROOT, 'backend/src'), ['.ts', '.tsx', '.js', '.jsx']);
const backendTemplateFiles = getAllFiles(path.join(PROJECT_ROOT, 'backend/templates'), ['.hbs', '.html']);
const allSrcFiles = [...frontendSrcFiles, ...frontendComponentFiles, ...frontendUtilFiles, ...frontendHookFiles, ...frontendRootFiles, ...backendSrcFiles, ...backendTemplateFiles];

console.log(`Frontend source files: ${frontendSrcFiles.length}`);
console.log(`Backend source files: ${backendSrcFiles.length}`);
console.log(`Total source files to scan: ${allSrcFiles.length}\n`);

// Extract keys
const { keys: usedKeys, dynamicPatterns } = extractKeysFromSource(allSrcFiles);

console.log(`=== Used Translation Keys Found: ${usedKeys.size} ===`);
console.log(`=== Dynamic Patterns Found: ${dynamicPatterns.size} ===\n`);

// Group used keys by namespace
const usedKeysByNamespace = {};
const frontendDefaultNs = 'common';
const backendDefaultNs = 'common';

for (const rawKey of usedKeys) {
  // Determine if from frontend or backend - we just use the key as-is with namespace prefix
  const resolved = resolveKey(rawKey, 'common');
  if (!usedKeysByNamespace[resolved.namespace]) {
    usedKeysByNamespace[resolved.namespace] = new Set();
  }
  usedKeysByNamespace[resolved.namespace].add(resolved.key);
}

// Also collect dynamic patterns
for (const rawKey of dynamicPatterns) {
  // For dynamic keys, add the parent prefix
  const resolved = resolveKey(rawKey, 'common');
  if (!usedKeysByNamespace[resolved.namespace]) {
    usedKeysByNamespace[resolved.namespace] = new Set();
  }
  usedKeysByNamespace[resolved.namespace].add(resolved.key);
}

console.log('Used keys by namespace:');
for (const [ns, keys] of Object.entries(usedKeysByNamespace)) {
  console.log(`  ${ns}: ${keys.size} keys`);
}

// ============================================================
// Load all translation files
// ============================================================
const translationFiles = {
  frontend: {
    en: {},
    it: {}
  },
  backend: {
    en: {},
    it: {}
  }
};

const namespaces = {
  frontend: ['admin', 'auth', 'common', 'errors', 'pos', 'validation'],
  backend: ['api', 'common', 'email', 'errors', 'invoice', 'receipt', 'settings']
};

// Load frontend files
for (const lang of ['en', 'it']) {
  for (const ns of namespaces.frontend) {
    const filePath = path.join(PROJECT_ROOT, `frontend/public/locales/${lang}/${ns}.json`);
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      translationFiles.frontend[lang][ns] = flattenJson(content);
    }
  }
  for (const ns of namespaces.backend) {
    const filePath = path.join(PROJECT_ROOT, `backend/locales/${lang}/${ns}.json`);
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      translationFiles.backend[lang][ns] = flattenJson(content);
    }
  }
}

// Count total keys in translation files
console.log('\n=== Keys in Translation Files ===');
let totalKeys = 0;
for (const location of ['frontend', 'backend']) {
  for (const lang of ['en', 'it']) {
    for (const ns of namespaces[location]) {
      const keys = translationFiles[location][lang][ns] || {};
      const count = Object.keys(keys).length;
      if (lang === 'en') totalKeys += count;
      console.log(`  ${location}/${lang}/${ns}.json: ${count} keys`);
    }
  }
}
console.log(`  Total (en only): ${totalKeys} keys\n`);

// ============================================================
// Find orphaned keys (in en translation files but not used in code)
// ============================================================
console.log('=== ORPHANED KEYS ANALYSIS ===\n');

const orphanedKeys = {};

for (const location of ['frontend', 'backend']) {
  for (const ns of namespaces[location]) {
    const enKeys = translationFiles[location]['en'][ns] || {};
    const used = usedKeysByNamespace[ns] || new Set();
    
    const orphaned = [];
    const used_from_file = [];
    
    for (const key of Object.keys(enKeys)) {
      // Check if this key or any parent key is used
      let isUsed = used.has(key);
      
      // Also check if any used key is a child of this key
      // (because parent keys in nested JSON produce intermediate objects)
      if (!isUsed) {
        for (const u of used) {
          if (u.startsWith(key + '.') || key.startsWith(u + '.')) {
            isUsed = true;
            break;
          }
        }
      }
      
      // Also check if any used key with namespace prefix matches
      if (!isUsed) {
        const prefixedKey = `${ns}:${key}`;
        isUsed = usedKeys.has(prefixedKey);
      }
      
      // Check if any dynamic pattern could match this key
      if (!isUsed) {
        for (const dp of dynamicPatterns) {
          // Simple check: if the dynamic pattern's static prefix matches
          const staticPart = dp.split('${')[0].split('{{')[0];
          if (key.startsWith(staticPart) || staticPart.startsWith(key)) {
            isUsed = true;
            break;
          }
        }
      }
      
      if (!isUsed) {
        orphaned.push(key);
      } else {
        used_from_file.push(key);
      }
    }
    
    if (orphaned.length > 0) {
      const fileKey = `${location}/${ns}`;
      orphanedKeys[fileKey] = orphaned;
      console.log(`${fileKey}: ${orphaned.length} orphaned keys out of ${Object.keys(enKeys).length} total`);
    }
  }
}

// ============================================================
// Placeholder integrity check
// ============================================================
console.log('\n=== PLACEHOLDER INTEGRITY CHECK ===\n');

const placeholderIssues = [];

for (const location of ['frontend', 'backend']) {
  for (const ns of namespaces[location]) {
    const enKeys = translationFiles[location]['en'][ns] || {};
    const itKeys = translationFiles[location]['it'][ns] || {};
    
    for (const [key, enValue] of Object.entries(enKeys)) {
      if (typeof enValue !== 'string') continue;
      
      const enPlaceholders = extractPlaceholders(enValue);
      if (enPlaceholders.length === 0) continue;
      
      const itValue = itKeys[key];
      if (itValue === undefined) {
        placeholderIssues.push({
          location, ns, key,
          issue: `Missing in Italian translation`,
          enValue
        });
        continue;
      }
      
      if (typeof itValue !== 'string') continue;
      
      const itPlaceholders = extractPlaceholders(itValue);
      
      // Check if all en placeholders exist in it
      const missing = enPlaceholders.filter(p => !itPlaceholders.includes(p));
      const extra = itPlaceholders.filter(p => !enPlaceholders.includes(p));
      
      if (missing.length > 0 || extra.length > 0) {
        placeholderIssues.push({
          location, ns, key,
          issue: `Placeholder mismatch`,
          enPlaceholders, itPlaceholders,
          missingInIt: missing,
          extraInIt: extra,
          enValue, itValue
        });
      }
    }
    
    // Check for keys in en but not in it
    for (const key of Object.keys(enKeys)) {
      if (itKeys[key] === undefined) {
        placeholderIssues.push({
          location, ns, key,
          issue: `Key exists in English but missing in Italian`,
          enValue: enKeys[key]
        });
      }
    }
    
    // Check for keys in it but not in en
    for (const key of Object.keys(itKeys)) {
      if (enKeys[key] === undefined) {
        placeholderIssues.push({
          location, ns, key,
          issue: `Key exists in Italian but missing in English`,
          itValue: itKeys[key]
        });
      }
    }
  }
}

if (placeholderIssues.length > 0) {
  console.log(`Found ${placeholderIssues.length} placeholder/structural issues:\n`);
  for (const issue of placeholderIssues) {
    if (issue.issue === 'Placeholder mismatch') {
      console.log(`[${issue.location}/${issue.ns}] ${issue.key}`);
      console.log(`  EN: ${JSON.stringify(issue.enValue)}`);
      console.log(`  IT: ${JSON.stringify(issue.itValue)}`);
      console.log(`  Missing in IT: ${issue.missingInIt.join(', ')}`);
      console.log(`  Extra in IT: ${issue.extraInIt.join(', ')}`);
    } else {
      console.log(`[${issue.location}/${issue.ns}] ${issue.key}: ${issue.issue}`);
    }
    console.log();
  }
} else {
  console.log('No placeholder issues found.');
}

// ============================================================
// Output detailed orphaned keys list
// ============================================================
console.log('\n=== DETAILED ORPHANED KEYS ===\n');
for (const [fileKey, keys] of Object.entries(orphanedKeys)) {
  console.log(`\n--- ${fileKey} (${keys.length} keys) ---`);
  for (const key of keys) {
    console.log(`  ${key}`);
  }
}

// ============================================================
// Summary stats
// ============================================================
console.log('\n=== SUMMARY ===');
let totalOrphaned = 0;
for (const keys of Object.values(orphanedKeys)) {
  totalOrphaned += keys.length;
}
console.log(`Total translation keys (en): ${totalKeys}`);
console.log(`Total used keys found: ${usedKeys.size}`);
console.log(`Total orphaned keys: ${totalOrphaned}`);
console.log(`Total placeholder/structural issues: ${placeholderIssues.length}`);

// Write full results to JSON for processing
const results = {
  usedKeys: [...usedKeys].sort(),
  dynamicPatterns: [...dynamicPatterns].sort(),
  usedKeysByNamespace: Object.fromEntries(
    Object.entries(usedKeysByNamespace).map(([k, v]) => [k, [...v].sort()])
  ),
  orphanedKeys,
  placeholderIssues,
  totalKeys,
  totalOrphaned
};

fs.writeFileSync(
  path.join(PROJECT_ROOT, 'i18n-audit-results.json'),
  JSON.stringify(results, null, 2)
);
console.log('\nFull results written to i18n-audit-results.json');
