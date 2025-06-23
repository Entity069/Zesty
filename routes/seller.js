const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller/sellerController');
const authMiddlewares = require('../middlewares/auth');
const { uploadItem } = require('../controllers/utils/upload');


router.post('/add-item', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, uploadItem.single('itemImage'), sellerController.addItem);

module.exports = router;

