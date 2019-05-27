/*
*
* Configuration File
*
*/

const config = {};

config.default = {
  'envName' : 'localhost',
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'hashingSecret' : 'secret_key',
  'stripeApiKey': 'sk_test_7HNxlqnYxMryMbKtONqvAZEQ',
  'mailgun': {
    'apiKey': 'api:key-dde5563bc671ac8359c31c77971c0cc1',
    'domainName': 'sandboxb18d39ab865e42a0a0d81022e5de121d.mailgun.org'
  },
  'menuItems': { 
    1: {
      'name': 'Margherita',
      'price': 70,
    },
    2: {
      'name': 'Double Cheese Margherita',
      'price': 72
    },
    3: {
      'name': 'Farm House',
      'price': 70
    },
    4: {
      'name': 'Peppy Paneer',
      'price': 75
    },
    5: {
      'name': 'Mexican Green Wave',
      'price': 79.90
    },
    6: {
      'name': 'Deluxe Veggie',
      'price': 70
    },
    7: {
      'name': '5 Pepper',
      'price': 70,
    },
    8: {
      'name': 'Veg Extravaganza',
      'price': 70
    },
    9: {
      'name': 'CHEESE N CORN',
      'price': 75
    },
   10: {
     'name': 'PANEER MAKHANI',
     'price': 70
   },
   11: {
     'name': 'VEGGIE PARADISE',
     'price': 75
   },
   12: {
     'name': 'FRESH VEGGIE',
     'price': 62
    }
  }
};

config.production = {
  'envName' : 'production',
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'hashingSecret' : 'secret_key',
  'mailgun': {
    'apiKey': 'api:key-dde5563bc671ac8359c31c77971c0cc1',
    'domainName': 'sandboxb18d39ab865e42a0a0d81022e5de121d.mailgun.org'
  },
  'menuItems': {
    1: {
      'name': 'Margherita',
      'price': 70,
    },
    2: {
      'name': 'Double Cheese Margherita',
      'price': 72
    },
    3: {
      'name': 'Farm House',
      'price': 70
    },
    4: {
      'name': 'Peppy Paneer',
      'price': 75
    },
    5: {
      'name': 'Mexican Green Wave',
      'price': 79.90
    },
    6: {
      'name': 'Deluxe Veggie',
      'price': 70
    },
    7: {
      'name': '5 Pepper',
      'price': 70,
    },
    8: {
      'name': 'Veg Extravaganza',
      'price': 70
    },
    9: {
      'name': 'CHEESE N CORN',
      'price': 75
    },
    10: {
      'name': 'PANEER MAKHANI',
      'price': 70
    },
    11: {
      'name': 'VEGGIE PARADISE',
      'price': 75
    },
    12: {
      'name': 'FRESH VEGGIE',
      'price': 62
    }
  }
};

const chosenConfig = process.env.NODE_ENV == 'production' ? config.production : config.default;

module.exports = chosenConfig;
