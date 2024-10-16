const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let bannedIPs = new Set();

// Load banned IPs from a file (if you want to persist bans)
function loadBannedIPs() {
    if (fs.existsSync('banned_ips.json')) {
        const data = fs.readFileSync('banned_ips.json', 'utf-8');
        bannedIPs = new Set(JSON.parse(data));
    }
}

// Save banned IPs to a file
function saveBannedIPs() {
    fs.writeFileSync('banned_ips.json', JSON.stringify(Array.from(bannedIPs)), 'utf-8');
}

// Middleware to serve static files and parse JSON
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle suggestion submissions
app.post('/suggest', (req, res) => {
    const { username, suggestion } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // Get IP address

    // Check if IP is banned
    if (bannedIPs.has(ip)) {
        return res.status(403).send('Your IP has been banned from making suggestions.');
    }

    // Create a log entry
    const logEntry = { username, suggestion, ip };

    // Read existing suggestions
    fs.readFile('suggestions.json', (err, data) => {
        if (err) {
            console.error('Error reading suggestions:', err);
            return res.sendStatus(500);
        }

        // Parse existing suggestions or create a new array
        const suggestions = data.length ? JSON.parse(data) : [];

        // Add the new suggestion
        suggestions.push(logEntry);

        // Write the updated suggestions back to the file
        fs.writeFile('suggestions.json', JSON.stringify(suggestions, null, 2), (err) => {
            if (err) {
                console.error('Error writing suggestions:', err);
                return res.sendStatus(500);
            }

            res.sendStatus(200); // Success
        });
    });
});

// Ban an IP
app.post('/ban', (req, res) => {
    const { ip } = req.body;
    bannedIPs.add(ip);
    saveBannedIPs();
    res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
    loadBannedIPs(); // Load banned IPs when server starts
    console.log(`Server is running on http://localhost:${PORT}`);
});
