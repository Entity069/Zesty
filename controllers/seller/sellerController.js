const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { pool, runQuery } = require('../../config/db');
const orderController = require('../orders/orderController');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';

const addItem = async (req, res) => {
    const deleteFile = () => {
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('yay:', req.file.path);
            } catch (err) {
                console.error('fuck:', err);
            }
        }
    };

    try { 
        const { name, description, price, category, status } = req.body;
        if (!name || !description || !price || !category || !status) {
            deleteFile();
            return res.status(400).json({success: false, msg: 'Please input all the fields'});
        }
        const image = `/uploads/item-images/${req.file.filename}`;

        await runQuery(
            pool,
            'INSERT INTO items (seller_id, name, description, price, category_id, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.userId, name, description, price, category, status, image]
        );

        return res.status(200).json({ success: true, msg: 'Item added successflly.'})
    } catch (error) {
        console.error('addItem error:', error);
        deleteFile();
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
}

const getSellerItems = async (req, res) => {
    try {
        const items = await runQuery(
            pool,
            `
            SELECT 
                items.*, 
                categories.name AS cname,
                ROUND(COALESCE(AVG(reviews.rating), 0), 1)    AS rating
            FROM items
            LEFT JOIN categories ON items.category_id = categories.id
            LEFT JOIN reviews    ON reviews.item_id = items.id
            WHERE items.seller_id = ?
            GROUP BY items.id
            `,
            [req.userId]
        );
        return res.status(200).json({ success:true, msg:'All items fetched successfully!', items:items })

    } catch (error) {
        console.error("getSellerITems error:", error);
        return res.status(500).json({ success:false, msg: 'An internal server error occured!'})
    }
}

const updateItems = async (req, res) => {
    const deleteFile = () => {
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('yay:', req.file.path);
                } catch (err) {
                    console.error('fuck:', err);
                }
            }
        };

    try {
        const { id, name, price, description, category, status } = req.body;
        
        if (!name || !description || !price || !category || !status) {
            deleteFile();
            return res.status(400).json({success: false, msg: 'Please input all the fields'});
        }

        const items = await runQuery(
            pool,
            'SELECT * FROM items WHERE id = ?',
            [id]
        );

        if (items.length === 0) {
            deleteFile();
            return res.status(400).json({ success:false, msg:"No such item exists!"})
        }

        const item = items[0];
        if (item.seller_id !== req.userId) {
            deleteFile();
            return res.status(400).json({ success:false, msg:"Go away and never show your face!"})
        }
        
        const image = req.file ? `/uploads/item-images/${req.file.filename}` : item.image; 
        
        await runQuery(
            pool,
            'UPDATE items SET name = ?, price = ?, description = ?, category_id = ?, status = ?, image = ? WHERE id = ?',
            [name, price, description, category, status, image, id]
        );

        return res.status(200).json({ success: true, msg: 'Item edited successflly.'})

    } catch (error) {
        console.error("editItems error:", error);
        return res.status(500).json({ success:false, msg: 'An internal server error occured!'})
    }
};

const getSellerOrders = async (req, res) => {
    try {
        const orders = await runQuery(
            pool,
            `
            SELECT
            o.id               AS id,
            o.created_at       AS created_at,
            o.status           AS status,
            o.message          AS message,

            c.id               AS uid,
            c.first_name       AS cfname,
            c.last_name        AS clname,
            c.email            AS cemail,
            c.address          AS caddr,

            JSON_ARRAYAGG(
                JSON_OBJECT(
                'item_id',      oi.id,
                'name',         i.name,
                'quantity',     oi.quantity,
                'unit_price',   oi.unit_price,
                'item_status',  oi.status,
                'image',        i.image
                )
            ) AS my_items

            FROM orders AS o
            JOIN order_items AS oi ON oi.order_id = o.id
            JOIN items AS i  ON i.id = oi.item_id
            AND i.seller_id = ? AND o.status <> 'cancelled' AND o.status <> 'cart'
            JOIN users AS c ON c.id = o.user_id
            GROUP BY o.id, o.created_at, o.status, o.message, c.id, c.first_name, c.last_name, c.email, c.address
            ORDER BY o.created_at DESC;

            `,
            [req.userId]
        );
        console.log(orders)
        return res.status(200).json({ success:true, msg:'All items fetched successfully!', orders:orders })

    } catch (error) {
        console.error("getSellerITems error:", error);
        return res.status(500).json({ success:false, msg: 'An internal server error occured!'})
    }
}

const updateItemStatus = async (req, res) => {
    try {

        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success:false, msg:"Both previous status and item id are required."})
        }

        const rows = await runQuery(
            pool,
            'SELECT status, order_id FROM order_items WHERE id = ?',
            [id]
        );
        const status = rows[0].status === 'ordered' ? 'preparing' : rows[0].status === 'preparing' ? 'prepared' : rows[0].status;

        await runQuery(
            pool,
            'UPDATE order_items SET status = ? WHERE id = ?',
            [status, id]
        );
        await orderController.syncOrderStatus(rows[0].order_id);
        return res.status(200).json({ success:true, msg:'Item status updated!' })
    } catch (error) {
        console.error("updateItemStatus error:", error);
        return res.status(500).json({ success:false, msg: 'An internal server error occured!'})
    }
}

module.exports = {
    addItem,
    getSellerItems,
    updateItems,
    getSellerOrders,
    updateItemStatus
};