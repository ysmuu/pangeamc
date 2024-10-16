const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Make sure to install node-fetch

const app = express();
const PORT = process.env.PORT || 3000;

let bannedIPs = new Set();

// Load banned IPs from a file
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

// Send the suggestion to Discord webhook
async function sendToDiscord(username, suggestion, ip) {
    const webhookURL = 'https://discord.com/api/webhooks/1296221578777985115/4Sdl7190jmV7QI7vR6ogXQI2grBy0yoOHWv_4Hv4btD7lEX8NyWeGPIUiPBt7mteTsVo'; // Replace with your actual webhook URL

    const payload = {
        embeds: [{
            title: "New Minecraft Server Suggestion",
            description: `A new suggestion has been submitted by **${username}**`,
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
                },
                {
                    name: "IP Address",
                    value: ip,
                    inline: true
                }
            ],
            footer: {
                text: "PangeaMC suggestion bot",
                icon_url: "https://i.imgur.com/Y1dPLe5.png"
            },
            timestamp: new Date().toISOString()
        }]
    };

    const response = await fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Failed to send webhook: ' + response.statusText);
    }
}

// Handle suggestion submissions
app.post('/suggest', async (req, res) => {
    const { username, suggestion } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // Get IP address

    console.log('Received suggestion:', { username, suggestion, ip });

    // Check if IP is banned
    if (bannedIPs.has(ip)) {
        console.log(`Banned IP tried to submit: ${ip}`);
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
        fs.writeFile('logs.json', JSON.stringify(logs, null, 2), async (err) => {
            if (err) {
                console.error('Error writing logs:', err);
                return res.sendStatus(500);
            }

            try {
                await sendToDiscord(username, suggestion, ip);
                res.sendStatus(200); // Success
            } catch (err) {
                console.error('Error sending to Discord:', err);
                res.sendStatus(500); // Sending to Discord failed
            }
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
