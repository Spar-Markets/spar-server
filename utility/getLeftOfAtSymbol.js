// Function for username splicing:
function getLeftOfAtSymbol(email) {
  // Check if the email contains the @ symbol
  if (email.includes("@")) {
    // Split the email string at the @ symbol and return the first part
    return email.split("@")[0];
  } else {
    // If there is no @ symbol, return the entire string or handle as needed
    return email;
  }
}

module.exports = getLeftOfAtSymbol;
