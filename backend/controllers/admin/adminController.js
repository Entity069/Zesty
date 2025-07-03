const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');
const orderController = require('../orders/orderController');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';

const allOrders = async (req, res) => {
  try {
    const orders = await orderController.getAllOrders();
    return res.status(200).json({ success: true, msg:"All orders fetched successfull.", orders:orders });
  } catch (error) {
    console.error('allOrders error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

const allUsers = async (req, res) => {
  try {
    const users = await runQuery(
      pool,
      'SELECT * FROM users',
      []
    );
    return res.status(200).json({ success: true, msg:"All users fetched successfull.", users:users });
  } catch (error) {
    console.error('allUsers error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
    try {
        const { first_name, last_name, email, user_type, id } = req.body;
        await runQuery(
            pool,
            'UPDATE users SET first_name = ?, last_name = ?, email = ?, user_type = ? WHERE id = ?',
            [first_name, last_name, email, user_type, id]
        );
        return res.status(200).json({ success: true, msg: 'User updated successflly.'})
    } catch (error) {
        console.error('updateUser error:', error);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
};

const allCategories = async (req, res) => {
  try {
    const categories = await orderController.getAllCategories();
    return res.status(200).json({ success: true, msg:"All categories fetched successfull.", categories:categories });
  } catch (error) {
    console.error('allCategories error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        await runQuery(
            pool,
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        return res.status(200).json({ success: true, msg: 'Category added successflly.'})
    } catch (error) {
        console.error('addCategory error:', error);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
};

const editCategory = async (req, res) => {
    try {
        const { name, description, id } = req.body;
        await runQuery(
            pool,
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
        return res.status(200).json({ success: true, msg: 'Category updated successflly.'})
    } catch (error) {
        console.error('editCategory error:', error);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
};

module.exports = {
  allOrders,
  allUsers,
  updateUser,
  allCategories,
  addCategory,
  editCategory
};