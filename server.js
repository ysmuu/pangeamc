const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (like admin_panel.html)

// Store suggestions in-memory for simplicity (consider using a database for production)
let suggestions = [];

// API to receive suggestions
app.post('/api/suggestions', (req, res) => {
    const { username, suggestion } = req.body;

    // Get user's IP address
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Log the suggestion with username and IP
    const logEntry = { username, suggestion, ip: userIP };
    suggestions.push(logEntry);

    // Optional: Write the log to a file (e.g., log.txt)
    fs.appendFile('log.txt', JSON.stringify(logEntry) + '\n', (err) => {
        if (err) console.error('Error logging suggestion:', err);
    });

    res.status(201).send('Suggestion received');
});

// API to fetch suggestions
app.get('/api/suggestions', (req, res) => {
    res.json(suggestions);
});

// API to ban a user
app.post('/api/ban/:username', (req, res) => {
    const usernameToBan = req.params.username;
    // Implement your banning logic here
    suggestions = suggestions.filter(suggestion => suggestion.username !== usernameToBan);
    res.status(200).send('User banned');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
