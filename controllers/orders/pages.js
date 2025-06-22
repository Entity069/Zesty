const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';

const search = async (req, res) => {
    const users = await runQuery(
      pool,
      'SELECT id, first_name, last_name, profile_pic FROM users WHERE id = ?',
      [req.userId]
    );
    if (users.length === 0) {
      return res.status(401).redirect('/register');
    }
    const user = users[0];

    const q = (req.query.q || '');
    if (!q) {
      const items = await runQuery(
        pool,
        `
        SELECT
        i.id,
        i.name,
        i.image,
        i.description,
        i.price,
        c.name AS category
      FROM items i
      JOIN categories c ON c.id = i.category_id
      WHERE i.status = 'available'
      ORDER BY i.name
      LIMIT 100
      `,
      []
      );
      return res.render('user/search', { user:user, items: items, q: '' });
    }

    const regex = `%${q.replace(/%/g, '\\%')}%`;
    const items = await runQuery(
      pool,
      `
      SELECT
        i.id,
        i.name,
        i.image,
        i.description,
        i.price,
        c.name AS category
      FROM items i
      JOIN categories c ON c.id = i.category_id
      WHERE i.status = 'available'
        AND (i.name       LIKE ?
          OR i.description LIKE ?)
      ORDER BY i.name
      LIMIT 50
      `,
      [regex, regex]
    );

    res.render('user/search', { user:user, items:items, q:q });
};

const placeOrder = async (req, res) => {
  const orderId = (req.query.orderId);
  const amount = (req.query.amount);
  console.log(amount);
  await runQuery(
    pool,
    `UPDATE orders SET status = 'ordered' where id = ?`,
    [orderId]
  );
  res.render('user/order-placed', { orderId:orderId, amount:amount })

}
module.exports = {
    search,
    placeOrder
};