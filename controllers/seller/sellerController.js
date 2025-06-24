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
}

module.exports = {
    addItem,
    getSellerItems,
    updateItems
};