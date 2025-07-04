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

    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }

    const categories = await runQuery(
        pool,
        'SELECT * FROM categories',
        []
    );

    const items = await runQuery(
        pool,
        `
        SELECT
        i.id,
        i.name,
        i.image,
        i.description,
        i.price,
        ROUND(COALESCE(AVG(r.rating),0),1) AS rating
        FROM items AS i
        LEFT JOIN reviews AS r ON r.item_id = i.id
        WHERE i.status = 'available'
        GROUP BY i.id, i.name, i.image, i.description, i.price
        ORDER BY rating DESC
        LIMIT 3
        `,
        []
    );

    const recents = await runQuery(
        pool,
        `
        SELECT
        oi.id                AS oi_id,
        i.id                 AS item_id,
        i.name,
        i.image,
        i.description
        FROM order_items AS oi
        JOIN orders      AS o  ON oi.order_id = o.id
        JOIN items       AS i  ON oi.item_id  = i.id
        WHERE o.user_id = ?
        AND o.status = 'delivered'
        ORDER BY o.created_at DESC
        LIMIT 3
        `,
        [req.userId]
    );

    const user = users[0];
    res.render('user/home', { user: user, categories: categories, items: items, recents: recents });
}

const getUserOrders = async (req, res) => {
    
    const orders = await getOrderByUserId(req.userId);
    const users = await runQuery(
        pool,
        'SELECT * FROM users WHERE id = ?',
        [req.userId]
    );

    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }

    const user = users[0];

    return res.status(200).render('user/myorders', { orders: orders, user: user });
};

const getUserCart = async (req, res) => {
    const cart = await getCartByUserId(req.userId);
    const users = await runQuery(
        pool,
        'SELECT * FROM users WHERE id = ?',
        [req.userId]
    );

    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }

    const user = users[0];
    if (cart === null) {
        return res.status(200).render('user/mycart', { cart: cart, user: user });
    }
    return res.status(200).render('user/mycart', { cart: cart[0], user: user });
};

const profile = async (req, res) => {
    const users = await runQuery(
        pool,
        'SELECT * FROM users WHERE id = ?',
        [req.userId]
    );

    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }

    const user = users[0];
    res.render('user/profile', { user: user, role: req.role })
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