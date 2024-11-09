import { client, sender } from "./mailtrap";

// Function to send a verification email to the user
export const sendVerification = async (email: string, verificationToken: string) => {
  // Define the recipients as an array of objects, each containing an email address
  const recipients = [{ email }];

  try {
    // Send an email using the client
    const res = await client.send({
      from: sender,                    // Sender's email address (predefined variable)
      to: recipients,                   // Recipient's email address
      subject: "Verify your email",     // Subject line of the email
      category: "Email Verification"    // Category for tracking purposes
    });

  } catch (error) {
    // Log any errors to the console and throw a new error with a custom message
    console.log(error);
    throw new Error("Failed to send email verification");
  }
}


export const sendWelcomeEmail = async (email: string, name: string) => {
  const recipients = [{ email }];
  const htmlContent = "";
  try {
    // Send an email using the client
    const res = await client.send({
      from: sender,                    // Sender's email address (predefined variable)
      to: recipients,                   // Recipient's email address
      subject: "Welcome to CDYEATS",     // Subject line of the email
      html: htmlContent,                  //   Html Content
      template_variables: {
        company_info_name: "CDYEATS",
        name: name
      }
    });

  } catch (error) {
    // Log any errors to the console and throw a new error with a custom message
    console.log(error);
    throw new Error("Failed to send welcome email");
  }
}