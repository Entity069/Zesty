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
        if (!name || !price || !category || !status) {
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

module.exports = {
    addItem
};