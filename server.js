const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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
app.post('/suggest', async (req, res) => {
    const { username, suggestion } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // Get IP address

    // Check if IP is banned
    if (bannedIPs.has(ip)) {
        return res.status(403).send('Your IP has been banned from making suggestions.');
    }

    // Create a log entry
    const logEntry = { username, suggestion, ip };

    // Read existing logs
    fs.readFile('logs.json', (err, data) => {
        if (err) {
            console.error('Error reading logs:', err);
            return res.sendStatus(500);
        }

        // Parse existing logs or create a new array
        const logs = data.length ? JSON.parse(data) : [];

        // Add the new log entry
        logs.push(logEntry);

        // Write the updated logs back to the file
        fs.writeFile('logs.json', JSON.stringify(logs, null, 2), (err) => {
            if (err) {
                console.error('Error writing logs:', err);
                return res.sendStatus(500);
            }

            // Send the suggestion to Discord
            sendToDiscord(username, suggestion, ip);
            res.sendStatus(200); // Success
        });
    });
});

// Function to send the suggestion to Discord
async function sendToDiscord(username, suggestion, ip) {
    const webhookURL = 'YOUR_DISCORD_WEBHOOK_URL'; // Replace with your actual webhook URL
    const payload = {
        embeds: [{
            title: "New Minecraft Server Suggestion",
            description: `A new suggestion has been submitted by **${username}** (IP: ${ip})`,
            color: 5814783,
            fields: [
                {
                    name: "User",
                    value: username,
                    inline: true
                },
                {
                    name: "Suggestion",
                    value: suggestion,
                    inline: false
                }
            ],
            footer: {
                text: "PangeaMC stupid suggestion bot",
                icon_url: "https://i.imgur.com/Y1dPLe5.png"
            },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        await fetch(webhookURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}

// Ban an IP
app.post('/ban', (req, res) => {
    const { ip } = req.body;

    // Validate IP format (optional)
    const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipPattern.test(ip)) {
        return res.status(400).send('Invalid IP address.');
    }

    bannedIPs.add(ip);
    saveBannedIPs();
    res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
    loadBannedIPs(); // Load banned IPs when server starts
    console.log(`Server is running on http://localhost:${PORT}`);
});
