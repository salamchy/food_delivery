// Function to generate a random verification code of specified length
export const generateVerificationCode = (length: 6): String => {
  // Define the characters to use in the code (uppercase, lowercase letters, and numbers)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let verificationCode = ''; // Initialize an empty string for the verification code
  const charactersLength = characters.length; // Get the total number of characters available

  // Loop to create a code of the specified length
  for (let i = 0; i < length; i++) {
    // Pick a random character from the `characters` string and add it to `verificationCode`
    verificationCode += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  // Return the generated verification code
  return verificationCode;
};

}