import express from 'express';
import sellerOrderController from '../Controllers/sellerOrderController.js';
import checkAuth from '../Middeleware/authMiddeleware.js';

const router = express.Router();

router.use('/',checkAuth);
router.use('/:orderId',checkAuth);
router.use('/:action/:orderId',checkAuth);


router.get('/',sellerOrderController.getOrders);
router.get('/:orderId',sellerOrderController.orderDetails);
router.patch('/:action/:orderId',sellerOrderController.changeAction);

export default router;