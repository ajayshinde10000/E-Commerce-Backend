import express from 'express';
import emailController from '../Controllers/emailController.js';

const router = express.Router();

router.get('/',emailController.enterEmail);
router.post('/verify',emailController.verifyEmail);
router.get('/:email',emailController.getEmails);
router.get('/verify/:emailId',emailController.getVerifyEmailDetails)
router.get('/reset/:emailId',emailController.getResetEmailDetails);

export default router;

