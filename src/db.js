const mysql = require('mysql')

// var mysqlConnection = mysql.createConnection({
//     host: 'sql12.freemysqlhosting.net',
//     user: 'sql12383947',
//     password : 'LmzAsI9VqY',
//     database : 'sql12383947',
//     multipleStatements : true
//   });
var mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password : 'password',
  database : 'olx',
  multipleStatements : true
});
  //connection done here
  mysqlConnection.connect((err) => {
    if(!err)
    console.log('Connection Established Successfully');
    else
     console.log('Connection Failed!'+JSON.stringify(err,undefined,2));
  });


// CREATE TABLE users1 (
//     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
//     username VARCHAR(50) NOT NULL,
//     phone VARCHAR(50) NOT NULL,
//     pin VARCHAR(10) NOT NULL
// );
// CREATE TABLE users2 (
//     pin VARCHAR(10) NOT NULL PRIMARY KEY,
//     city VARCHAR(50) NOT NULL,
//     state VARCHAR(50) NOT NULL
// );
// CREATE TABLE auth (
//     username VARCHAR(50) NOT NULL PRIMARY KEY,
//     password VARCHAR(50) NOT NULL
// );


  module.exports = mysqlConnection;