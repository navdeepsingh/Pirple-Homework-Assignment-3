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
  path = path.replace(/^\/+|\/$/g, '');
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

    let chosenHandler = typeof server.router[path] !== "undefined" ? server.router[path] : handlers.notFound;

    // If the request is within the public directory, use the public handler instead
    chosenHandler = path.includes('vendor') ? handlers.vendor : chosenHandler;

    chosenHandler(data, (statusCode, payload, contentType) => {
      // Determine the type of response (fallback to JSON)
      contentType = typeof contentType === "string" ? contentType : "json";
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // Return the response-parts that are content specific
      let payloadString = "";
      if (contentType === "json") {
        res.setHeader("Content-Type", "application/json");
        payload = typeof payload == "object" ? payload : {};
        payloadString = JSON.stringify(payload);
      }
      if (contentType === "html") {
        res.setHeader("Content-Type", "text/html");
        payloadString = typeof payload === "string" ? payload : "";
      }
      if (contentType === "css") {
        res.setHeader("Content-Type", "text/css");
        payloadString = typeof payload === "string" ? payload : "";
      }
      if (contentType === "png") {
        res.setHeader("Content-Type", "image/png");
        payloadString = typeof payload === "string" ? payload : "";
      }
      if (contentType === "jpg") {
        res.setHeader("Content-Type", "image/jpg");
        payloadString = typeof payload === "string" ? payload : "";
      }
      if (contentType === "favicon") {
        res.setHeader("Content-Type", "image/x-icon");
        payloadString = typeof payload === "string" ? payload : "";
      }
      if (contentType === "plain") {
        res.setHeader("Content-Type", "text/plain");
        payloadString = typeof payload === "string" ? payload : "";
      }

      // Return the response-parts that are common to all requests
      res.writeHead(statusCode);
      res.end(payloadString);
      // eslint-disable-next-line no-console
      console.log("Returning the response: ", statusCode, payload, method, queryStringObject);
    });
  });
};

server.router = {
  "": handlers.index,
  "signup": handlers.signup,
  "account/edit": handlers.accountEdit,
  "account/deleted": handlers.accountDeleted,
  "login": handlers.sessionCreate,
  "logout": handlers.sessionDeleted,
  "menu": handlers.itemsAll,
  "cart": handlers.cartPage,
  "cart/add": handlers.cartAdd,
  "cart/edit": handlers.cartEdit,
  "cart/delete": handlers.cartDelete,
  "vendor": handlers.vendor,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/login": handlers.login,
  "api/logout": handlers.logout,
  "api/cart": handlers.cart,
  "api/menu": handlers.menu,
  "api/order": handlers.order,
};

module.exports = server;
