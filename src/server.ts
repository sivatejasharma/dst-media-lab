import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { startCleanupScheduler } from './services/cleanup.service';

// Ensure required directories exist
fs.mkdirSync(config.upload.tempDir, { recursive: true });
fs.mkdirSync(config.upload.outputDir, { recursive: true });

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static Frontend UI ---
app.use(express.static(path.resolve(process.cwd(), 'public')));

// --- Routes ---
app.use('/api', routes);

// --- API Metadata endpoint ---
app.get('/api/info', (_req, res) => {
  res.json({
    name: 'Video Merger API',
    version: '1.0.0',
    description: 'Smart Video Merging Backend with Logo Watermark & Adaptive 4K/1080p Resolution',
    endpoints: {
      ui: '/',
      merge: 'POST /api/videos/merge',
      download: 'GET /api/videos/download/:filename',
      health: 'GET /api/videos/health',
    },
  });
});

// --- Error handling (must be after routes) ---
app.use(errorHandler);

const host = '0.0.0.0';
const server = app.listen(config.port, host, () => {
  console.log('\n============================================');
  console.log('  🎬 Video Merger API');
  console.log('============================================');
  console.log(`  Environment : ${config.nodeEnv}`);
  console.log(`  Port        : ${config.port}`);
  console.log(`  Logo        : ${config.logo.path}`);
  console.log(`  Temp Dir    : ${config.upload.tempDir}`);
  console.log(`  Output Dir  : ${config.upload.outputDir}`);
  console.log('============================================\n');
});

// Set server timeout to 5 minutes (300,000ms)
// This prevents 504 Gateway Timeout during long FFmpeg processing
server.setTimeout(config.server.timeoutMs);

// Start cleanup scheduler for expired output files
startCleanupScheduler();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT received. Shutting down...');
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});

export default app;
