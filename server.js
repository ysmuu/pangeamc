const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));

// Dummy admin data (In production, use a secure database)
const admins = [
    { username: 'admin', password: 'password' } // Replace with a more secure password
];

// Admin login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const admin = admins.find(admin => admin.username === username && admin.password === password);
    
    if (admin) {
        req.session.isAdmin = true; // Set session variable to mark admin as logged in
        return res.status(200).send('Login successful!');
    } else {
        return res.status(401).send('Invalid credentials');
    }
});

// Middleware to check if admin is logged in
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next(); // Proceed to the next middleware or route handler
    } else {
        res.status(403).send('Forbidden. Please log in as an admin.');
    }
};

// Example protected route (to demonstrate admin access)
app.get('/admin', isAdmin, (req, res) => {
    res.send('Welcome to the admin dashboard!');
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
