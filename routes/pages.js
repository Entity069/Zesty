const express = require('express');
const router = express.Router();

const userPages = require('../controllers/user/pages');
const orderPages = require('../controllers/orders/pages');
const adminPages = require('../controllers/admin/pages');
const sellerPages = require('../controllers/seller/pages');

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
router.get('/item', authMiddlewares.verifyToken, authMiddlewares.loginRequired, orderPages.itemDetails);

router.get('/all-orders', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllOrders);
router.get('/all-users', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllUsers);
router.get('/all-categories', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllCategories);

router.get('/add-items', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerPages.addItems);
router.get('/manage-items', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerPages.manageItems);
router.get('/edit-items', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerPages.editItems);
router.get('/current-orders', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerPages.ordersDashboard);

module.exports = router;