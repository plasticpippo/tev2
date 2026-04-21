#!/usr/bin/env node
/**
 * i18n Cleanup Script
 * Reads audit results and produces cleaned translation files.
 * Run AFTER i18n-audit.mjs
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = '/home/pippo/tev2';

// Read audit results
const results = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'i18n-audit-results.json'), 'utf-8'));

// Deep clone helper
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Delete a key from nested object by dot-path, cleaning up empty parents
function deleteNestedKey(obj, dotPath) {
  const parts = dotPath.split('.');
  let current = obj;
  const stack = [current];
  
  // Navigate to parent
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) return false;
    current = current[parts[i]];
    stack.push(current);
  }
  
  const lastKey = parts[parts.length - 1];
  if (current[lastKey] === undefined) return false;
  
  delete current[lastKey];
  
  // Clean up empty parent objects (bottom-up)
  for (let i = stack.length - 1; i > 0; i--) {
    const parent = stack[i - 1];
    const key = parts[i - 1];
    if (Object.keys(parent[key]).length === 0) {
      delete parent[key];
    }
  }
  
  return true;
}

// Check if a key is a parent of any used key (needed for nested JSON structure)
function isParentOfUsed(dotPath, usedKeysSet) {
  for (const uk of usedKeysSet) {
    if (uk.startsWith(dotPath + '.')) return true;
  }
  return false;
}

// Fix placeholder in Italian translation to match English
function fixPlaceholders(itValue, enPlaceholders, itPlaceholders) {
  if (typeof itValue !== 'string') return itValue;
  let fixed = itValue;
  // For each missing placeholder, try to add it
  for (const ph of enPlaceholders) {
    if (!itPlaceholders.includes(ph)) {
      // Add {{ph}} at the end or at a reasonable position
      fixed = fixed + ` {{${ph}}}`;
    }
  }
  // For each extra placeholder in IT, we should remove it but that's risky
  // Instead, flag it
  return fixed;
}

const namespaces = {
  frontend: ['admin', 'auth', 'common', 'errors', 'pos', 'validation'],
  backend: ['api', 'common', 'email', 'errors', 'invoice', 'receipt', 'settings']
};

const usedByNs = results.usedKeysByNamespace;

let totalRemoved = 0;
let totalPlaceholderFixes = 0;
const summary = {};

for (const location of ['frontend', 'backend']) {
  for (const ns of namespaces[location]) {
    const enPath = path.join(PROJECT_ROOT, `${location === 'frontend' ? 'frontend/public' : 'backend'}/locales/en/${ns}.json`);
    const itPath = path.join(PROJECT_ROOT, `${location === 'frontend' ? 'frontend/public' : 'backend'}/locales/it/${ns}.json`);
    
    if (!fs.existsSync(enPath)) continue;
    
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const itData = fs.existsSync(itPath) ? JSON.parse(fs.readFileSync(itPath, 'utf-8')) : {};
    
    const fileKey = `${location}/${ns}`;
    const orphaned = results.orphanedKeys[fileKey] || [];
    const usedKeys = new Set(usedByNs[ns] || []);
    
    // Also add all template-used keys
    // Templates use keys like 'receipt.title', 'invoice.number' etc.
    // These are already in the usedKeys set from the audit
    
    let removed = 0;
    
    // Delete orphaned keys from both en and it
    for (const key of orphaned) {
      // Don't delete if it's a parent of a used key
      if (isParentOfUsed(key, usedKeys)) continue;
      
      if (deleteNestedKey(enData, key)) removed++;
      deleteNestedKey(itData, key); // Also remove from Italian
    }
    
    // Fix placeholder issues
    let placeholderFixes = 0;
    for (const issue of results.placeholderIssues) {
      if (issue.location !== location || issue.ns !== ns) continue;
      
      if (issue.issue === 'Placeholder mismatch' && issue.itValue) {
        // Fix Italian translation to include all English placeholders
        const fixedValue = fixPlaceholders(issue.itValue, issue.enPlaceholders, issue.itPlaceholders);
        // Set the fixed value in Italian translation
        const parts = issue.key.split('.');
        let current = itData;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        if (current[parts[parts.length - 1]] !== undefined) {
          current[parts[parts.length - 1]] = fixedValue;
          placeholderFixes++;
        }
      }
      
      if (issue.issue === 'Key exists in English but missing in Italian') {
        // Add the English value as fallback in Italian
        const parts = issue.key.split('.');
        let current = itData;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        if (current[parts[parts.length - 1]] === undefined) {
          current[parts[parts.length - 1]] = issue.enValue;
          placeholderFixes++;
        }
      }
      
      if (issue.issue === 'Key exists in Italian but missing in English') {
        // Remove the orphaned Italian key
        deleteNestedKey(itData, issue.key);
        placeholderFixes++;
      }
    }
    
    // Write cleaned files
    fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n');
    fs.writeFileSync(itPath, JSON.stringify(itData, null, 2) + '\n');
    
    totalRemoved += removed;
    totalPlaceholderFixes += placeholderFixes;
    
    summary[fileKey] = { removed, placeholderFixes, remainingKeys: Object.keys(JSON.parse(fs.readFileSync(enPath, 'utf-8'))).length };
    
    console.log(`${fileKey}: removed ${removed} orphaned keys, fixed ${placeholderFixes} placeholder issues`);
  }
}

console.log(`\n=== CLEANUP COMPLETE ===`);
console.log(`Total orphaned keys removed: ${totalRemoved}`);
console.log(`Total placeholder issues fixed: ${totalPlaceholderFixes}`);

// Write summary
fs.writeFileSync(
  path.join(PROJECT_ROOT, 'i18n-cleanup-summary.json'),
  JSON.stringify({ summary, totalRemoved, totalPlaceholderFixes }, null, 2)
);
console.log('Summary written to i18n-cleanup-summary.json');
