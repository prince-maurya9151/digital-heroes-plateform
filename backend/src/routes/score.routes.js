import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireSubscription } from '../middleware/requireSubscription.js';
import * as c from '../controllers/score.controller.js';

const r = Router();
r.use(auth, requireSubscription);

r.get('/', c.listScores);
r.post('/', c.addScore);
r.put('/:id', c.updateScore);
r.delete('/:id', c.deleteScore);

export default r;
