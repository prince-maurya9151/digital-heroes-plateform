import { runDraw } from '../services/draw.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const simulateDraw = asyncHandler(async (req, res) => {
  res.json(await runDraw({ ...req.body, publish: false }));
});

export const publishDraw = asyncHandler(async (req, res) => {
  res.json(await runDraw({ ...req.body, publish: true }));
});
