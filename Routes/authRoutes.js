import express from 'express';
import authController from '../Controllers/authController.js'
import checkAuth from '../Middeleware/authMiddeleware.js'

const router = express.Router();

//Apply Middleware Here
router.use('/users/change-password',checkAuth);
router.use('/send-verification-email',checkAuth);
router.use('/self',checkAuth);

//Public Routes
router.post('/register',authController.register);
router.post('/login',authController.login);
router.post('/forgot-password',authController.forgotPassword);
router.post('/reset-password',authController.resetPassword);
router.post('/verify-email',authController.verifyEmail);

//Private Routes
router.post('/users/change-password',authController.changePassword);
router.post('/send-verification-email',authController.sendVerificationEmail);
router.get('/self',authController.selfCall);

export default router;