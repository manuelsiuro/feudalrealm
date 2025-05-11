const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the current directory (and src)
app.use(express.static(path.join(__dirname))); // Serves index.html from root
app.use('/src', express.static(path.join(__dirname, 'src'))); // Serves files from src/

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(
        `Feudal Realm Manager server running at http://localhost:${port}`
    );
    console.log('Open http://localhost:3000 in your browser.');
});
