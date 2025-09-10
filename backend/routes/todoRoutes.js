const express = require('express');
const TodoController = require('../controllers/todoController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();
const todoController = new TodoController();

// Create a new todo
router.post('/', authenticateToken, todoController.createTodo);

// Get all todos
router.get('/', authenticateToken, todoController.getAllTodos);

// Get all todos for a user
router.get('/user/:userId', authenticateToken, todoController.getTodosByUser);

// Get a single todo
router.get('/:id', authenticateToken, todoController.getTodo);

// Update a todo
router.put('/:id', authenticateToken, todoController.updateTodo);

// Delete a todo
router.delete('/:id', authenticateToken, todoController.deleteTodo);

module.exports = router;
