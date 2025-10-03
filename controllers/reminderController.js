// controllers/reminderController.js
import { google } from "googleapis";
import User from "../models/User.js"; // adjust path if needed

// Setup Google OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // e.g. http://localhost:5000/api/reminders/oauth2callback
);

// Store tokens (⚠️ for demo only — in production, store per user in DB)
let tokens = null;

// Step 1: Start Google OAuth flow
export const googleAuth = (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/calendar"];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(url);
};

// Step 2: Handle Google OAuth callback
export const oauthCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens: newTokens } = await oauth2Client.getToken(code);
    tokens = newTokens;
    oauth2Client.setCredentials(tokens);

    res.send("✅ Google Calendar connected! You can now set reminders.");
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).json({ error: "Failed to authenticate with Google." });
  }
};

// Step 3: Set reminder for subscription
export const setReminder = async (req, res) => {
  try {
    if (!tokens) {
      return res.status(401).json({
        error: "Google Calendar not connected. Please authenticate first.",
      });
    }

    const subscriptionId = req.params.id;

    // Find user with this subscription
    const user = await User.findOne({ "subscriptions._id": subscriptionId });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User with subscription not found." });
    }

    // Find the specific subscription
    const subscription = user.subscriptions.id(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found." });
    }

    // Google Calendar setup
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const startDate = new Date(subscription.nextPaymentDate);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1); // 1-hour reminder slot

    const event = {
      summary: `Payment Reminder: ${subscription.serviceName}`,
      description: `Reminder for your ${subscription.serviceName} subscription payment of $${subscription.cost}.`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Asia/Kolkata", // change to your TZ if needed
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    return res.json({
      message: "✅ Reminder created successfully!",
      link: response.data.htmlLink,
    });
  } catch (err) {
    console.error("Set Reminder Error:", err);
    res.status(500).json({ error: "Failed to set reminder." });
  }
};
