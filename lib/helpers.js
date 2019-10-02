/* eslint-disable no-console */
/*
 *
 * Helpers File
 *
 */
// Dependencies
const crypto = require("crypto");
const config = require("./config");
const querystring = require("querystring");
const https = require("https");
const path = require("path");
const fs = require("fs");

const helpers = {};

helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

helpers.validateEmail = email => {
  // eslint-disable-next-line no-useless-escape
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

// Create a SHA256 hash
helpers.hash = str => {
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha1", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

// Generate Random String
helpers.generateToken = (strLength = 20) => {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    const possibleChars = "abcdefghijklomnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789";
    let randomString = "";
    let i = 1;
    while (i <= strLength) {
      randomString += possibleChars.charAt(Math.floor(Math.random() * Math.floor(possibleChars.length)));
      i++;
    }
    return randomString;
  } else {
    return false;
  }
};

helpers.makeStripeTransaction = (email, amount, callback) => {
  // Validate parameters
  email = typeof email == "string" && helpers.validateEmail(email.trim()) ? email.trim() : false;
  amount = typeof amount == "number" ? amount : false;

  if (email && amount) {
    // Create the order object and include in user's phone
    const orderPostData = {
      amount: amount,
      currency: "usd",
      source: "tok_amex",
      description: `Charge for ${email}`,
      receipt_email: email,
    };

    // Need to serialize to send in post request
    const stringOrderPostData = querystring.stringify(orderPostData);

    // // An object of options to indicate where to post to
    const postOptions = {
      method: "POST",
      protocol: "https:",
      hostname: "api.stripe.com",
      path: "/v1/charges",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Authorization: "Bearer " + config.stripeApiKey,
      },
    };

    // Instantiate the request object
    var req = https.request(postOptions, function (res) {
      // Grab the status of the sent request
      const status = res.statusCode;
      // Callback successfully if the request went through
      if ([200, 201].indexOf(status) == -1) {
        callback(status, { Error: "Status code returned was " + status });
      }
      // Returning 301
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        callback(status, { Response: JSON.parse(body.toString()) });
      });
    });

    req.on("error", function (e) {
      callback(e);
    });

    // write data to request body
    req.write(stringOrderPostData);
    req.end();
  } else {
    callback("Given parameters were missing or invalid");
  }
};

helpers.sendMailgunEmail = (email, receiptUrl, callback) => {
  // Validate parameters
  email = typeof email == "string" && helpers.validateEmail(email.trim()) ? email.trim() : false;
  receiptUrl = typeof receiptUrl == "string" ? receiptUrl : false;
  console.log(email, receiptUrl);

  if (email && receiptUrl) {
    // Create the order object and include in user's phone
    const emailPostData = {
      from: "Excited User <navdeep@sandboxb18d39ab865e42a0a0d81022e5de121d.mailgun.org>",
      to: email,
      subject: "Transaction Email [Mailgun]",
      html: `Hello ${email},<br><br>
              Please find this receipt link for recent transaction via stripe API.<br> 
              Receipt link: <a href="${receiptUrl}">${receiptUrl}</a><br><br>Thanks,<br>Nodejs Developer`,
    };

    // Need to serialize to send in post request
    const stringEmailPostData = querystring.stringify(emailPostData);

    // An object of options to indicate where to post to
    const postOptions = {
      method: "POST",
      protocol: "https:",
      hostname: "api.mailgun.net",
      path: "/v3/" + config.mailgun.domainName + "/messages",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(config.mailgun.apiKey).toString("base64"),
      },
    };

    // Instantiate the request object
    var req = https.request(postOptions, function (res) {
      // Grab the status of the sent request
      const status = res.statusCode;
      // eslint-disable-next-line no-console
      console.log(status);

      // Callback successfully if the request went through
      if ([200, 201].indexOf(status) == -1) {
        callback(status, { Error: "Status code returned was " + status });
      }
      // Returning 301
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        console.log("response end: ", body.toString());
        callback(status, { Response: JSON.parse(body.toString()) });
      });
    });

    req.on("error", function (e) {
      callback(400, { Error: e });
    });

    // write data to request body
    req.write(stringEmailPostData);
    req.end();
  } else {
    callback(400, { Error: "Given parameters were missing or invalid" });
  }
};

// Get the string content of a template
helpers.getTemplate = (templateName, data, callback) => {
  templateName = typeof templateName === "string" && templateName.length > 0 ? templateName : "";
  if (templateName) {
    const templateDir = path.join(__dirname, "/../templates/");
    fs.readFile(templateDir + templateName + ".html", "utf8", (err, str) => {
      if (!err && str && str.length > 0) {
        // Do interpolation
        const finalString = helpers.interpolate(str, data);
        callback(false, finalString);
      } else {
        callback("No template could be found");
      }
    });
  } else {
    callback("A valid template name was not specified");
  }
};

helpers.interpolate = (str, data) => {
  str = typeof str === "string" && str.length > 0 ? str : "";
  data = typeof data === "object" && data !== null ? data : "";

  // Add the templateGlobals to the data object
  for (let keyName in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(keyName)) {
      data["global." + keyName] = config.templateGlobals[keyName];
    }
  }

  // For each key in the data object, insert its value into string at the correcponding
  for (let key in data) {
    if (data.hasOwnProperty(key) && typeof data[key] == "string") {
      let replace = data[key];
      let find = new RegExp(`{${key}}`, "g");
      str = str.replace(find, replace);
    }

    if (data.hasOwnProperty(key) && typeof data[key] == "object") {

      const res = helpers.readFileAsync(data[key]['template']);
      let find = new RegExp(`{${key}}`, "g");


      str = str.replace(find, res.then(response => { return response }));

    }
  }

  return str;
};

// Add the universal header and footer to a string, and pass provoided data object
helpers.addUniversalTemplates = (str, data, callback) => {
  str = typeof str == "string" && str.length > 0 ? str : "";
  data = typeof data == "object" && data !== null ? data : {};

  // Get the header
  helpers.getTemplate("_header", data, (err, headerString) => {
    if (!err && headerString) {
      // Get the footer
      helpers.getTemplate("_footer", data, (err, footerString) => {
        if (!err && footerString) {
          const fullString = headerString + str + footerString;
          callback(false, fullString);
        } else {
          callback("Could not find the footer template");
        }
      });
    } else {
      callback("Could not find the header template");
    }
  });
};

helpers.getStaticAsset = (fileName, callback) => {
  fileName = typeof fileName == "string" && fileName.length > 0 ? fileName : "";
  if (fileName) {

    const assetPath = path.join(__dirname, "/../vendor/", fileName);

    fs.readFile(assetPath, "utf8", (err, data) => {
      if (!err && data) {
        callback(false, data);
      } else {
        callback(`Mentioned asset {${fileName}} not found.`);
      }
    });
  } else {
    callback("File name is invalid");
  }
};


helpers.readFileAsync = (filename) => {
  const templateDir = path.join(__dirname, "/../templates/");
  return new Promise((resolve, reject) => {
    fs.readFile(templateDir + filename + ".html", "utf8", (err, data) => {
      if (!data && data && data.length > 0) {
        // Do interpolation
        resolve(data);
      } else {
        reject(err);
      }
    });
  })
}

// helpers.readFileAsync = async (filename) => {
//   const templateDir = path.join(__dirname, "/../templates/");
//   await fs.readFile(templateDir + filename + ".html", "utf8", (err, data) => {
//     if (!data && data && data.length > 0) {
//       // Do interpolation
//       return data;
//     } else {
//       return err;
//     }
//   });
// }

module.exports = helpers;
