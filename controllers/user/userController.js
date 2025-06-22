const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { pool, runQuery } = require('../../config/db');

const Emailer = require('../utils/emailer.js');
const mailer = new Emailer();

const JWT_SECRET = process.env.JWT_SECRET || 'thisisnotaproductionkey';

const updateAddr = async (req, res) => {
    try {
        const { addr } = req.body;
        console.log(addr)
        await runQuery(
            pool,
            'UPDATE users SET address = ? WHERE id = ?',
            [addr, req.userId]
        );
        return res.status(200).json({ success: true, msg: 'Address updated successflly.'})
    } catch (error) {
        console.error('updateAddr error:', error);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
};

const updateBalance = async (req, res) => {
    try {
        const { balance } = req.body;
        await runQuery(
            pool,
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [balance, req.userId]
        );
        return res.status(200).json({ success: true, msg: 'Balance added successflly.'})
    } catch (error) {
        console.error('updateBalance error:', error);
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
};

const updateDetails = async (req, res) => {
    // ok so, multer uploads the files before validating req.body, and it seems obvious because upload is used as a middleware
    // hence it just does waht it does before the controller is called
    // a solution mght exist for this, but i might not be implementing that now instead relying on this
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
        const { first_name, last_name, email, addr, currPwd, newPwd } = req.body;
        const profilePicture = req.file;
        const users = await runQuery(
            pool,
            'SELECT * from users where id = ?',
            [req.userId]
        );

        if (users.length === 0 ) {
            deleteFile();
            return res.status(401).redirect('/register');
        }

        const isValidPassword = await bcrypt.compare(currPwd, users[0].password);
        if (!isValidPassword) {
            deleteFile();
            return res.status(400).json({success:false, msg: 'Invalid Credentials!'});
        }

        const is_verified = users[0].email === email ? 1 : 0;
        const password = await bcrypt.hash(newPwd ? newPwd : currPwd, 10);
        const profile_pic = profilePicture ? '/uploads/profile-pics/' + profilePicture.filename : users[0].profile_pic;

        if (!is_verified){
            try {
                  await mailer.send(
                    email,
                    'Action Required [Zesty]',
                    'views/email/confirm.ejs',
                    { activation_url: `http://${process.env.SITE_NAME}/api/auth/verify?token=${jwt.sign({"email":email}, JWT_SECRET, {expiresIn:'1d'})}` }
                  );
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                return res.status(500).json({ success: false, msg: 'Failed to send confirmation email.' });
            }
        }   
        await runQuery(
            pool,
            'UPDATE users SET first_name = ?, last_name = ?, email = ?, address = ?, password = ?, is_verified = ?, profile_pic = ? WHERE id = ?',
            [first_name, last_name, email, addr, password, is_verified, profile_pic, req.userId]
        );
        return res.status(200).json({ success: true, msg: 'Profile updated successflly.', is_verified:is_verified})
    } catch (error) {
        console.error('updateDetails error:', error);
        deleteFile();
        return res.status(500).json({ success: false, msg: 'An internal server error occurred!' });
    }
};


module.exports = {
  updateAddr,
  updateBalance,
  updateDetails,
};