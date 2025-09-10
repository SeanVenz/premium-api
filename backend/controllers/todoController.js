const Todo = require('../models/Todo');

class TodoController {
    // Create a new todo
    async createTodo(req, res) {
        try {
            const { userId, title } = req.body;
            
            if (!userId || !title) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'userId and title are required' 
                });
            }

            const todo = await Todo.create({
                userId,
                title,
                completed: false
            });

            res.status(201).json({
                success: true,
                data: todo
            });
        } catch (error) {
            console.error('Error creating todo:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating todo'
            });
        }
    }

    // Get all todos
    async getAllTodos(req, res) {
        try {
            const todos = await Todo.findAll({
                order: [['createdAt', 'DESC']] // Most recent first
            });

            res.json({
                success: true,
                data: todos
            });
        } catch (error) {
            console.error('Error fetching all todos:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching todos'
            });
        }
    }

    // Get all todos for a user
    async getTodosByUser(req, res) {
        try {
            const { userId } = req.params;
            
            const todos = await Todo.findAll({
                where: { userId: parseInt(userId) },
                order: [['createdAt', 'DESC']] // Most recent first
            });

            res.json({
                success: true,
                data: todos
            });
        } catch (error) {
            console.error('Error fetching todos:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching todos'
            });
        }
    }

    // Get a single todo
    async getTodo(req, res) {
        try {
            const { id } = req.params;
            
            const todo = await Todo.findByPk(id);
            
            if (!todo) {
                return res.status(404).json({
                    success: false,
                    message: 'Todo not found'
                });
            }

            res.json({
                success: true,
                data: todo
            });
        } catch (error) {
            console.error('Error fetching todo:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching todo'
            });
        }
    }

    // Update a todo
    async updateTodo(req, res) {
        try {
            const { id } = req.params;
            const { title, completed } = req.body;
            console.log('Here',title, completed)

            const todo = await Todo.findByPk(id);

            if (!todo) {
                return res.status(404).json({
                    success: false,
                    message: 'Todo not found'
                });
            }

            // Update only provided fields
            if (title !== undefined) todo.title = title;
            if (completed !== undefined) todo.completed = completed;

            await todo.save();

            res.json({
                success: true,
                data: todo
            });
        } catch (error) {
            console.error('Error updating todo:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating todo'
            });
        }
    }

    // Delete a todo
    async deleteTodo(req, res) {
        try {
            const { id } = req.params;
            
            const todo = await Todo.findByPk(id);
            
            if (!todo) {
                return res.status(404).json({
                    success: false,
                    message: 'Todo not found'
                });
            }

            await todo.destroy();

            res.json({
                success: true,
                message: 'Todo deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting todo:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting todo'
            });
        }
    }
}

module.exports = TodoController;
