const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';

const getAllOrders = async (req, res) => {
    const users = await runQuery(
      pool,
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0 ) {
      return res.status(401).redirect('/register');
    }

    const user = users[0];
  res.render('admin/orders', {user:user});
};

const getAllUsers = async (req, res) => {
    const users = await runQuery(
      pool,
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0 ) {
      return res.status(401).redirect('/register');
    }

    const user = users[0];
  res.render('admin/users', {user:user});
};

const getAllCategories = async (req, res) => {
    const users = await runQuery(
      pool,
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0 ) {
      return res.status(401).redirect('/register');
    }

    const user = users[0];
  res.render('admin/categories', {user:user});
};


module.exports = {
  getAllOrders,
  getAllUsers,
  getAllCategories
};