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
        return res.render('user/search', { user: user, items: items, q: '' });
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

    res.render('user/search', { user: user, items: items, q: q });
};


const itemDetails = async (req, res) => {
    const users = await runQuery(
        pool,
        'SELECT * FROM users WHERE id = ?',
        [req.userId]
    );
    if (users.length === 0) {
        return res.status(401).redirect('/register');
    }

    const itemId = req.query.id || '';

    if (itemId === '') {
        return res.redirect('/search')
    }

    const items = await runQuery(
        pool,
        `
        SELECT
        i.id               AS id,
        i.name             AS name,
        i.image            AS image,
        i.description      AS description,
        i.price            AS price,
        i.status           AS status,
        u.first_name       AS fname,
        u.last_name        AS lname,
        c.name             AS cname,
        ROUND(COALESCE(AVG(r.rating), 0), 1)      AS rating
        FROM items      AS i
        INNER JOIN users      AS u ON i.seller_id   = u.id
        INNER JOIN categories AS c ON i.category_id = c.id
        LEFT  JOIN reviews    AS r ON r.item_id     = i.id
        WHERE i.id = ?
        GROUP BY
        i.id, i.name, i.image, i.description, i.price, i.status, i.created_at,
        u.id, u.first_name, u.last_name,
        c.id, c.name, c.description;
        `,
        [itemId]
    );

    if (items.length === 0) {
        return res.redirect('/search')
    }
    console.log(items)
    res.render('user/item', { user: users[0], item: items[0] })
}

module.exports = {
    search,
    itemDetails
};