import { Request, Response, NextFunction } from 'express';
import { splitVideo } from '../services/split.service';
import { deleteFiles } from '../services/cleanup.service';

/**
 * POST /api/videos/split
 * Accepts 1 uploaded video and splits it into equal parts or a timestamp range.
 */
export async function splitHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    res.status(400).json({
      error: 'Missing file',
      message: 'Please upload a video file to split.',
    });
    return;
  }

  const { splitMode, partCount, startTime, endTime } = req.body;

  try {
    console.log(`[Controller] Split request for file: ${file.originalname}`);

    const result = await splitVideo(file.path, splitMode || 'equal_parts', {
      partCount: partCount ? parseInt(String(partCount), 10) : 2,
      startTime: startTime ? String(startTime) : '0',
      endTime: endTime ? String(endTime) : undefined,
    });

    // Clean up temp file
    deleteFiles([file.path]);

    res.status(200).json(result);
  } catch (err) {
    deleteFiles([file.path]);
    next(err);
  }
}
