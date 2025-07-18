const express = require('express');
const ejs = require('ejs');
const path = require('path')
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const orderRoutes = require('./routes/order');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/seller');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', pageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);

app.get('/test', (req, res) => {
    res.render('seller/dashboard');    
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running at http://${process.env.SITE_NAME}`);
});