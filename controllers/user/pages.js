const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');
const { getOrderByUserId, getCartByUserId } = require('../orders/orderController');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';


// Auth Pages
const register = async (req, res) => {
  res.render('register');
};

const verifiedEmail = async (req, res) => {
  res.render('verified');
};

// display password reset page
const reset = async (req, res) => {
  res.render('pwd-reset');
}

///////////////////////////////////////////

// User pages

const home = async (req, res) => {
  const users = await runQuery(
      pool,
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0 ) {
      return res.status(401).redirect('/register');
    }

    const user = users[0];
  res.render('user/home', {user:user})
}

const getUserOrders = async (req, res) => {
  console.log(req.userId);
    const orders = await getOrderByUserId(req.userId);
    const users = await runQuery(
      pool,
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0 ) {
      return res.status(401).redirect('/register');
    }

    const user = users[0];

    return res.status(200).render('user/myorders', { orders: orders, user:user });
};

const getUserCart = async (req, res) => {
  console.log(req.userId);
    const cart = await getCartByUserId(req.userId);
    const users = await runQuery(
      pool,
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0 ) {
      return res.status(401).redirect('/register');
    }

    const user = users[0];
    if (cart === null) {
      return res.status(200).render('user/mycart', { cart: cart, user:user });
    }
    return res.status(200).render('user/mycart', { cart: cart[0], user:user });
};

const profile = async (req, res) => {
  const users = await runQuery(
      pool,
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0 ) {
      return res.status(401).redirect('/register');
    }

    const user = users[0];
  res.render('user/profile', {user:user})
}


module.exports = {
  register,
  verifiedEmail,
  reset,
  home,
  getUserOrders,
  getUserCart,
  profile
};