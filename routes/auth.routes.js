const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const authValidator = require('../validators/auth.validator');

// Public routes
router.post('/register', validateBody(authValidator.register), authController.register);
router.post('/login', validateBody(authValidator.login), authController.login);
router.post('/forgot-password', validateBody(authValidator.forgotPassword), authController.forgotPassword);
router.patch('/reset-password/:token', validateBody(authValidator.resetPassword), authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes (require login)
router.use(protect);
router.get('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.patch('/update-password', validateBody(authValidator.updatePassword), authController.updatePassword);

module.exports = router;