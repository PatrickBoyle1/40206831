const express = require('express');
const bodyParser = require('body-parser');
const db = require('./utils/dbconn'); // Import the database connection

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

console.log('Connected to database');

app.post('/createAccount', (req, res) => {
    console.log(req.body); // Log the request body

    let { username, email, password } = req.body;

    // TODO: Add input validation here

    let query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    let values = [username, email, password];

    console.log(values); // Log the values array

    db.query(query, values, (err, result) => {
        if (err) throw err;
        res.send('Account created successfully');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            res.json({ success: false, message: 'Error logging in' });
        } else if (results.length > 0) {
            console.log('Login successful');
            res.json({ success: true }); // Changed this line
        } else {
            console.log('Invalid username/password');
            res.json({ success: false, message: 'Invalid username/password' });
        }
    });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

