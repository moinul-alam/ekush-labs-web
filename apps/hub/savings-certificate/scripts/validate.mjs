import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(BASE_DIR, 'assets');
const SCHEMA_DIR = path.join(BASE_DIR, 'schema');
const RATES_DIR = path.join(ASSETS_DIR, 'rates');

let errorCount = 0;

function logError(msg) {
  console.error(`❌ [ERROR] ${msg}`);
  errorCount++;
}

function logOk(msg) {
  console.log(`✅ [OK] ${msg}`);
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    logError(`Failed to read/parse ${filePath}: ${err.message}`);
    return null;
  }
}

function validateMeta(obj, filename) {
  if (!obj?.meta) {
    logError(`${filename}: missing meta block`);
    return;
  }
  const { schemaVersion, dataVersion, lastVerified, sources } = obj.meta;
  if (!schemaVersion || !dataVersion || !lastVerified) {
    logError(`${filename}: meta missing required fields`);
  }
  if (!Array.isArray(sources) || sources.length === 0) {
    logError(`${filename}: meta.sources must be a non-empty array`);
  } else {
    for (const src of sources) {
      if (!src.title || !src.url || !src.type) {
        logError(`${filename}: source missing title/url/type`);
      }
    }
  }
}

export function validateAll() {
  console.log('--- Validating Savings Certificate Hub Data ---');

  // 1. Validate index.json
  const indexPath = path.join(ASSETS_DIR, 'index.json');
  const indexData = readJson(indexPath);
  if (indexData) {
    validateMeta(indexData, 'index.json');
    if (!indexData.latestPeriodId) logError('index.json: missing latestPeriodId');
    if (!Array.isArray(indexData.periods) || indexData.periods.length === 0) {
      logError('index.json: periods must be non-empty array');
    } else {
      const ids = new Set();
      let prevTo = null;
      for (const p of indexData.periods) {
        if (!p.id || !p.from || !p.to || !p.file) {
          logError(`index.json: period ${JSON.stringify(p)} missing required fields`);
        }
        if (ids.has(p.id)) {
          logError(`index.json: duplicate period id ${p.id}`);
        }
        ids.add(p.id);

        const targetFile = path.join(ASSETS_DIR, p.file);
        if (!fs.existsSync(targetFile)) {
          logError(`index.json: referenced file not found: ${p.file}`);
        }

        if (p.from > p.to) {
          logError(`index.json: period ${p.id} from (${p.from}) > to (${p.to})`);
        }
      }
      logOk(`index.json valid with ${indexData.periods.length} periods.`);
    }
  }

  // 2. Validate schemes.json
  const schemesPath = path.join(ASSETS_DIR, 'schemes.json');
  const schemesData = readJson(schemesPath);
  const schemeIds = new Set();
  if (schemesData) {
    validateMeta(schemesData, 'schemes.json');
    if (!Array.isArray(schemesData.schemes) || schemesData.schemes.length === 0) {
      logError('schemes.json: schemes must be non-empty array');
    } else {
      for (const s of schemesData.schemes) {
        if (!s.id || !s.name?.bn || !s.name?.en || !s.termYears || !s.payoutType) {
          logError(`schemes.json: scheme ${s.id || 'unknown'} missing required fields`);
        }
        if (schemeIds.has(s.id)) {
          logError(`schemes.json: duplicate scheme id ${s.id}`);
        }
        schemeIds.add(s.id);
      }
      logOk(`schemes.json valid with ${schemesData.schemes.length} schemes.`);
    }
  }

  // 3. Validate tax.json
  const taxPath = path.join(ASSETS_DIR, 'tax.json');
  const taxData = readJson(taxPath);
  if (taxData) {
    validateMeta(taxData, 'tax.json');
    if (!Array.isArray(taxData.rules) || taxData.rules.length === 0) {
      logError('tax.json: rules must be non-empty array');
    } else {
      for (const r of taxData.rules) {
        if (!r.effectiveFrom || !Array.isArray(r.sourceTax) || typeof r.pensionerExemptUpTo !== 'number') {
          logError('tax.json: rule missing effectiveFrom, sourceTax, or pensionerExemptUpTo');
        }
      }
      logOk(`tax.json valid with ${taxData.rules.length} rule entries.`);
    }
  }

  // 4. Validate rate files
  if (fs.existsSync(RATES_DIR)) {
    const rateFiles = fs.readdirSync(RATES_DIR).filter((f) => f.endsWith('.json'));
    for (const rf of rateFiles) {
      const rPath = path.join(RATES_DIR, rf);
      const rData = readJson(rPath);
      if (!rData) continue;

      validateMeta(rData, rf);
      if (!rData.periodId || !rData.effectiveFrom || !rData.effectiveTo || !rData.tierThreshold || !rData.tierMode) {
        logError(`${rf}: missing core fields (periodId, effectiveFrom, effectiveTo, tierThreshold, tierMode)`);
      }
      if (!['excess_only', 'whole_amount'].includes(rData.tierMode)) {
        logError(`${rf}: invalid tierMode '${rData.tierMode}'`);
      }

      for (const sId of schemeIds) {
        const sRate = rData.schemes?.[sId];
        if (!sRate) {
          logError(`${rf}: missing scheme rate definition for '${sId}'`);
          continue;
        }
        if (typeof sRate.rateAtOrBelowThreshold !== 'number' || typeof sRate.rateAboveThreshold !== 'number') {
          logError(`${rf}: scheme '${sId}' missing valid rates`);
        }
        if (sRate.rateAtOrBelowThreshold <= 0 || sRate.rateAtOrBelowThreshold > 30) {
          logError(`${rf}: scheme '${sId}' rate out of sane range: ${sRate.rateAtOrBelowThreshold}`);
        }
        if (sRate.rateAboveThreshold > sRate.rateAtOrBelowThreshold) {
          logError(`${rf}: scheme '${sId}' rateAboveThreshold (${sRate.rateAboveThreshold}) > rateAtOrBelowThreshold (${sRate.rateAtOrBelowThreshold}) without note`);
        }

        if (Array.isArray(sRate.earlyEncashment)) {
          let prevYears = 0;
          for (const enc of sRate.earlyEncashment) {
            if (enc.afterFullYears <= prevYears) {
              logError(`${rf}: scheme '${sId}' earlyEncashment years not strictly ascending: ${enc.afterFullYears}`);
            }
            prevYears = enc.afterFullYears;
          }
        }
      }
      logOk(`${rf} rate file verified successfully.`);
    }
  }

  if (errorCount > 0) {
    console.error(`\n❌ Total Errors: ${errorCount}. Validation failed!`);
    return false;
  }
  console.log('\n✨ ALL SAVINGS CERTIFICATE HUB DATA PASSED VALIDATION!\n');
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ok = validateAll();
  process.exit(ok ? 0 : 1);
}
