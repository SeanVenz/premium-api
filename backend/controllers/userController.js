const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserController {
    async getAllUsers(req, res) {
        try {
            const users = await User.findAll();
            res.status(200).json(users);
        } catch (error) {
            console.log('Error fetching users:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }


    async createUser(req, res) {
        try {
            const { username, password, email } = req.body;

            if (!username || !password || !email) {
                return res.status(400).json({ message: 'Username, password, and email are required.' });
            }

            const isUserExisting = await User.findOne({ where: { username } });
            const isEmailExisting = await User.findOne({ where: { email } });

            if (isEmailExisting) {
                return res.status(409).json({ message: 'Email already exists.' });
            }

            if (isUserExisting) {
                return res.status(409).json({ message: 'Username already exists.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({ username, password: hashedPassword, email, role: 'user' });
            res.status(201).json({ success: true, message: "User successfully registered." });
        } catch (error) {
            console.log('Error creating user:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async loginUser(req, res) {
        const { username, email, password } = req.body;
        console.log('Login attempt:', username, email, password);

        if (!password) {
            return res.status(400).json({ message: 'Password is required.' });
        }

        if (!username && !email) {
            return res.status(400).json({ message: 'Username or email is required.' });
        }

        // Find user by username or email
        let whereCondition = {};
        if (username) {
            whereCondition = { username };
        } else if (email) {
            whereCondition = { email };
        }

        const isUserExisting = await User.findOne({ where: whereCondition });

        if (!isUserExisting) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const validPassword = await bcrypt.compare(password, isUserExisting.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign({ id: isUserExisting.id, username: isUserExisting.username }, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            maxAge: 3600000,
        });

        res.status(200).json({
            message: 'Login successful',
            success: true,
            user: {
                id: isUserExisting.id,
                username: isUserExisting.username,
                email: isUserExisting.email
            },
            token
        });
    }

    async getCurrentUser(req, res) {
        try {
            const token = req.cookies.token;
            console.log(token);

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Please Login."
                });
            }

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findByPk(decodedToken.id, {
                attributes: ['id', 'username', 'email', 'createdAt', 'updatedAt']
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not Found"
                })
            }

            res.status(200).json({
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            })
        } catch (error) {
            if (error.name === 'JsonWebTokenERror') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Token'
                });
            }
            else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.'
                })
            }
        }
    }

    async logoutUser(req, res) {
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful.' });
    }
}

module.exports = UserController;