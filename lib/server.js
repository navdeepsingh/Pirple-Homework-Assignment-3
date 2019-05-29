/*
 *
 * Server related tasks
 *
 */
const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const helpers = require("./helpers");
const handlers = require("./handlers");
const fs = require("fs");
const path = require("path");
const config = require("./config");

const server = {};

server.http = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

const httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/server.key")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/server.cert")),
};
server.https = https.createServer(httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

server.init = () => {
  server.http.listen(process.env.PORT ? process.env.PORT : config.httpPort, () => {
    // eslint-disable-next-line no-console
    console.log("\x1b[32m%s\x1b[0m", `Server is listening up at port ${config.httpPort} and running ${config.envName}`);
  });
  // server.https.listen(process.env.PORT ? process.env.PORT : config.httpsPort, () => {
  //   console.log('\x1b[33m%s\x1b[0m', `Server is listening up at port ${config.httpsPort} and running ${config.envName}`);
  // });
};

server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const queryStringObject = parsedUrl.query;
  let path = parsedUrl.pathname;
  path = path.replace(/^\/+|\/$/g, "");
  const method = req.method.toLowerCase();
  const headers = req.headers;

  // Get Payload if any
  let buffer = "";
  const decoder = new StringDecoder("utf-8");
  req.on("data", data => {
    buffer += decoder.write(data);
  });
  req.on("end", () => {
    buffer += decoder.end();

    // Construct Data
    const data = {
      path: path,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    const chosenHandler = typeof server.router[path] !== "undefined" ? server.router[path] : handlers.notFound;

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode == "number" ? statusCode : 200;
      payload = typeof payload == "object" ? payload : {};

      const payloadString = JSON.stringify(payload);
      res.writeHead(statusCode, {
        "Content-Type": "application/json",
      });
      res.end(payloadString);
      // eslint-disable-next-line no-console
      console.log("Returning the response: ", statusCode, payload, method, queryStringObject);
    });
  });
};

server.router = {
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/login": handlers.login,
  "api/logout": handlers.logout,
  "api/cart": handlers.cart,
  "api/menu": handlers.menu,
  "api/order": handlers.order,
};

module.exports = server;
