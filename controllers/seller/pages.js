const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');
const { getAllCategories }= require('../orders/orderController')
const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';


const addItems = async (req, res) => {
  const users = await runQuery(
      pool,
      'SELECT * FROM users WHERE id = ?',
      [req.userId]
    );
    if (users.length === 0 ) {
      return res.status(401).redirect('/register');
    }
    
  const categories = await getAllCategories();
  console.log(categories);
  const user = users[0];
  res.render('seller/add-items', {user:user, categories:categories})
}


module.exports = {
  addItems
};