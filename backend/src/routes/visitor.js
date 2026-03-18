import { Router } from 'express';
import { getAllPlannings } from '../controllers/planningController.js';

const router = Router();

router.get('/plannings', getAllPlannings);

export default router;
