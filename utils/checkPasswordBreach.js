const axios = require("axios");
const CryptoJS = require("crypto-js");

const checkPasswordBreach = async (plainPassword) => {
  try {
    const sha1 = CryptoJS.SHA1(plainPassword).toString().toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await axios.get(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );
    const lines = response.data.split("\n");

    const match = lines.find((line) => line.startsWith(suffix));
    if (match) {
      const count = parseInt(match.split(":")[1]);
      return count;
    }

    return 0;
  } catch (error) {
    console.error("Error checking password breach:", error.message);
    return 0;
  }
};

module.exports = checkPasswordBreach;
