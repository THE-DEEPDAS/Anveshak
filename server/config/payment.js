export default {
  razorpay: {
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
    amount: process.env.PAYMENT_AMOUNT || 9900, // Rs. 99 in paise
    currency: process.env.PAYMENT_CURRENCY || "INR",
    payment_capture: 1,
    validity_days: process.env.PAYMENT_VALIDITY_DAYS || 30,
  },
};
