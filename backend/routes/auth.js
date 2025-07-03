const express = require('express');
const router = express.Router();
const authController = require('../controllers/user/authController');
const userPages = require('../controllers/user/pages');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get('/verify', authController.verifyEmail);
router.post('/forgot-password', authController.resetPassword);
router.post('/reset-password', authController.postResetPassword);

module.exports = router;