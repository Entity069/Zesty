const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');
const { getAllCategories } = require('../orders/orderController')
const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';


const dashboard = async (req, res) => {
    const users = await runQuery(
        pool,
        'SELECT * FROM users WHERE id = ?',
        [req.userId]
    );
    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }

    const [revenue] = await runQuery(
    pool,
    `
    SELECT COALESCE(SUM(oi.unit_price * oi.quantity),0) AS revenue
    FROM order_items oi
    JOIN items i  ON oi.item_id = i.id
    JOIN orders o ON oi.order_id = o.id
    WHERE i.seller_id = ?
    AND o.status <> 'cart';
    `,
    [req.userId]
    );

    const [items] = await runQuery(
        pool,
        'SELECT COUNT(*) AS items FROM items WHERE seller_id = ?',
        [req.userId]
    );

    const [orders] = await runQuery(
        pool,
        `
        SELECT COUNT(DISTINCT o.id) AS orders
        FROM order_items oi
        JOIN items i  ON oi.item_id = i.id
        JOIN orders o ON oi.order_id = o.id
        WHERE i.seller_id = ?
        AND o.status  <> 'cart'
        `,
        [req.userId]
    );

    const [catered] = await runQuery(
        pool,
        `
        SELECT COUNT(DISTINCT o.user_id) AS catered
        FROM order_items oi
        JOIN items i  ON oi.item_id = i.id
        JOIN orders o ON oi.order_id = o.id
        WHERE i.seller_id = ?
        AND o.status  <> 'cart'
        `,
        [req.userId]
    );
    console.log(revenue);
    const user = users[0];
    res.render('seller/dashboard', { user: user, revenue: revenue, items: items, orders: orders, catered: catered });
}

const addItems = async (req, res) => {
    const users = await runQuery(
        pool,
        'SELECT * FROM users WHERE id = ?',
        [req.userId]
    );
    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }
    
    const categories = await getAllCategories();
    console.log(categories);
    const user = users[0];
    res.render('seller/add-items', { user: user, categories: categories });
}

const manageItems = async (req, res) => {
    const users = await runQuery(
        pool,
        'SELECT * FROM users WHERE id = ?',
        [req.userId]
    );
    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }

    const user = users[0];
    res.render('seller/manage-items', { user: user })
}

const editItems = async (req, res) => {
    const users = await runQuery(
        pool,
        'SELECT * FROM users WHERE id = ?',
        [req.userId]
    );
    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }

    const id = req.query.id;
    if (!id || id === '') {
        return res.redirect('/home')
    }
    const item = await runQuery(
        pool,
        `
        SELECT 
            items.*, 
            categories.name AS cname,
            ROUND(COALESCE(AVG(reviews.rating), 0), 1)    AS rating
        FROM items
        LEFT JOIN categories ON items.category_id = categories.id
        LEFT JOIN reviews    ON reviews.item_id = items.id
        WHERE items.id = ?
        GROUP BY items.id
        `,
        [id]
    );
    console.log(item)
    if (req.userId !== item[0].seller_id) {
        return res.render('error');
    }
    
    const categories = await getAllCategories();
    const user = users[0];
    res.render('seller/edit-items', { user: user, item:item[0], categories: categories })
}


module.exports = {
    dashboard,
    addItems,
    manageItems,
    editItems
};