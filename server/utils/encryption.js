import CryptoJS from "crypto-js";
import { config } from "../config/config.js";

// Get encryption key from environment variables or use a default for development
const ENCRYPTION_KEY =
  process.env.SMTP_ENCRYPTION_KEY ||
  config.security.encryptionKey ||
  "cold-mailer-default-key-for-smtp-passwords";

/**
 * Encrypts sensitive data like SMTP passwords
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text
 */
const encrypt = (text) => {
  if (!text) return "";
  const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  return encrypted;
};

/**
 * Decrypts encrypted data
 * @param {string} encryptedText - Encrypted text to decrypt
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Error decrypting text:", error);
    return "";
  }
};

// Export both functions as a single object
const encryptionUtil = { encrypt, decrypt };
export default encryptionUtil;
