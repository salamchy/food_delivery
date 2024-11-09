import { client, sender } from "./mailtrap";

export const sendVerification = async (email: string, verificationToken: string) => {
  const recipients = [{ email }];
  try {
    const res = await client.send({
      from: sender,
      to: recipients,
      subject: "Verify your email",
      category: "Email Verification"
    })
  } catch (error) {
    console.log(error);
    throw new Error("Failed to send email verificarion")
  }
}