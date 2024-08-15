const express = require("express");
const router = express.Router();
const WaitListUser = require("../models/WaitListUser.js");
const nodemailer = require("nodemailer");
const { appPassword } = require("../config/constants.js");

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
      service: 'smtp.gmail.com',
      port: 456,
      secure: true,
      auth: {
        user: "sparmarketsdev@gmail.com",
        pass: appPassword,
      },
    });

    // Generate a unique confirmation URL
    const confirmationUrl = `${process.env.CLIENT_URL}/confirm-waitlist?email=${encodeURIComponent(email)}`;

    // Email content
    const mailOptions = {
      to: email,
      subject: 'Confirm Your Spot on the Waitlist',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h1 style="color: #345FE5;">Confirm Your Spot on the Waitlist</h1>
          <p>Thank you for signing up for our waitlist! Please confirm your spot by clicking the button below:</p>
          <a href="${confirmationUrl}" style="background-color: #345FE5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirm Spot</a>
          <p>If you did not request to join the waitlist, please ignore this email.</p>
        </div>
      `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending confirmation email:", error);
        return res.status(500).send({ message: "Failed to send confirmation email, please try again later." });
      }
      res.status(200).send({ message: "Confirmation email sent, please check your inbox." });
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    res.status(500).send({ message: "Server error, please try again later." });
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
    res.status(200).send({ message: "Email successfully added to the waitlist!" });
  } catch (error) {
    console.error("Error confirming waitlist:", error);
    res.status(500).send({ message: "Server error, please try again later." });
  }
});

module.exports = router;
