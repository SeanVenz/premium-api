const express = require('express');
const TodoController = require('../controllers/todoController');

const router = express.Router();
const todoController = new TodoController();

// Create a new todo
router.post('/', (req, res) => todoController.createTodo(req, res));

// Get all todos
router.get('/', (req, res) => todoController.getAllTodos(req, res));

// Get all todos for a user
router.get('/user/:userId', (req, res) => todoController.getTodosByUser(req, res));

// Get a single todo
router.get('/:id', (req, res) => todoController.getTodo(req, res));

// Update a todo
router.put('/:id', (req, res) => todoController.updateTodo(req, res));

// Delete a todo
router.delete('/:id', (req, res) => todoController.deleteTodo(req, res));

module.exports = router;
