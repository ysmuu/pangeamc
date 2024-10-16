const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle suggestion submissions
app.post('/suggest', (req, res) => {
    const { username, suggestion, ip } = req.body;

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
        fs.writeFile('logs.json', JSON.stringify(logs, null, 2), err => {
            if (err) {
                console.error('Error writing logs:', err);
                return res.sendStatus(500);
            }

            // Send the webhook (optional)
            const webhookURL = atob('aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTI5NjIyMTU3ODc3Nzk4NTExNS80U2RsNzE5MGptVjdRSTd2UjZvZ1hRSTJnckJ5MHlvT0hXdl80SHY0YnREN2xFWDhOeVdlR1BJVWlQQnQ3bXRlVHNWbw==');
            const payload = {
                username: "Suggestion Bot",
                embeds: [{
                    title: "New Suggestion Submitted",
                    description: `**${username}**: ${suggestion}`,
                    fields: [
                        { name: "IP Address", value: ip }
                    ],
                    timestamp: new Date().toISOString()
                }]
            };

            fetch(webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error('Webhook error:', err));

            res.sendStatus(200);
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
