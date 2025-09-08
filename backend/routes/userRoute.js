const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const user = new userController();
const authenticateToken = require('../middleware/authMiddleware');

router.get('/' ,user.getAllUsers);
router.post('/register', user.createUser);
router.post('/login', user.loginUser);
router.get('/me', user.getCurrentUser);
router.get('/profile', authenticateToken, user.getCurrentUser);
router.post('/logout', user.logoutUser);
router.get('/verify/:token', user.verifyEmail);
router.post('/resend-verification', user.resendVerification);
router.post('/forgot-password', user.forgotPassword);
router.post('/reset-password/:token', user.resetPassword);
router.put('/edit/:id', user.editUser);
router.delete('/delete/:id', user.deleteUser);

router.get("/profile", authenticateToken, user.getProfile);
module.exports = router;