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
        fs.writeFile('logs.json', JSON.stringify(logs, null, 2), (err) => {
            if (err) {
                console.error('Error writing logs:', err);
                return res.sendStatus(500);
            }

            // Send the suggestion to Discord
            sendToDiscord(username, suggestion, ip).then(() => {
                res.sendStatus(200); // Success
            }).catch(err => {
                console.error('Error sending to Discord:', err);
                res.sendStatus(500); // Sending to Discord failed
            });
        });
    });
});
