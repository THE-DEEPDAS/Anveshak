const validateRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_SECRET;
  const isLiveKey = keyId?.startsWith('rzp_live_');
  const isTestKey = keyId?.startsWith('rzp_test_');

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are missing');
  }

  if (!isLiveKey && !isTestKey) {
    throw new Error('Invalid Razorpay key format');
  }

  // Warn if using live key in development
  if (isLiveKey && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Warning: Using Razorpay live key in development environment');
  }

  // Warn if using test key in production
  if (isTestKey && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Warning: Using Razorpay test key in production environment');
  }

  return {
    key_id: keyId,
    key_secret: keySecret,
    amount: parseInt(process.env.PAYMENT_AMOUNT) || 9900, // Rs. 99 in paise
    currency: process.env.PAYMENT_CURRENCY || 'INR',
    payment_capture: 1,
    validity_days: parseInt(process.env.PAYMENT_VALIDITY_DAYS) || 30
  };
};

export default {
  razorpay: validateRazorpayConfig()
};
