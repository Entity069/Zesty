const express = require('express');
const router = express.Router();

const userPages = require('../controllers/user/pages');
const orderPages = require('../controllers/orders/pages');
const adminPages = require('../controllers/admin/pages');

const authMiddlewares = require('../middlewares/auth');

router.get('/', authMiddlewares.redirectIfIn, userPages.register);
router.get('/register', authMiddlewares.redirectIfIn, userPages.register);
router.get('/verified', authMiddlewares.redirectIfIn, userPages.verifiedEmail);
router.get('/pwd-reset', authMiddlewares.redirectIfIn, userPages.reset);

router.get('/home', authMiddlewares.verifyToken, authMiddlewares.loginRequired, userPages.home);
router.get('/my-orders', authMiddlewares.verifyToken, authMiddlewares.loginRequired, userPages.getUserOrders);
router.get('/my-cart', authMiddlewares.verifyToken, authMiddlewares.loginRequired, userPages.getUserCart);
router.get('/my-profile', authMiddlewares.verifyToken, authMiddlewares.loginRequired, userPages.profile);

router.get('/search', authMiddlewares.verifyToken, authMiddlewares.loginRequired, orderPages.search);
router.get('/order-placed', authMiddlewares.verifyToken, authMiddlewares.loginRequired, orderPages.placeOrder);

router.get('/all-orders', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllOrders);
router.get('/all-users', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllUsers);
router.get('/all-categories', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllCategories);

module.exports = router;