const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';


const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).redirect('/register');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.role = decoded.role
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).redirect('/register');
  }
};

const redirectIfIn = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect('/home');
    } catch {
      res.clearCookie('token');
    }
  }
  next();
};

const loginRequired = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).redirect('/register');
  }
};

const roleRequired = (role) => (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const data = jwt.verify(token, JWT_SECRET);
    if (data.role !== role) {
      return res.status(403).render('error');
    }
    req.user = data;
    next();
  } catch {
     res.clearCookie('token');
    return res.status(401).redirect('/register');
  }
};

const userRequired = roleRequired('user');
const adminRequired = roleRequired('admin');
const sellerRequired = roleRequired('seller');

module.exports = {
  verifyToken,
  redirectIfIn,
  loginRequired,
  userRequired,
  adminRequired,
  sellerRequired
};
