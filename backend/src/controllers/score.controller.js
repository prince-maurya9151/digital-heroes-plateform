import * as scoreService from '../services/score.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listScores = asyncHandler(async (req, res) => {
  res.json(await scoreService.listScores(req.user.id));
});
export const addScore = asyncHandler(async (req, res) => {
  res.status(201).json(await scoreService.addScore(req.user.id, req.body));
});
export const updateScore = asyncHandler(async (req, res) => {
  res.json(await scoreService.updateScore(req.user.id, req.params.id, req.body));
});
export const deleteScore = asyncHandler(async (req, res) => {
  await scoreService.deleteScore(req.user.id, req.params.id);
  res.json({ ok: true });
});
