const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller/sellerController');
const authMiddlewares = require('../middlewares/auth');
const { uploadItem } = require('../controllers/utils/upload');

router.get('/all-items', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerController.getSellerItems);
router.get('/current-orders', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerController.getSellerOrders);

router.post('/add-item', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, uploadItem.single('itemImage'), sellerController.addItem);
router.post('/edit-item', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, uploadItem.single('itemImage'), sellerController.updateItems);
router.post('/current-orders/update', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, uploadItem.single('itemImage'), sellerController.updateItemStatus);

module.exports = router;

