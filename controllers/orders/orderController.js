const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';

// helper functions
async function getOrderByUserId(id) {
    const rows = await runQuery(
        pool,
        `
    SELECT
      o.id            AS order_id,
      o.status        AS status,
      o.updated_at    AS updated_at,
      SUM(oi.quantity * oi.unit_price) AS total_amount,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id',         i.id,
          'name',       i.name,
          'image',      i.image,
          'description', i.description,
          'quantity',   oi.quantity,
          'unit_price', oi.unit_price
        )
      ) AS items_json
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN items i        ON i.id        = oi.item_id
    WHERE o.user_id = ? AND O.status <> 'cart'
    GROUP BY o.id
    ORDER BY o.created_at DESC;
    `,
        [id]
    );

    if (rows.length === 0) return null;

    return rows;
};

async function getCartByUserId(id) {
    const rows = await runQuery(
        pool,
        `
    SELECT
      o.id            AS order_id,
      o.status        AS status,
      o.created_at    AS created_at,
      SUM(oi.quantity * oi.unit_price) AS total_amount,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id',         i.id,
          'name',       i.name,
          'image',      i.image,
          'description', i.description,
          'quantity',   oi.quantity,
          'unit_price', oi.unit_price
        )
      ) AS items_json
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN items i        ON i.id        = oi.item_id
    WHERE o.user_id = ? AND O.status = 'cart'
    GROUP BY o.id
    ORDER BY o.created_at DESC;
    `,
        [id]
    );

    if (rows.length === 0) return null;

    return rows;
};

async function getAllCategories() {

    const rows = await runQuery(
        pool,
        'SELECT * FROM categories',
        []
    );
    if (rows.length === 0) return null;

    return rows;
};

async function getAllItems() {

    const rows = await runQuery(
        pool,
        'SELECT * FROM items',
        []
    );
    if (rows.length === 0) return null;

    return rows;
};

async function getAllOrders() {

    const rows = await runQuery(
        pool,
    `SELECT
       o.id            AS order_id,
       o.status        AS status,
       o.created_at    AS created_at,
       u.first_name    AS customer_fname,
       u.last_name     AS customer_lname,
       u.email         AS customer_email,
       SUM(oi.quantity * oi.unit_price) AS total_amount,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'id',         i.id,
           'name',       i.name,
           'quantity',   oi.quantity,
           'unit_price', oi.unit_price
         )
       ) AS items_json
     FROM orders o
     JOIN users u       ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN items i        ON i.id        = oi.item_id
     WHERE o.status <> 'cart'
     GROUP BY o.id, o.status, o.created_at, u.first_name, u.last_name, u.email
     ORDER BY o.created_at DESC;`,
        []
    );
    if (rows.length === 0) return null;

    return rows;
};

async function getOrCreateCart(userId) {
    const carts = await runQuery(
        pool,
        `SELECT id FROM orders WHERE user_id = ? AND status = 'cart'`,
        [userId]
    );
    if (carts.length > 0) {
        return carts[0].id;
    }
    
    const result = await runQuery(
        pool,
        'INSERT INTO orders (user_id) VALUES (?)',
        [userId]
    );
    return result.insertId;
};

async function syncOrderStatus(id) {

  const rows = await runQuery(
    pool,
    'SELECT status FROM order_items WHERE order_id = ?',
    [id]
  );
  console.log(rows);
  const statuses = rows.map(r => r.status);

  let nstatus;
  if (statuses.every(s => s === 'ordered')) {
    nstatus = 'ordered';
  } else if (statuses.every(s => s === 'preparing')) {
    nstatus = 'preparing';
  } else if (statuses.every(s => s === 'prepared')) {
    nstatus = 'prepared';
  } else if (statuses.includes('preparing')) {
    nstatus = 'preparing';
  } else {
    nstatus = 'ordered';
  };
  console.log(nstatus)
  await runQuery(
    pool,
    'UPDATE orders SET status = ? WHERE id = ?',
    [nstatus, id]
  );
}

// api views

const updateOrderItemCount = async (req, res) => {
    try {
        const { itemId, action } = req.body;
        const userId = req.userId;
        const cartId = await getOrCreateCart(userId);
        console.log(cartId);

        if (action === 'increase') {
            const result = await runQuery(
                pool,
                'UPDATE order_items SET quantity = quantity + 1 WHERE order_id = ? AND item_id = ?',
                [cartId, itemId]
            );

            // if (result.affectedRows === 0) {
            //   await runQuery(
            //     pool,
            //     'INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES (?, ?, 1, (SELECT price FROM items WHERE id = ?))',
            //     [cartId, itemId, itemId]
            //   );
            // }
        }
        else if (action === 'decrease') {
            await runQuery(
                pool,
                'UPDATE order_items SET quantity = quantity - 1 WHERE order_id = ? AND item_id = ? AND quantity > 0',
                [cartId, itemId]
            );
            await runQuery(
                pool,
                'DELETE FROM order_items WHERE order_id = ? AND item_id = ? AND quantity <= 0',
                [cartId, itemId]
            );

            const [{ count }] = await runQuery(
                pool,
                `SELECT COUNT(*) AS count FROM order_items WHERE order_id = ?`,
                [cartId]
            );

            if (count === 0) {

                await runQuery(
                    pool,
                    `DELETE FROM orders WHERE id = ? AND status = 'cart'`,
                    [cartId]
                );
            }
        }

        return res.status(200).json({ success: true, msg: '' });
    } catch (error) {
        console.error("updateOrderItemCount error:", error);
        return res.status(500).json({ success: false, msg: 'Internal server error.' });
    }
};

const addToCart = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const userId = req.userId;
        const cartId = await getOrCreateCart(userId);

        const existing = await runQuery(
            pool,
            'SELECT quantity FROM order_items WHERE order_id = ? AND item_id = ?',
            [cartId, itemId]
        );

        if (existing.length > 0) {
            await runQuery(
                pool,
                'UPDATE order_items SET quantity = quantity + ? WHERE order_id = ? AND item_id = ?',
                [quantity, cartId, itemId]
            );
        } else {
            await runQuery(
                pool,
                'INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES (?, ?, ?, (SELECT price FROM items WHERE id = ?))',
                [cartId, itemId, quantity, itemId]
            );
        }

        return res.status(200).json({ success: true, msg: 'Item added to cart.' });
    } catch (error) {
        console.error('addToCart error:', error);
        return res.status(500).json({ success: false, msg: 'Internal server error.' });
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const cartRows = await runQuery(
            pool,
            `SELECT id FROM orders WHERE user_id = ? AND status = 'cart'`,
            [userId]
        );
        if (!cartRows.length) {
            return res.status(400).json({ success: false, msg: 'No active cart to place order.' });
        }
        const cartId = cartRows[0].id;

        const items = await runQuery(
            pool,
            'SELECT quantity, unit_price FROM order_items WHERE order_id = ?',
            [cartId]
        );
        if (items.length <= 0) {
            return res.status(400).json({ success: false, msg: 'Cart is empty.' });
        }

        const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

        const users = await runQuery(
            pool,
            'SELECT balance FROM users WHERE id = ?',
            [userId]
        );

        if (users.length <= 0) {
            return res.status(400).json({success:false, msg: 'No user found!!'});
        }

        const balance = users[0].balance;
        console.log('balance', balance);
        if (total > balance) {
            return res.status(400).json({success:false, msg: 'Insufficient balance!'});
        }

        await runQuery( 
            pool,
            `UPDATE orders SET status = 'ordered' WHERE id = ?`,
            [cartId]
        );

        await runQuery(
            pool,
            'INSERT INTO payments (payee_id, order_id, amount, discount, is_paid) VALUES (?, ?, ?, 0, 1)',
            [userId, cartId, total]
        );

        await runQuery(
            pool,
            'UPDATE users SET balance = ? WHERE id = ?',
            [`${balance-total}`, userId]
        )

        return res.status(200).json({ success: true, msg:"Your order was placed." });
    } catch (error) {
        console.error('placeOrder error:', error);
        return res.status(500).json({ success: false, msg: 'Internal server error.' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await runQuery(
            pool,
            `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
            [orderId]
        );
        if (order.length === 0) {
            res.status(400).json({ success:false, msg:'No order found!' });
        }
        return res.status(200).json({ success:true, msg:"Your order was cancelled. But you won't be refunded." })
    } catch (error) {
        console.error('cancelOrder error:', error);
        return res.status(500).json({ success: false, msg: 'Internal server error.' });
    }
};

const deliverOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await runQuery(
            pool,
            `UPDATE orders SET status = 'delivered' WHERE id = ?`,
            [orderId]
        );
        if (order.length === 0) {
            res.status(400).json({ success:false, msg:'No order found!' });
        }
        return res.status(200).json({ success:true, msg:"Order marked as delivered." })
    } catch (error) {
        console.error('deliverOrder error:', error);
        return res.status(500).json({ success: false, msg: 'Internal server error.' });
    }
};

const rateItem = async (req, res) => {
    try {
        // so for legitimate reviews, we count the no of products ordered by the current user.
        // obv if it is > 0 then the userhas atleast once bought that item
        const { itemId, rating } = req.body;
        const count = await runQuery(
            pool,
            `
            SELECT COUNT(*) AS count
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            WHERE oi.item_id = ? AND o.user_id = ? AND o.status = 'delivered';
            `,
            [itemId, req.userId]
        );
        if (count[0].count === 0) {
            return res.status(400).json({ success:false, msg:"Have some shame. You are reviewing an item which you didn't even bought. No wonder you are a brokie."})
        }
        const reviewed = await runQuery(
            pool,
            `
            SELECT COUNT(*) AS reviewed
            FROM reviews
            WHERE user_id = ? AND item_id = ?;            
            `,
            [req.userId, itemId]
        );
        console.log(reviewed)
        if (reviewed[0].reviewed > 0) {
            return res.status(400).json({ success: false, msg: "You've already submitted a review for this item." });
        }
        await runQuery(
        pool,
        'INSERT INTO reviews (user_id, item_id, rating) VALUES (?, ?, ?)',
        [req.userId, itemId, rating]
        );
        return res.status(201).json({ success:true, msg:"Your review ws submitted!"});
    } catch (error) {
        console.error('rateItem error:', error);
        return res.status(500).json({ success: false, msg: 'Internal server error.' });
    }
}

module.exports = {
    getOrderByUserId,
    getCartByUserId,
    getAllCategories,
    getAllItems,
    getAllOrders,
    getOrCreateCart,
    syncOrderStatus,
    
    updateOrderItemCount,
    addToCart,
    placeOrder,
    cancelOrder,
    deliverOrder,
    rateItem
};
