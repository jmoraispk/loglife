// Express server setup

const express = require('express');
const routes = require('./routes');
const { PORT } = require('../config/settings');

function startServer(port = PORT) {
    const app = express();

    // Middleware
    app.use(express.json());

    // Routes
    app.use('/', routes);

    // Start listening
    app.listen(port, () => {
        console.log(`🚀 API server running on port ${port}`);
    });
}

module.exports = { startServer };
