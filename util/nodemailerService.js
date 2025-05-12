const nodemailer = require("nodemailer");

exports.sendEmail = (to, id, user_type, isForgotPassword = false) => {
  try {
    let verification_link;

    if (user_type === "USER") {
      if (isForgotPassword) {
        verification_link = `${process.env.Client_Side_url_for_resetPassword}?userid=${id}`;
      } else {
        verification_link = `${process.env.email_verification_link_user}/${id}`;
      }
    } else if (user_type === "ADMIN") {
      verification_link = `${process.env.email_verification_link_admin}/${id}`;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.host,
      port: 465,
      secure: true,
      auth: {
        user: process.env.user,
        pass: process.env.pass,
      },
    });

    const subject = isForgotPassword
      ? "Password Reset Request"
      : "Email Confirmation!";
    const text = isForgotPassword
      ? "Please reset your password by clicking the link below."
      : "Please confirm your email by clicking the link below.";
    const buttonText = isForgotPassword ? "Reset Password" : "Verify Now";

    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .email-container {
                background-color: #ffffff;
                padding: 20px;
                margin: 50px auto;
                width: 100%;
                max-width: 600px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
                text-align: center;
                padding-bottom: 20px;
            }
            .email-body {
                padding: 20px;
                text-align: center;
            }
            .verify-button {
                display: inline-block;
                padding: 15px 25px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }
            .email-footer {
                text-align: center;
                padding-top: 20px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h2>${subject}</h2>
            </div>
            <div class="email-body">
                <p>${text}</p>
                <br/>
                <a href="${verification_link}" class="verify-button" target="_blank">${buttonText}</a>
            </div>
            <div class="email-footer">
                <p>If you did not request this, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>`;

    transporter.sendMail({
      from: {
        name: "Captcha Solver",
        address: process.env.user,
      },
      to,
      subject,
      text,
      html: htmlContent,
    });

    console.log("Email sent successfully");
    return "email sent";
  } catch (error) {
    console.error("Error sending email:", error);
    return "email failed";
  }
};
