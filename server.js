const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

            res.sendStatus(200);
        });
    });
});

// Serve static files (HTML, etc.)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
