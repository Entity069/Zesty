const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';

const getAllOrders = async (req, res) => {
	const users = await runQuery(
		pool,
		'SELECT * FROM users WHERE id = ?',
		[req.userId]
	);

	if (users.length === 0) {
		return res.status(401).redirect('/register');
	}

	const user = users[0];
	res.render('admin/orders', { user: user });
};

const getAllUsers = async (req, res) => {
	const users = await runQuery(
		pool,
		'SELECT * FROM users WHERE id = ?',
		[req.userId]
	);

	if (users.length === 0) {
		return res.status(401).redirect('/register');
	}

	const user = users[0];
	res.render('admin/users', { user: user });
};

const getAllCategories = async (req, res) => {
	const users = await runQuery(
		pool,
		'SELECT * FROM users WHERE id = ?',
		[req.userId]
	);

	if (users.length === 0) {
		return res.status(401).redirect('/register');
	}

	const user = users[0];
	res.render('admin/categories', { user: user });
};

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
		'SELECT COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE is_paid = 1',
		[]
	);

	const [orders] = await runQuery(
		pool,
		`SELECT COUNT(*) AS orders FROM orders WHERE status = 'delivered'`,
		[]
	);

	const [userCount] = await runQuery(
		pool,
		'SELECT COUNT(*) AS userCount FROM users',
		[],
	);

	const [sellers] = await runQuery(
		pool,
		`SELECT COUNT(*) AS sellers FROM users WHERE user_type = 'seller'`,
		[],
	);

	const [items] = await runQuery(
		pool,
		'SELECT COUNT(*) AS items FROM items',
		[],
	);

	const [categories] = await runQuery(
		pool,
		'SELECT COUNT(*) AS categories FROM categories',
		[],
	);

	const [pOrder] = await runQuery(
		pool,
		`SELECT COUNT(*) AS pOrder FROM orders WHERE status = 'pending'`,
		[],
	);

	const [ratings] = await runQuery(
		pool,
		`SELECT COUNT(*) AS ratings FROM reviews`,
		[],
	);

	const user = users[0];
	res.render('admin/dashboard', { user: user, revenue:revenue, orders:orders, userCount:userCount, sellers:sellers, items:items, categories:categories, pOrder:pOrder, ratings:ratings });
};

module.exports = {
	getAllOrders,
	getAllUsers,
	getAllCategories,
	dashboard
};