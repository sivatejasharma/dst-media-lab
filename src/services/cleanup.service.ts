import fs from 'fs';
import path from 'path';
import { config } from '../config';

/**
 * Delete all files in a directory.
 */
export function cleanDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      fs.unlinkSync(fullPath);
      console.log(`[Cleanup] Deleted: ${fullPath}`);
    }
  }
}

/**
 * Delete specific files (used to clean up uploaded temp files after processing).
 */
export function deleteFiles(filePaths: string[]): void {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Deleted temp file: ${path.basename(filePath)}`);
      }
    } catch (err) {
      console.error(`[Cleanup] Failed to delete ${filePath}:`, err);
    }
  }
}

/**
 * Delete output files older than maxAgeMs.
 */
export function cleanOldOutputFiles(): void {
  const { outputDir } = config.upload;
  const { maxAgeMs } = config.cleanup;

  if (!fs.existsSync(outputDir)) return;

  const now = Date.now();
  const files = fs.readdirSync(outputDir);
  let deletedCount = 0;

  for (const file of files) {
    const fullPath = path.join(outputDir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && (now - stat.mtimeMs) > maxAgeMs) {
        fs.unlinkSync(fullPath);
        deletedCount++;
        console.log(`[Cleanup] Removed expired output: ${file}`);
      }
    } catch (err) {
      console.error(`[Cleanup] Error processing ${file}:`, err);
    }
  }

  if (deletedCount > 0) {
    console.log(`[Cleanup] Removed ${deletedCount} expired output file(s)`);
  }
}

/**
 * Start periodic cleanup of old output files.
 */
export function startCleanupScheduler(): NodeJS.Timeout {
  console.log(
    `[Cleanup] Scheduler started (interval: ${config.cleanup.intervalMs / 1000}s, ` +
    `max age: ${config.cleanup.maxAgeMs / 1000}s)`
  );

  // Run immediately on start
  cleanOldOutputFiles();

  // Then run on interval
  return setInterval(cleanOldOutputFiles, config.cleanup.intervalMs);
}
