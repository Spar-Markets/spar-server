const crypto = require("crypto");

// Function for random string generation:

function generateRandomString(length) {
  // Define the characters that can be used in the random string
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let randomString = "";
  for (let i = 0; i < length; i++) {
    // Generate a random index to select a character from the charset
    const randomIndex = crypto.randomInt(0, charset.length);
    // Append the randomly selected character to the random string
    randomString += charset[randomIndex];
  }
  return randomString;
}

module.exports = generateRandomString;
