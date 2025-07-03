const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const authMiddlewares = require('../middlewares/auth');

router.get('/all-orders', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminController.allOrders);
router.get('/all-users', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminController.allUsers);
router.get('/all-categories', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminController.allCategories);

router.post('/edit-user', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminController.updateUser);
router.post('/add-category', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminController.addCategory);
router.post('/edit-category', authMiddlewares.verifyToken, authMiddlewares.loginRequired, authMiddlewares.adminRequired, adminController.editCategory);

module.exports = router;