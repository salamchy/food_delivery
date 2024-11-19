import { MailtrapClient } from "mailtrap";

// Create a new MailtrapClient instance to interact with the Mailtrap API
// The `token` is retrieved from environment variables for security.
// Make sure you set the `MAILTRAP_API_TOKEN` environment variable in your project.
export const client = new MailtrapClient({
  token: process.env.MAILTRAP_API_TOKEN!, // API token for authentication
});

// Define the sender details that will appear in the email.
// Update the `email` and `name` fields with your desired sender information.
export const sender = {
  email: "hello@demomailtrap.com", // Sender's email address
  name: "CDYEATS",                // Sender's display name
};
