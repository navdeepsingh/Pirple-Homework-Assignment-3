/*
 * Frontend Logic for the Application
 *
 */
const app = {};

// Config
app.config = {
  'sessionToken': false
}

// AJAX CLient (for the REST API)
app.client = {};

// Interface for making API calls
app.client.request = (headers, path, method, queryStringObject, payload, callback) => {
  // Set defaults
  headers = typeof (headers) == "object" && headers !== null ? headers : {};
  path = typeof (path) == "string" ? path : '/';
  method = typeof (method) == "string" && ["post", "get", "put", "delete"].includes(method.toLowerCase()) ? method : false;
  queryStringObject = typeof (queryStringObject) == "object" && queryStringObject !== null ? headers : {};
  payload = typeof (payload) == "object" && payload !== null ? payload : {};
  callback = typeof (callback) == "function" ? callback : false;

  console.log(method);

  // For each query string paramter send, add it to the path
  let requestUrl = path;
  let counter = 0;
  for (let queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++;
      // If at least one query string paramter has already
      if (counter > 1) {
        requestUrl += '&';
      }
      // Add the key and value
      requestUrl += queryKey + '=' + queryStringObject[queryKey];
    }
  }
  console.log(requestUrl)

  // Form the http request as a JSON type
  const xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for (let headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey])
    }
  }

  // if there is a current sesssion token set, add that as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id)
  }

  // When the request comes back handle the response
  xhr.onreadystatechange = function () {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      const statusCode = xhr.status;
      const responseReturned = xhr.responseText;

      // Callback if requested
      if (callback) {
        try {
          const parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }
      }
    }
  }

  // Set the payload as JSON
  const payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

}

app.bindForms = function () {
  if (document.querySelector("form")) {

    var allForms = document.querySelectorAll("form");
    for (var i = 0; i < allForms.length; i++) {
      allForms[i].addEventListener("submit", function (e) {

        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

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
        var queryStringObject = method == 'DELETE' ? payload : {};

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

// Init Bootstrapping
app.init = () => {
  // Bind all form submissions
  app.bindForms();
}

window.onload = () => {
  app.init();
}