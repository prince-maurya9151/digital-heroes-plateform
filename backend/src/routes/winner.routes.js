import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';
import { signProofs } from '../utils/proofs.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const r = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const uploadProof = (req, res, next) =>
  upload.single('proof')(req, res, (err) => {
    if (err) return next(new AppError(err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 4 MB' : err.message));
    next();
  });

r.use(auth);

r.get('/mine', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('winners').select('*, draws(month, numbers)').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) throw error;
  res.json(await signProofs(data));
}));

r.post('/:id/proof', uploadProof, asyncHandler(async (req, res) => {
  if (!req.file || !ALLOWED.includes(req.file.mimetype)) throw new AppError('Please upload a JPG, PNG or WebP image');
  const { data: w } = await supabase.from('winners').select('*').eq('id', req.params.id).eq('user_id', req.user.id).maybeSingle();
  if (!w) throw new AppError('Winning record not found', 404);
  if (w.verify_status === 'approved') throw new AppError('This win is already approved');

  const path = `${req.user.id}/${w.id}-${Date.now()}`;
  const { error: upErr } = await supabase.storage.from('proofs').upload(path, req.file.buffer, { 
    contentType: req.file.mimetype 
  });
  if (upErr) throw upErr;

  const { data, error } = await supabase.from('winners').update({
     proof_url: path, verify_status: 'pending' 
    }).eq('id', w.id).select().single();
  if (error) throw error;

  if (w.proof_url && !/^https?:\/\//.test(w.proof_url)) await supabase.storage.from('proofs').remove([w.proof_url]);
  res.json(await signProofs(data));
}));

export default r;
