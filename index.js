/*
 *
 * Main API File
 *
 */

const server = require('./lib/server');

// Define an app container
const app = {};

app.init = () => {
  // Initiate the server
  server.init();
};

app.init();
