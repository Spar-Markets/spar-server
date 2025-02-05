const express = require("express");
const router = express.Router();
const WaitListUser = require("../models/WaitListUser.js");
const nodemailer = require("nodemailer");
const { appPassword, mailKey } = require("../config/constants.js");
const sgMail = require('@sendgrid/mail')


router.post("/sendConfirmationEmail", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  try {
    // Check if the email already exists in the waitlist
    const existingUser = await WaitListUser.findOne({ email: String(email) });

    if (existingUser) {
      return res.status(409).send({ message: "Email is already on the waitlist" });
    }

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      secure: true,
      auth: {
        user: "sparmarketsdev@gmail.com",
        pass: appPassword,
      },
    });

    // Generate a unique confirmation URL
    //TODO, point domain to spar server
    const confirmationUrl = `https://spar-server-heroku-0fbb9e6415f2.herokuapp.com/confirm-waitlist?email=${encodeURIComponent(email)}`;

    sgMail.setApiKey(mailKey)

    const msg = {
      to: email, // Change to your recipient
      from: "jjquaratiello@gmail.com", // Change to your verified sender
      subject: 'Spar Markets - Confirm Your Spot on the Waitlist',
      text: 'text text',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <div style="margin-top: 20px; text-align: left;">
            <h2 style="color: black; margin: 0;">Confirm Your Spot on the Waitlist</h2>
            <p>Thank you for signing up for our waitlist! Please confirm your spot by clicking the button below:</p>
            <a href="${confirmationUrl}" style="display: block; width: 100%; background-color: white; color: black; padding: 15px 0; text-decoration: none; border: 2px solid black; border-radius: 5px; font-weight: bold; text-align: center;">Confirm Spot</a>
            <p style="margin-top: 20px;">Note: do not join the waitlist with multiple emails. When you create your account, you'll have to verify your identity and we only allow one account per person.</p>
            <p style="margin-top: 20px;">If you did not request to join the waitlist, please ignore this email.</p>
          </div>
        </div>
      `,
    }

    sgMail
      .send(msg)
      .then(() => {
        res.status(200).send({ message: "Confirmation email sent, please check your inbox." })
      })
      .catch((error) => {
        res.status(500).send({ message: `Failed to send confirmation email, please try again later. ${error}` });
      })

    // Email content
    /*const mailOptions = {
      to: email,
      subject: 'Spar Markets - Confirm Your Spot on the Waitlist',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <div style="margin-top: 20px; text-align: left;">
            <h2 style="color: black; margin: 0;">Confirm Your Spot on the Waitlist</h2>
            <p>Thank you for signing up for our waitlist! Please confirm your spot by clicking the button below:</p>
            <a href="${confirmationUrl}" style="display: block; width: 100%; background-color: white; color: black; padding: 15px 0; text-decoration: none; border: 2px solid black; border-radius: 5px; font-weight: bold; text-align: center;">Confirm Spot</a>
            <p style="margin-top: 20px;">Note: do not join the waitlist with multiple emails. When you create your account, you'll have to verify your identity and we only allow one account per person.</p>
            <p style="margin-top: 20px;">If you did not request to join the waitlist, please ignore this email.</p>
          </div>
        </div>
      `
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending confirmation email:", error);
        return res.status(500).send({ message: `Failed to send confirmation email, please try again later. ${error}` });
      }
      res.status(200).send({ message: "Confirmation email sent, please check your inbox." });
    }); */
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    res.status(500).send({ message: `Server error, please try again later. ${error}` });
  }
});

router.get("/confirm-waitlist", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  try {
    // Check if the email already exists in the waitlist
    const existingUser = await WaitListUser.findOne({ email: String(email) });

    if (existingUser) {
      return res.status(409).send({ message: "Email is already on the waitlist" });
    }

    // Add the user to the waitlist
    const waitListUser = new WaitListUser({
      email: String(email),
    });

    await waitListUser.save();

    // Send a simple HTML response with a success message and redirect
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="5;url=https://www.sparmarkets.com" />
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #345FE5; }
            p { font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>Success!</h1>
          <p>Your email has been successfully added to the waitlist.</p>
          <p>You will be redirected to the main page shortly.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error confirming waitlist:", error);
    res.status(500).send({ message: "Server error, please try again later." });
  }
});


module.exports = router;
