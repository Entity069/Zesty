const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, runQuery } = require('../../config/db');
const Emailer = require('../utils/emailer.js');

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';
const mailer = new Emailer();

// https://stackoverflow.com/a/38552302
function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

const register = async (req, res) => {
    try {
        const profilePic = 'https://s3.tebi.io/zesty-test/80216737.jpeg';
        const { first_name, last_name, password, email, address } = req.body;

        if (!first_name || !last_name || !email || !password || !address) {
            return res.status(400).json({ success: false, msg: 'Some fields are missing!' });
        }

        const existing = await runQuery(pool, 'SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, msg: 'User already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO users (profile_pic, first_name, last_name, password, email, address) VALUES (?, ?, ?, ?, ?, ?)';

        const params = [profilePic, first_name, last_name, hashedPassword, email, address];

        try {
            await mailer.send(
                email,
                'Action Required [Zesty]',
                'views/email/confirm.ejs',
                { activation_url: `http://${process.env.SITE_NAME}/api/auth/verify?token=${jwt.sign({ "email": email }, JWT_SECRET, { expiresIn: '1d' })}` }
            );
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            return res.status(500).json({ success: false, msg: 'Failed to send confirmation email.' });
        }

        await runQuery(pool, query, params);

        return res.status(201).json({ success: true, msg: 'User registered successfully! Please check your email for a confirmation email.' });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, msg: 'Email and password are required!' });
        }

        const users = await runQuery(
            pool,
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ success: false, msg: 'Invalid Credentials!' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!user.is_verified) {
            return res.status(400).json({ success: false, msg: 'You need to activate your acount first.' });
        }

        if (!isValidPassword) {
            return res.status(400).json({ success: false, msg: 'Invalid Credentials!' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.user_type },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false, //true,
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        return res.status(201).json({ success: true, msg: 'You will be redirected in a minute...' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, msg: 'An internal server error occured!' });
    }
};

const logout = (req, res) => {
    res.clearCookie('token', { path: '/' });
    res.redirect('/');
};


const verifyEmail = async (req, res) => {
    try {
        const token = req.query.token;
        const email = parseJwt(token).email;
        
        try {
            jwt.verify(token, JWT_SECRET);
            await runQuery(
                pool,
                'UPDATE users SET is_verified = 1 WHERE email = ?',
                [email]
            );
            return res.redirect('/verified');
        } catch (error) {
            return res.status(401).json({ success: false, msg: 'Invalid token!' });
        }
    } catch (error) {
        console.error('verifyEmail error:', error);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
}

// for sending password reset requests
const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        const users = await runQuery(
            pool,
            'SELECT password, updated_at FROM users where email = ?',
            [email]
        )
        if (users.length === 0) {
            return res.status(400).json({ success: false, msg: 'Invalid user!' });
        }
        const user = users[0];
        const KEY = `${user.password}${user.updated_at}`;

        try {
            await mailer.send(
                email,
                'Action Required [Zesty]',
                'views/email/forgot.ejs',
                { reset_url: `http://${process.env.SITE_NAME}/pwd-reset?token=${jwt.sign({ "email": email }, KEY, { expiresIn: '1d' })}` }
            );
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            return res.status(500).json({ success: false, msg: 'Failed to send password reset email.' });
        }

        return res.status(200).json({ success: true, msg: 'An email has been send to your email.' });

    } catch (error) {
        console.error('resetPassword error:', resetPassword);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
}

// update password on reset
const postResetPassword = async (req, res) => {
    try {
        const token = req.query.token;
        const email = jwt.decode(token).email;
        const { password } = req.body;
        
        const users = await runQuery(
            pool,
            'SELECT password, updated_at FROM users where email = ?',
            [email]
        )
        if (users.length === 0) {
            return res.status(400).json({ success: false, msg: 'Invalid user!' });
        }
        const user = users[0];
        const KEY = `${user.password}${user.updated_at}`;
        const newPwd = await bcrypt.hash(password, 10);
        try {
            jwt.verify(token, KEY);
            await runQuery(
                pool,
                'UPDATE users SET password = ? where email = ?',
                [newPwd, email]
            )
            return res.status(200).json({ success: true, msg: 'Password Updated Successfully!' });
        } catch (error) {
            return res.status(401).json({ success: false, msg: 'Invalid token' });
        }
    } catch (error) {
        console.error('postResetPassword error:', error);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
}

module.exports = {
    register,
    login,
    logout,
    verifyEmail,
    resetPassword,
    postResetPassword
};