const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');

// Public routes
router.post('/register', validate(schemas.userRegister), authController.register);
router.post('/login', validate(schemas.userLogin), authController.login);

// Protected routes
router.use(verifyToken); // All routes below require authentication

router.get('/me', authController.getMe);
router.patch('/me', authController.updateMe);
router.post('/change-password', authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;

