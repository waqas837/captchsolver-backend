const jwt = require("jsonwebtoken"); // For creating tokens
const { sendEmail } = require("../../util/nodemailerService");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { pool } = require("../../Database/databaseConnection/DbConnect");
const { randomUUID } = require("crypto");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.userSignUp = async (req, res) => {
  let conection = await pool.getConnection();
  try {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    // First check if user exists
    let [isUserExists] = await conection.query(
      "SELECT * FROM users WHERE email=? AND password=?",
      [email, password]
    );
    console.log("isUserExists>>", isUserExists.length);
    if (isUserExists.length > 0) {
      console.log("Yes User exists");
      res.json({
        status: "userExists",
        message: "Account is already registered with this email.",
      });
      return;
    }
    let userid = uuidv4();
    let [rows] = await conection.query(
      "INSERT INTO users (id, username, email, password) VALUES (?,?,?,?)",
      [userid, username, email, password]
    );
    console.log("rows.affectedRows", rows.affectedRows);
    if (rows.affectedRows) {
      // send a confimation email.
      let message = sendEmail(email, userid, "USER");
      if (message === "email sent") {
        res.json({
          success: true,
          status: "confirmEmail",
          message: "Please confirm you email!",
        });
      } else if (message === "email sent failed") {
        res.json({
          success: false,
          message: "Email sent failed.",
        });
      }
    }
  } catch (error) {
    console.log(`error during sigin the data ${error}`);
    console.log(error);
  } finally {
    conection.release();
  }
};

exports.userSignIn = async (req, res) => {
  let conection = await pool.getConnection();
  try {
    let email = req.body.email;
    let password = req.body.password;
    // First check if user exists
    let [isUserExists] = await conection.query(
      "SELECT * FROM users WHERE email=? AND password=?",
      [email, password]
    );
    console.log("isUserExists>>", isUserExists.length);
    if (isUserExists.length > 0 && isUserExists[0].verified === 1) {
      console.log("Yes User exists");
      const token = jwt.sign(
        { userid: isUserExists[0].id },
        process.env.Jwt_Secret_User,
        {
          expiresIn: "12h",
        }
      );
      res.status(200).json({
        userDetails: { id: isUserExists[0].id, email: isUserExists[0].email },
        token,
        status: "userExists",
        message: "LoggedIn Successfully.",
      });
      return;
    }
    if (isUserExists.length > 0 && isUserExists[0].verified === 0) {
      res.status(401).json({
        status: "emailNotConfirmed",
        message: "Attempt Failed.",
      });
      return;
    }
    if (!isUserExists || isUserExists.length === 0) {
      res.json({ status: "unauthorized" });
      return;
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
  const userid = req.params.id;
  if (await isUserVerified(userid)) {
    return res.send(
      `Your email is already verified. <a href='${process.env.Frontend_URL}/log-in'>Login here</a>`
    );
  }

  try {
    let [rows] = await conection.query(
      "UPDATE users SET verified=? WHERE id=?",
      [true, userid]
    );
    await userTrialAddUp(userid);
    res.send(
      `Email verified successfully. <a href='${process.env.Frontend_URL}/log-in'>Goto Login</a>`
    );
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

exports.sendEmail_for_forgotPassword = async (req, res) => {
  let email = req.params.email;
  let conection = await pool.getConnection();

  try {
    // find user id
    let [result] = await conection.query("SELECT id FROM users where email=?", [
      email,
    ]);
    console.log("result", result);
    if (result.length === 0) {
      return res.json({
        success: false,
        message: "This Email is not registered.",
      });
    }
    let message = sendEmail(email, result[0].id, "USER", "ForgotPassword");
    if (message === "email sent") {
      res.json({
        success: true,
        status: "confirmEmail",
        message: "Please confirm you email!",
      });
    } else if (message === "email sent failed") {
      res.json({
        success: false,
        message: "Email sent failed.",
      });
    }
  } catch (error) {
    console.log("error", error);
  } finally {
    conection.release();
  }
};

exports.reset_user_password = async (req, res) => {
  let conection = await pool.getConnection();
  const userid = req.params.userid;
  const password = req.params.password;
  try {
    let [rows] = await conection.query(
      "UPDATE users SET password=?, verified=? WHERE id=?",
      [password, true, userid]
    );
    res.json({ success: true });
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

exports.getuserinfo = async (req, res) => {
  let userid = req.userid;
  let conection = await pool.getConnection();
  try {
    // find user id
    let [result] = await conection.query("SELECT * FROM users where id=?", [
      userid,
    ]);
    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.log("error", error);
  } finally {
    conection.release();
  }
};

// create invoice
exports.trackAPIUsage = async (req, res) => {
  let { userid, apiTokenDashboard } = req.body;
  let [result] = await conection.query("SELECT * FROM users where id=?", [
    userid,
  ]);
  try {
    return res.json(invoice);
  } catch (error) {
    console.log("error", error);
  }
};

exports.createInvoice = async (req, res) => {
  let userid = req.userid;
  let { currency, amount } = req.body;
  // console.log({userid, currency, amount })
  let invoice = await createRealInvoice(userid, currency, amount);
  console.log("invoice resp:", invoice);
  try {
    return res.json(invoice);
  } catch (error) {
    console.log("error", error);
  }
};

//  checkoutSession
exports.checkoutSession = async (req, res) => {
  const amount = req.body.amount; // Amount in cents
  const userid = req.userid;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Custom Payment" },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.Frontend_URL}/dashboard`,
      cancel_url: `${process.env.Frontend_URL}/payment-failed/contact-provider`,
      metadata: {
        // 👈 Critical for user tracking
        userId: userid,
        amount: amount,
        // Add any other relevant data
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

//  / ******************** helpers function for generation ************** /
// User onboading helper functions
const userTrialAddUp = async (userid) => {
  let conection = await pool.getConnection();
  try {
    let key = await generateCaptchaKey();
    let captchaBalance = await getCaptchaBalance(key.key);
    // >>>First debug from here...are these values 
    // are going it side the db or not
    console.log("key:BalanceApiKey>>>", key)
    console.log("captchaBalance:totalAmountRequestsRemains>>", captchaBalance)
    const uuid = randomUUID();
    let [rows] = await conection.query(
      "UPDATE users SET apiTokenDashboard=?, BalanceApiKey=?, currentPlan=?, totalAmountRequestsRemains=?, balance=? WHERE id=?",
      [uuid, key.key, "Free", captchaBalance, 0, userid]
    );
  } catch (error) {
    console.log("error", error);
  } finally {
    conection.release();
  }
};

// onboarding helping apis

async function generateCaptchaKey() {
  try {
    let data = JSON.stringify({
      data: {
        quantity: 1, // 1000 requests
      },
    });

    let config = {
      method: "options",
      maxBodyLength: Infinity,
      url: "http://api.captchasolver.ai/admin/api/key/generate",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function getCaptchaBalance(apiKey) {
  try {
    let data = JSON.stringify({ key: apiKey });

    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "http://api.captchasolver.ai/api/getBalance",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);
    return response.data.balance;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Function to check if the user is already verified
const isUserVerified = async (userid) => {
  let connection = await pool.getConnection();
  try {
    let [rows] = await connection.query(
      "SELECT verified FROM users WHERE id = ?",
      [userid]
    );
    return rows.length > 0 && rows[0].verified === 1;
  } catch (error) {
    console.log("Error checking verification status:", error);
    return false;
  } finally {
    connection.release();
  }
};

// ***************Helper function for the Invoice and paid apis for users***************//
//  1. create invoice
const createRealInvoice = async (userid, currency, amount) => {
  const uuid = randomUUID();
  const data = {
    currencyInCode: currency,
    comment: userid,
    publicComment: `Order #${uuid}`,
    callbackUrl: `${process.env.Backend_URL}/webhook`,
    redirectUrl: "https://marketplace.com/cart",
    isBayerPaysService: true,
    isAwaitRequisites: true,
    invoiceAssetCode: "USDT",
    invoiceAmount: parseFloat(amount),
  };

  try {
    const response = await axios.post(
      "https://pay.alfabit.org/api/v1/integration/orders/invoice",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ALPHABIT_XAPI,
        },
      }
    );
    return {
      success: true,
      invoice: response.data,
      message: "Invoice created successfully",
    };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, message: "Internal Server error" };
  }
};
