import express from 'express'
import shopUserController from '../Controllers/shopUserController.js';
import ShopAuthController from '../Controllers/shopAuth.js';
import checkShopAuth from '../Middeleware/shopAuthMiddeleware.js'
const router = express.Router();

router.use('/auth/self',checkShopAuth);

//public Apis
router.get('/',shopUserController.getUser);
router.post('/auth/register',ShopAuthController.register);
router.post('/auth/login',ShopAuthController.login);

//private Apis
router.get('/auth/self',ShopAuthController.selfCall);



export default router;