const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const user = new userController();

router.get('/' ,user.getAllUsers);
router.post('/register', user.createUser);
router.post('/login', user.loginUser);
router.get('/me', user.getCurrentUser);
router.get('/profile', user.getCurrentUser);
router.post('/logout', user.logoutUser);

module.exports = router;