const mysql = require("mysql2/promise");

// Create a pool of connections
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "cryptocurr",
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0,
});

module.exports = {
  pool,
};
