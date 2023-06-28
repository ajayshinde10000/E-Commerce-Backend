import express from 'express';
import checkAuth from '../Middeleware/authMiddeleware.js'
import userController from '../Controllers/userController.js';

const router = express.Router();

router.use('/',checkAuth);

//public Routes


//Protected Routes
router.get('/',userController.getUsers);


export default router;