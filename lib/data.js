/*
 * Library for storing data
 *
 */

 // Dependancies
 const fs = require('fs');
 const path = require('path');
 const helpers = require('./helpers');

 const lib = {};
 lib.baseDir = path.join(__dirname, '/../.data/');

 lib.create = (dir, file, data, callback) => {
   fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
     if (!err && fileDescriptor) {
       const jsonStringData  =  JSON.stringify(data);
       fs.writeFile(fileDescriptor, jsonStringData, (err) => {
         if(!err) {
           fs.close(fileDescriptor, (err) => {
             if (!err) {
               callback(false);
             } else {
               callback('Error closing new file');
             }
           })
         } else {
           callback('Error writing to new file.')
         }
       });
     } else {
       callback('Could not create new file, it may already exists');
     }
   })
 }

 lib.read = (dir, file, callback) => {
   fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
     if (!err) {
       var parsedData = helpers.parseJsonToObject(data);
       callback(null, parsedData);
     } else {
       callback('Error reading File');
     }
   })
 }

 lib.update = (dir, file, data, callback) => {
   fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
     if (!err && fileDescriptor) {
       const stringData = JSON.stringify(data);

       // Truncate the file
       fs.truncate(fileDescriptor, (err) => {
         if (!err) {
           // Write to the file and close it
           fs.writeFile(fileDescriptor, stringData, (err) => {
             if (!err) {
               fs.close(fileDescriptor, (err) => {
                 if (!err) {
                   callback(false);
                 } else {
                   callback('Error closing new file');
                 }
               });
             } else {
               callback('Error writing file');
             }
           })
         } else {
           callback('Error truncating file');
         }
       })
     } else {
       callback('Error opening file');
     }
   })
 }

 lib.delete = (dir, file, callback) => {
   // Unlink the file
   fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
     if (!err) {
      callback(false);
     } else {
      callback('Error deleting file');
     }
   });
 }


// List all the items in a directory
 lib.list = (dir, callback) => {
   fs.readdir(lib.baseDir + dir + '/', (err, data) => {
     if (!err && data && data.length > 0) {
       const trimmedFileNames = [];
       data.forEach((fileName) => {
         trimmedFileNames.push(fileName.replace('.json', ''));
       });
       callback(false, trimmedFileNames);
     } else {
       callback(err, data);
     }
   });
 }

 // Export the lib
 module.exports = lib;
