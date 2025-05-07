require("dotenv").config();
const express = require("express");
const cors = require("cors");
const adminRouter = require("../routes/Admin/Auth/index");
const userRouter = require("../routes/User/Auth/index");
// Ecommerce Module Routes
const path = require("path");
const morgan = require("morgan");
const { runDatabase } = require("../Database/runDatabase");
const { pool } = require("../Database/databaseConnection/DbConnect");

const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// stripe webhook
// Webhook Endpoint
const endpointSecret = process.env.STRIPE_SECRET_SIGN;

// Middleware to get raw body - MUST be before express.json()
app.post(
  "/stripewebhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, // Raw request body
        sig,
        endpointSecret
      );
    } catch (err) {
      // Handle errors differently for debugging
      if (err instanceof stripe.errors.StripeSignatureVerificationError) {
        console.error("⚠️  Signature verification failed:", err.message);
        return res
          .status(400)
          .send(`Signature verification failed: ${err.message}`);
      } else if (err instanceof SyntaxError) {
        console.error("⚠️  JSON parsing error:", err.message);
        return res.status(400).send("Invalid JSON");
      } else {
        console.error("⚠️  Unexpected error:", err);
        return res.status(400).send("Webhook error");
      }
    }

    // Handle events
    switch (event.type) {
      case "charge.succeeded":
        const charge = event.data.object;
        console.log("Charge succeeded:", charge.metadata);
        break;

      case "checkout.session.completed":
        const session = event.data.object;
        console.log("Checkout session", session.metadata);
        console.log("session.payment_status", session.payment_status);
        if (session.payment_status === "paid") {
          let { userId, amount } = session.metadata;
          console.log("success :coming inside the paid", userId, amount);
          amount = amount / 100; // convert from cents to usd
          let totalAmountRequestsRemains = parseInt(amount) * 1000;
          (async () => {
            let connection;
            try {
              connection = await pool.getConnection();
              await connection.query(
                "UPDATE users SET totalAmountRequestsRemains = totalAmountRequestsRemains + ?, balance = balance + ? WHERE id=?",
                [totalAmountRequestsRemains, parseInt(amount), userId]
              );
            } catch (error) {
              console.log(error);
            } finally {
              if (connection) connection.release();
            }
          })();
        }

        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).end();
  }
);

app.use(express.json());
app.use(morgan("dev"));

// app level settings
// app.use(
//   cors({
//     origin: `${process.env.Frontend_URL}`, // Your next app URL
//     credentials: true, // This is required to allow cookies and headers
//   })
// );
app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
const Port = process.env.PORT || 1000;

app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("/images", express.static(path.join("public/images/")));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to the Captchaslover." });
});

// alphabit pay
app.post("/webhook", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("Webhook received:", req.body);
    let userid = req.body.comment;
    let orderid = req.body.publicComment;
    let isSuccessPaidUser = req.body.isImPayed;
    let status = req.body.status;
    let paidAmount = parseInt(req.body.invoiceAmount); // Ensure it's a number
    let totalAmountRequestsRemains = paidAmount * 1000;
    if (isSuccessPaidUser === true && status === "success") {
      // Update user with its balance
      await connection.query(
        "UPDATE users SET totalAmountRequestsRemains = totalAmountRequestsRemains + ?, balance = balance + ? WHERE id=?",
        [totalAmountRequestsRemains, paidAmount, userid]
      );
    }
    res.json({ success: "ok" });
  } catch (error) {
    console.log("Webhook error", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

app.listen(Port, () => {
  console.log(`Server is listening at port ${Port}`);
});

// Database connection
runDatabase()
  .then(() => {
    console.log("Database is connected");
  })
  .catch((err) => {
    console.log(err);
  });
