/* ============================================================
   Ekush Labs — sync.js
   A zero-dependency, high-performance sync utility for monorepo
   shared resources. Handles directory mapping and hot-reloading (watch).
============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT_SHARED = __dirname;
const APPS_DIR = path.join(ROOT_SHARED, '..', 'apps');
const EXEMPTIONS = ['hub']; // Hub only serves API JSON and has no front-end assets

/**
 * Utility: Deeply copy a directory recursively
 */
function copyFolderRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyFolderRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Utility: Clean target directory safely
 */
function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[Sync Warning] Could not clean ${dirPath}: ${err.message}`);
    }
  }
}

/**
 * Find all active static web applications in apps/
 */
function getActiveApps() {
  if (!fs.existsSync(APPS_DIR)) {
    console.error(`[Sync Error] Apps directory not found: ${APPS_DIR}`);
    return [];
  }

  return fs.readdirSync(APPS_DIR).filter((app) => {
    if (EXEMPTIONS.includes(app)) return false;
    const appPath = path.join(APPS_DIR, app);
    const stat = fs.statSync(appPath);
    // Target only directories containing an index.html file
    return stat.isDirectory() && fs.existsSync(path.join(appPath, 'index.html'));
  });
}

/**
 * Core Sync Routine
 */
function runSync() {
  const apps = getActiveApps();
  if (apps.length === 0) {
    console.log('[Sync] No target web apps found to synchronize.');
    return;
  }

  console.log(`[Sync] Starting synchronization for: ${apps.join(', ')}`);
  const startTime = Date.now();

  const syncDirs = ['assets', 'css', 'js', 'components'];

  apps.forEach((app) => {
    const appSharedDir = path.join(APPS_DIR, app, 'shared');
    
    // Clean target shared directory
    cleanDirectory(appSharedDir);
    fs.mkdirSync(appSharedDir, { recursive: true });

    // Sync each folder
    syncDirs.forEach((dir) => {
      const srcPath = path.join(ROOT_SHARED, dir);
      const destPath = path.join(appSharedDir, dir);
      
      if (fs.existsSync(srcPath)) {
        copyFolderRecursiveSync(srcPath, destPath);
      }
    });
  });

  const duration = Date.now() - startTime;
  console.log(`[Sync] Sync complete! Mirrored root /shared into ${apps.length} apps in ${duration}ms.\n`);
}

/**
 * Start watch mode for real-time local developer experience
 */
function startWatchMode() {
  console.log(`\n============================================================`);
  console.log(`👁️  Sync Engine is watching for changes inside /shared...`);
  console.log(`   Press Ctrl+C to stop.`);
  console.log(`============================================================\n`);

  runSync();

  let timeoutId = null;

  // Watch directories
  const watchDirs = ['assets', 'css', 'js', 'components'];
  
  watchDirs.forEach((dir) => {
    const dirPath = path.join(ROOT_SHARED, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.startsWith('.') || filename.endsWith('~'))) return; // Ignore temporary files
      
      // Debounce the sync so editing a file doesn't fire multiple rapid copies
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        console.log(`[Watch] Detected change: ${filename ? `${dir}/${filename}` : `in ${dir}`}`);
        runSync();
      }, 100);
    });
  });
}

// Command-line routing
const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('-w')) {
  startWatchMode();
} else if (args.includes('--clean')) {
  console.log('[Sync] Purging shared folders from apps...');
  getActiveApps().forEach((app) => {
    const target = path.join(APPS_DIR, app, 'shared');
    cleanDirectory(target);
    console.log(`[-] Cleaned: apps/${app}/shared`);
  });
  console.log('[Sync] Purge complete.');
} else {
  runSync();
}
