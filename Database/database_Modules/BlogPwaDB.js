const { pool } = require("../databaseConnection/DbConnect");

exports.userTables = async () => {
  let connection = await pool.getConnection();
  try {
    // 1. Users Login table for blogpwa-web based user side login
    await connection.query(
      `CREATE TABLE IF NOT EXISTS users (
       id VARCHAR(100) PRIMARY KEY,
       username VARCHAR(100),
       email VARCHAR(100),
       password VARCHAR(100),
       apiTokenDashboard text,
       BalanceApiKey text,
       currentPlan text,
       totalAmountRequestsRemains int,
       balance int,
       verified BOOLEAN DEFAULT FALSE )`
    );
    await connection.query(
      `CREATE TABLE IF NOT EXISTS admin (
       id VARCHAR(100) PRIMARY KEY,
       email VARCHAR(100),
       password VARCHAR(100)
        )`
    );
  } catch (err) {
    console.error("Error connecting:", err);
  } finally {
    connection.release();
  }
};
