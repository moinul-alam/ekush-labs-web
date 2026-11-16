import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(BASE_DIR, 'manifest.json');

// Leap year slot map: Feb 29 must exist because the app renders it on leap days.
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let errorCount = 0;
let warnCount = 0;

function logError(msg) {
  console.error(`❌ [ERROR] ${msg}`);
  errorCount++;
}

function logWarn(msg) {
  console.warn(`⚠️ [WARN] ${msg}`);
  warnCount++;
}

function logOk(msg) {
  console.log(`✅ [OK] ${msg}`);
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (raw.charCodeAt(0) === 0xfeff) logWarn(`${filePath}: has a UTF-8 BOM`);
    return JSON.parse(raw);
  } catch (err) {
    logError(`Failed to read/parse ${filePath}: ${err.message}`);
    return null;
  }
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

const BENGALI_RE = /[\u0980-\u09FF]/;

function expectedSlots() {
  const slots = [];
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= DAYS_IN_MONTH[m - 1]; d++) slots.push(`${m}-${d}`);
  }
  return slots;
}

function validateSlotCoverage(items, label) {
  const seen = new Set();
  let prev = 0;
  let sorted = true;
  for (const item of items) {
    const slot = item.month * 100 + item.day;
    const key = `${item.month}-${item.day}`;
    if (seen.has(key)) logError(`${label}: duplicate slot ${key}`);
    seen.add(key);
    if (slot <= prev) sorted = false;
    prev = slot;
  }
  if (!sorted) logError(`${label}: entries are not sorted by month/day`);

  const missing = expectedSlots().filter((s) => !seen.has(s));
  const expected = new Set(expectedSlots());
  const extra = [...seen].filter((s) => !expected.has(s));

  if (missing.length) logError(`${label}: missing slots — ${missing.join(', ')}`);
  if (extra.length) logError(`${label}: invalid dates — ${extra.join(', ')}`);
  if (!missing.length && !extra.length) {
    logOk(`${label}: full ${expectedSlots().length}-slot calendar coverage`);
  }
}

function validateWords(manifest) {
  const rel = manifest.datasets?.words?.files?.en;
  if (!isNonEmptyString(rel)) {
    logError('manifest: datasets.words.files.en is missing');
    return;
  }
  const data = readJson(path.join(BASE_DIR, rel));
  if (!data) return;

  if (!isNonEmptyString(data.version)) logError(`${rel}: missing version`);
  if (data.language !== 'en') logError(`${rel}: language must be "en"`);
  if (!Array.isArray(data.words) || data.words.length === 0) {
    logError(`${rel}: words[] is empty`);
    return;
  }
  if (data.count !== data.words.length) {
    logError(`${rel}: count ${data.count} !== words.length ${data.words.length}`);
  }

  const required = [
    'word',
    'partOfSpeech',
    'meaningEn',
    'meaningBn',
    'synonym',
    'example',
    'pronunciation',
  ];
  for (const [i, w] of data.words.entries()) {
    for (const field of required) {
      if (!isNonEmptyString(w[field])) {
        logError(`${rel}: entry ${i} (${w.month}-${w.day}) empty "${field}"`);
      }
    }
    if (!Number.isInteger(w.month) || !Number.isInteger(w.day)) {
      logError(`${rel}: entry ${i} has non-integer month/day`);
    }
    if (!BENGALI_RE.test(w.meaningBn ?? '')) {
      logError(`${rel}: entry ${i} (${w.month}-${w.day}) meaningBn has no Bengali text`);
    }
  }

  validateSlotCoverage(data.words, rel);

  const spellings = new Map();
  for (const w of data.words) {
    const key = (w.word ?? '').trim().toLowerCase();
    spellings.set(key, (spellings.get(key) ?? 0) + 1);
  }
  const dupes = [...spellings.entries()].filter(([, n]) => n > 1);
  if (dupes.length) {
    logWarn(
      `${rel}: ${dupes.length} repeated word spellings — ` +
        dupes.map(([w, n]) => `${w}×${n}`).join(', '),
    );
  } else {
    logOk(`${rel}: no repeated word spellings`);
  }
}

function validateQuotes(manifest) {
  const rel = manifest.datasets?.quotes?.files?.en;
  if (!isNonEmptyString(rel)) {
    logError('manifest: datasets.quotes.files.en is missing');
    return;
  }
  const data = readJson(path.join(BASE_DIR, rel));
  if (!data) return;

  if (!isNonEmptyString(data.version)) logError(`${rel}: missing version`);
  if (data.language !== 'en') logError(`${rel}: language must be "en"`);
  if (!Array.isArray(data.quotes) || data.quotes.length === 0) {
    logError(`${rel}: quotes[] is empty`);
    return;
  }
  if (data.count !== data.quotes.length) {
    logError(`${rel}: count ${data.count} !== quotes.length ${data.quotes.length}`);
  }

  const categories = data.categories ?? {};
  if (typeof categories !== 'object' || Array.isArray(categories)) {
    logError(`${rel}: categories must be an object`);
  }

  const required = ['text', 'textBn', 'author', 'authorBn', 'category'];
  for (const [i, q] of data.quotes.entries()) {
    for (const field of required) {
      if (!isNonEmptyString(q[field])) {
        logError(`${rel}: entry ${i} (${q.month}-${q.day}) empty "${field}"`);
      }
    }
    for (const field of ['textBn', 'authorBn']) {
      if (!BENGALI_RE.test(q[field] ?? '')) {
        logError(`${rel}: entry ${i} (${q.month}-${q.day}) ${field} has no Bengali text`);
      }
    }
    if (!Number.isInteger(q.month) || !Number.isInteger(q.day)) {
      logError(`${rel}: entry ${i} has non-integer month/day`);
    }
    const categoryBn = categories[q.category];
    if (!isNonEmptyString(categoryBn)) {
      logError(`${rel}: entry ${i} category "${q.category}" has no Bengali label`);
    } else if (!BENGALI_RE.test(categoryBn)) {
      logError(`${rel}: category "${q.category}" Bengali label has no Bengali text`);
    }
  }

  validateSlotCoverage(data.quotes, rel);
}

function validateManifest() {
  const manifest = readJson(MANIFEST_PATH);
  if (!manifest) return null;

  if (!Number.isInteger(manifest.manifestVersion) || manifest.manifestVersion < 1) {
    logError('manifest: manifestVersion must be a positive integer');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.lastUpdated ?? '')) {
    logError('manifest: lastUpdated must be YYYY-MM-DD');
  }
  if (!/^https:\/\//.test(manifest.baseUrl ?? '')) {
    logError('manifest: baseUrl must be an https URL');
  }

  const datasets = manifest.datasets ?? {};
  for (const name of ['words', 'quotes']) {
    const v = datasets[name]?.version;
    if (!Number.isInteger(v) || v < 1) {
      logError(`manifest: datasets.${name}.version must be a positive integer`);
    }
  }
  for (const [name, ds] of Object.entries(datasets)) {
    if (!ds?.files || typeof ds.files !== 'object') {
      logError(`manifest: datasets.${name}.files is missing`);
      continue;
    }
    for (const rel of Object.values(ds.files)) {
      const full = path.join(BASE_DIR, rel);
      if (!fs.existsSync(full)) {
        logError(`manifest: datasets.${name} references missing file ${rel}`);
      } else {
        try {
          JSON.parse(fs.readFileSync(full, 'utf-8'));
        } catch (err) {
          logError(`manifest: datasets.${name} file ${rel} is not valid JSON`);
        }
      }
    }
  }

  logOk(`manifest: version ${manifest.manifestVersion}, updated ${manifest.lastUpdated}`);
  return manifest;
}

const manifest = validateManifest();
if (manifest) {
  validateWords(manifest);
  validateQuotes(manifest);
}

console.log('—'.repeat(50));
if (errorCount > 0) {
  console.error(`FAILED: ${errorCount} error(s), ${warnCount} warning(s)`);
  process.exit(1);
} else {
  console.log(`PASSED: 0 errors, ${warnCount} warning(s)`);
}
