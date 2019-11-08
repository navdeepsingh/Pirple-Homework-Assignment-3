/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  'sessionToken': false
};

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function (headers, path, method, queryStringObject, payload, callback) {

  // Set defaults
  headers = typeof (headers) == 'object' && headers !== null ? headers : {};
  path = typeof (path) == 'string' ? path : '/';
  method = typeof (method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].includes(method.toLowerCase()) > -1 ? method.toLowerCase() : 'GET';
  queryStringObject = typeof (queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof (payload) == 'object' && payload !== null ? payload : {};
  callback = typeof (callback) == 'function' ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path;
  var counter = 0;
  var requestUrl = requestUrl + '?';
  for (var queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++;
      // If at least one query string parameter has already been added, preprend new ones with an ampersand
      if (counter > 1) {
        requestUrl += '&';
      }
      // Add the key and value
      requestUrl += queryKey + '=' + queryStringObject[queryKey];
    }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", 'application/json');

  // For each header sent, add it to the request
  for (var headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  // If there is a current session token set, add that as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function () {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      var statusCode = xhr.status;
      var responseReturned = xhr.responseText;

      // Callback if requested
      if (callback) {
        try {
          var parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }

      }
    }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

};

// Bind the logout button
app.bindLogoutButton = function () {
  document.getElementById("logout").addEventListener("click", function (e) {

    // Stop it from redirecting anywhere
    e.preventDefault();

    // Log the user out
    app.logUserOut();

  });
};

// Log the user out then redirect them
app.logUserOut = function (redirectUser) {
  // Set redirectUser to default to true
  redirectUser = typeof (redirectUser) == 'boolean' ? redirectUser : true;

  // Get the current token id
  var tokenId = typeof (app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

  // Send the current token to the tokens endpoint to delete it
  var queryStringObject = {
    'id': tokenId
  };

  app.client.request(undefined, 'api/logout', 'delete', queryStringObject, undefined, function (statusCode, responsePayload) {
    // Set the app.config token as false
    app.setSessionToken(false);

    // Send the user to the logged out page
    if (redirectUser) {
      window.location = '/login';
    }

  });
};

// Bind the forms
app.bindForms = function () {
  if (document.querySelector("form")) {

    var allForms = document.querySelectorAll("form");
    for (var i = 0; i < allForms.length; i++) {
      allForms[i].addEventListener("submit", function (e) {

        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toLowerCase();

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#" + formId + " .formError").style.display = 'none';

        // Hide the success message (if it's currently shown due to a previous error)
        if (document.querySelector("#" + formId + " .formSuccess")) {
          document.querySelector("#" + formId + " .formSuccess").style.display = 'none';
        }


        // Turn the inputs into a payload
        var payload = {};
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].type !== 'submit') {
            // Determine class of element and set value accordingly
            var classOfElement = typeof (elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
            var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
            var elementIsChecked = elements[i].checked;
            // Override the method of the form if the input's name is _method
            var nameOfElement = elements[i].name;
            if (nameOfElement == '_method') {
              method = valueOfElement;
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if (nameOfElement == 'httpmethod') {
                nameOfElement = 'method';
              }
              // Create an payload field named "id" if the elements name is actually uid
              if (nameOfElement == 'uid') {
                nameOfElement = 'id';
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              if (classOfElement.indexOf('multiselect') > -1) {
                if (elementIsChecked) {
                  payload[nameOfElement] = typeof (payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                payload[nameOfElement] = valueOfElement;
              }

            }
          }
        }

        // If the method is DELETE, the payload should be a queryStringObject instead
        var queryStringObject = method == 'delete' ? payload : {};

        // Call the API
        app.client.request(undefined, path, method, queryStringObject, payload, function (statusCode, responsePayload) {
          // Display an error on the form if needed
          if (statusCode !== 200) {

            if (statusCode == 403) {
              // log the user out
              app.logUserOut();

            } else {

              // Try to get the error from the api, or set a default error message
              var error = typeof (responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

              // Set the formError field with the error text
              document.querySelector("#" + formId + " .formError").innerHTML = error;

              // Show (unhide) the form error field on the form
              document.querySelector("#" + formId + " .formError").style.display = 'block';
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId, payload, responsePayload);
          }

        });
      });
    }
  }
};

// Form response processor
app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
  var functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  if (formId == 'signup') {
    // Take the email and password, and use it to log the user in
    var newPayload = {
      'email': requestPayload.email,
      'password': requestPayload.password
    };

    app.client.request(undefined, 'api/login', 'POST', undefined, newPayload, function (newStatusCode, newResponsePayload) {
      // Display an error on the form if needed
      if (newStatusCode !== 200) {

        // Set the formError field with the error text
        document.querySelector("#" + formId + " .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

        // Show (unhide) the form error field on the form
        document.querySelector("#" + formId + " .formError").style.display = 'block';

        document.querySelector("#" + formId + " .formError").focus();

      } else {
        // If successful, set the token and redirect the user
        app.setSessionToken(newResponsePayload);
        window.location = '/menu';
      }
    });
  }
  // If login was successful, set the token in localstorage and redirect the user
  if (formId == 'login') {
    app.setSessionToken(responsePayload);
    window.location = '/menu';
  }

  // If forms saved successfully and they have success messages, show them
  var formsWithSuccessMessages = ['accountEdit1', 'accountEdit2', 'checksEdit1'];
  if (formsWithSuccessMessages.indexOf(formId) > -1) {
    document.querySelector("#" + formId + " .formSuccess").style.display = 'block';
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if (formId == 'accountEdit3') {
    app.logUserOut(false);
    window.location = '/account/deleted';
  }

  // If the user just created a new check successfully, redirect back to the dashboard
  if (formId == 'checksCreate') {
    window.location = '/checks/all';
  }

  // If the user just deleted a check, redirect them to the dashboard
  if (formId == 'checksEdit2') {
    window.location = '/checks/all';
  }

};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function () {
  var tokenString = localStorage.getItem('token');
  if (typeof (tokenString) == 'string') {
    try {
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if (typeof (token) == 'object') {
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    } catch (e) {
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function (add) {
  var target = document.querySelector("body");
  if (add) {
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function (token) {
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem('token', tokenString);
  if (typeof (token) == 'object') {
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};


// Load data on the page
app.loadDataOnPage = function () {
  // Get the current page from the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof (bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

  // Logic for account settings page
  if (primaryClass == 'menu') {
    app.loadMenuPage();
  }

};

// Load the dashboard page specifically
app.loadMenuPage = function () {
  // Get the phone number from the current token, or log the user out if none is there
  var email = typeof (app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if (email) {
    // Fetch the user data
    var queryStringObject = {
      'email': email
    };
    const menuItemsWrapper = document.querySelector('.menu-items');

    app.client.request(undefined, 'api/menu', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {

      if (statusCode == 200) {

        // Determine how many checks the user has
        var menuItems = typeof (responsePayload) == 'object' ? responsePayload : {};
        if (Object.keys(menuItems).length > 0) {

          menuItemsHTML = '<div class="row">';
          for (const key of Object.keys(responsePayload)) {
            menuItemsHTML += `<div class="col-lg-4 col-md-6 mb-4">
                                            <div class="card h-100">
                                              <div class="card-body">
                                                <h4 class="card-title">
                                                  ${responsePayload[key].name}
                                                </h4>
                                                <h5>$${responsePayload[key].price}</h5>
                                              </div>
                                              <div class="card-footer">
                                                <button class="btn btn-primary btn-lg">ADD TO CART</button>
                                              </div>
                                            </div>
                                          </div>`;
          }
          menuItemsHTML += '</div>';
          menuItemsWrapper.innerHTML = menuItemsHTML;

        } else {
          // Show 'you have no checks' message
          document.getElementById("noItemsMessage").style.display = 'block';
        }
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};


// Load the checks edit page specifically
app.loadChecksEditPage = function () {
  // Get the check id from the query string, if none is found then redirect back to dashboard
  var id = typeof (window.location.href.split('=')[1]) == 'string' && window.location.href.split('=')[1].length > 0 ? window.location.href.split('=')[1] : false;
  if (id) {
    // Fetch the check data
    var queryStringObject = {
      'id': id
    };
    app.client.request(undefined, 'api/checks', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {
      if (statusCode == 200) {

        // Put the hidden id field into both forms
        var hiddenIdInputs = document.querySelectorAll("input.hiddenIdInput");
        for (var i = 0; i < hiddenIdInputs.length; i++) {
          hiddenIdInputs[i].value = responsePayload.id;
        }

        // Put the data into the top form as values where needed
        document.querySelector("#checksEdit1 .displayIdInput").value = responsePayload.id;
        document.querySelector("#checksEdit1 .displayStateInput").value = responsePayload.state;
        document.querySelector("#checksEdit1 .protocolInput").value = responsePayload.protocol;
        document.querySelector("#checksEdit1 .urlInput").value = responsePayload.url;
        document.querySelector("#checksEdit1 .methodInput").value = responsePayload.method;
        document.querySelector("#checksEdit1 .timeoutInput").value = responsePayload.timeoutSeconds;
        var successCodeCheckboxes = document.querySelectorAll("#checksEdit1 input.successCodesInput");
        for (var i = 0; i < successCodeCheckboxes.length; i++) {
          if (responsePayload.successCodes.indexOf(parseInt(successCodeCheckboxes[i].value)) > -1) {
            successCodeCheckboxes[i].checked = true;
          }
        }
      } else {
        // If the request comes back as something other than 200, redirect back to dashboard
        window.location = '/checks/all';
      }
    });
  } else {
    window.location = '/checks/all';
  }
};


// Init (bootstrapping)
app.init = function () {

  // Bind all form submissions
  app.bindForms();

  // Bind logout logout button
  app.bindLogoutButton();

  // Get the token from localstorage
  app.getSessionToken();

  // Load data on page
  app.loadDataOnPage();

};

// Call the init processes after the window loads
window.onload = function () {
  app.init();
};
