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

router.get('/home', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, userPages.home);
router.get('/my-orders', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, userPages.getUserOrders);
router.get('/my-cart', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, userPages.getUserCart);
router.get('/my-profile', authMiddlewares.verifyToken, authMiddlewares.loginRequired, userPages.profile);

router.get('/search', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, orderPages.search);
router.get('/item', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.userRequired, orderPages.itemDetails);
router.get('/categories', authMiddlewares.verifyToken, authMiddlewares.loginRequired, orderPages.allCategories);
router.get('/categories/:category', authMiddlewares.verifyToken, authMiddlewares.loginRequired, orderPages.categoryItems);

router.get('/admin/dashboard', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.dashboard);
router.get('/admin/all-orders', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllOrders);
router.get('/admin/all-users', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllUsers);
router.get('/admin/all-categories', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllCategories);
router.get('/admin/all-items', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminPages.getAllItems);

router.get('/seller/dashboard', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerPages.dashboard);
router.get('/seller/add-items', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerPages.addItems);
router.get('/seller/manage-items', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerPages.manageItems);
router.get('/seller/edit-items', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.sellerRequired, sellerPages.editItems);

module.exports = router;