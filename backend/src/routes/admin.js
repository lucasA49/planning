import { Router } from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';
import * as locationController from '../controllers/locationController.js';
import * as worksiteTypeController from '../controllers/worksiteTypeController.js';
import * as planningController from '../controllers/planningController.js';

const router = Router();

router.use(verifyToken, isAdmin);

// Account (own profile)
router.get('/account', userController.getAccount);
router.put('/account', userController.updateAccount);

// Users
router.get('/users', userController.getAll);
router.post('/users', userController.create);
router.get('/users/:id', userController.getById);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.deleteUser);

// Locations
router.get('/locations', locationController.getAll);
router.post('/locations', locationController.create);
router.get('/locations/:id', locationController.getById);
router.put('/locations/:id', locationController.update);
router.delete('/locations/:id', locationController.deleteLocation);

// Worksite Types
router.get('/worksite-types', worksiteTypeController.getAll);
router.post('/worksite-types', worksiteTypeController.create);
router.get('/worksite-types/:id', worksiteTypeController.getById);
router.put('/worksite-types/:id', worksiteTypeController.update);
router.delete('/worksite-types/:id', worksiteTypeController.deleteWorksiteType);

// Stats
router.get('/stats', planningController.getStats);
router.get('/stats/attendance', planningController.getAttendance);

// Plannings
router.get('/plannings', planningController.getAll);
router.post('/plannings', planningController.create);
router.get('/plannings/:id', planningController.getById);
router.put('/plannings/:id', planningController.update);
router.delete('/plannings/:id', planningController.deletePlanning);
router.post('/plannings/:id/users', planningController.addUserToPlanning);
router.delete('/plannings/:id/users/:userId', planningController.removeUserFromPlanning);

export default router;
