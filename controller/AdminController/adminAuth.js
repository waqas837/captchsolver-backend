const jwt = require("jsonwebtoken"); // For creating tokens
const { sendEmail } = require("../../util/nodemailerService");
const { pool } = require("../../Database/databaseConnection/DbConnect");

exports.adminsingin = async (req, res) => {
  let conection = await pool.getConnection();
  try {
    // customer admin login
    let email = req.body.email;
    let password = req.body.password;
    let [rows] = await conection.query(
      "SELECT * FROM admin where email=? AND password=?",
      [email, password]
    );

    if (rows.length === 0) {
      res.json({
        success: false,
        message: "Wrong Credentials!",
      });
      return;
    } else if (rows[0].email === email && rows[0].password === password) {
      const token = jwt.sign(
        { adminId: rows[0].id },
        process.env.Jwt_Secret_Admin,
        {
          expiresIn: "12h",
        }
      );
      res.json({
        success: true,
        email,
        token,
        message: "successLogin",
      });
    }
  } catch (error) {
    console.log(`error during sigin the data ${error}`);
    console.log(error);
  } finally {
    conection.release();
  }
};

exports.emailVerification = async (req, res) => {
  let conection = await pool.getConnection();
  const adminId = req.params.id;
  console.log("adminId", adminId);
  try {
    let [rows] = await conection.query(
      "UPDATE admin SET verified=? WHERE id=?",
      [true, adminId]
    );

    res.send("Your Email has been confirmed! Please Go Login.");
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Email not confirmed",
    });
  } finally {
    conection.release();
  }
};

exports.fetchAllowedFeatures = async (req, res) => {
  let conection = await pool.getConnection();
  const adminId = req.adminId;
  try {
    let [rows] = await conection.query(
      "SELECT * FROM subscriptions WHERE userid=?",
      [adminId]
    );
    if (rows.length) {
      res.json({ success: true, data: rows });
    }
  } catch (error) {
    console.log("error in fetchAllowedFeatures", error);
    res.json({
      success: false,
      err: "error in fetchAllowedFeatures",
    });
  } finally {
    conection.release();
  }
};

exports.getusers = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    let searchQuery = req.query.search ? `%${req.query.search}%` : "%";

    let [rows] = await connection.query(
      "SELECT * FROM users WHERE username LIKE ?",
      [searchQuery]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, err: "Error fetching users" });
  } finally {
    if (connection) connection.release();
  }
};

exports.updatebalance = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { balance, userId } = req.body; // Extract balance & id from request body
    let [rows] = await connection.query(
      "UPDATE users SET balance=? WHERE id=?",
      [balance, userId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error while updating balance:", error);
    res
      .status(500)
      .json({ success: false, error: "Error while updating balance" });
  } finally {
    if (connection) connection.release();
  }
};
