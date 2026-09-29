import { Router } from 'express';
import videoRoutes from './video.routes';

const router = Router();

router.use('/videos', videoRoutes);

// Health check is also mounted at /api/health for convenience
router.get('/health', (_req, res) => {
  res.redirect('/api/videos/health');
});

export default router;
