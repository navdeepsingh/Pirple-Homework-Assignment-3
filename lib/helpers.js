/*
*
* Helpers File
*
*/
// Dependencies
const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');

const helpers = {};

helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
}

helpers.validateEmail = (email) => {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

// Create a SHA256 hash
helpers.hash = (str) => {
  if (typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha1', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
}

// Generate Random String
helpers.generateToken = (strLength = 20) => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    possibleChars = 'abcdefghijklomnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789';
    randomString = '';
    let i = 1;
    while (i <= strLength) {
      randomString += possibleChars.charAt(Math.floor(Math.random() * Math.floor(possibleChars.length)));
      i++;
    }
    return randomString;
  } else {
    return false;
  }
}

helpers.makeStripeTransaction = (email, amount, callback) => {
  // Validate parameters
  email = typeof (email) == 'string' && helpers.validateEmail(email.trim()) ? email.trim() : false;
  amount = typeof (amount) == 'number' ? amount : false;
  
  if (email && amount) {

    // Create the order object and include in user's phone
    const orderPostData = {
      'amount': amount,
      'currency': 'usd',
      'source': 'tok_amex',
      'description': `Charge for ${email}`,
      'receipt_email': email
    }

    // Need to serialize to send in post request
    const stringOrderPostData = querystring.stringify(orderPostData);

    // // An object of options to indicate where to post to
    const postOptions = {
      "method": "POST",
      'protocol': "https:",
      "hostname": 'api.stripe.com',
      "path": '/v1/charges',
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Authorization": "Bearer " + config.stripeApiKey
      }
    };

    // Instantiate the request object
    var req = https.request(postOptions, function (res) {
      // Grab the status of the sent request
      const status = res.statusCode;
      // Callback successfully if the request went through
      if([200,201].indexOf(status) == -1) {        
        callback(status, {'Error': 'Status code returned was ' + status});
      }
      // Returning 301
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        callback(status, {'Response': JSON.parse(body.toString())});
      });
    });

    req.on('error', function (e) {
      callback(e);
    });

    // write data to request body
    req.write(stringOrderPostData);
    req.end();
  } else {
    callback('Given parameters were missing or invalid');
  }
}


helpers.sendMailgunEmail = (email, receiptUrl, callback) => {
  // Validate parameters
  email = typeof (email) == 'string' && helpers.validateEmail(email.trim()) ? email.trim() : false;
  receiptUrl = typeof (receiptUrl) == 'string' ? receiptUrl : false;
  console.log(email, receiptUrl);
  
  
  if (email && receiptUrl) {

    // Create the order object and include in user's phone
    const emailPostData = {
      'from': 'Excited User <navdeep@sandboxb18d39ab865e42a0a0d81022e5de121d.mailgun.org>',
      'to': email,
      'subject': 'Transaction Email [Mailgun]',
      'html': `Hello ${email},<br><br>
              Please find this receipt link for recent transaction via stripe API.<br> 
              Receipt link: <a href="${receiptUrl}">${receiptUrl}</a><br><br>Thanks,<br>Nodejs Developer`
    }

    // Need to serialize to send in post request
    const stringEmailPostData = querystring.stringify(emailPostData);

    // An object of options to indicate where to post to
    const postOptions = {
      "method": "POST",
      'protocol': "https:",
      "hostname": 'api.mailgun.net',
      "path": '/v3/' + config.mailgun.domainName +'/messages',
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(config.mailgun.apiKey).toString('base64')
      }
    };

    // Instantiate the request object
    var req = https.request(postOptions, function (res) {
      // Grab the status of the sent request
      const status = res.statusCode;
      console.log(status);
      
      // Callback successfully if the request went through
      if ([200, 201].indexOf(status) == -1) {
        callback(status, { 'Error': 'Status code returned was ' + status });
      }
      // Returning 301
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        console.log('response end: ', body.toString());
        callback(status, { 'Response': JSON.parse(body.toString()) });
      });
    });

    req.on('error', function (e) {
      callback(400, {'Error': e});
    });

    // write data to request body
    req.write(stringEmailPostData);
    req.end();
  } else {
    callback(400, {'Error': 'Given parameters were missing or invalid'});
  }
}

module.exports = helpers;
