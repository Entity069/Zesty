const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orders/orderController');
const authMiddlewares = require('../middlewares/auth');

router.post('/add-to-cart', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, orderController.addToCart);
router.post('/update-count', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, orderController.updateOrderItemCount);
router.post('/place-order', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, orderController.placeOrder);
router.post('/cancel-order', authMiddlewares.verifyToken, authMiddlewares.loginRequired, orderController.cancelOrder);
router.post('/rate', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, orderController.rateItem);

router.post('/deliver-order', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, orderController.deliverOrder);

module.exports = router;

