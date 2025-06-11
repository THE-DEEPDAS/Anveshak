import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

// Helper function to ensure Razorpay SDK is loaded before proceeding
const waitForRazorpay = (maxWait = 10000) => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay SDK is already loaded
    if (window.Razorpay) {
      return resolve(window.Razorpay); // Resolve the promise with the Razorpay object
    }

    const startTime = Date.now(); // Record the start time for timeout tracking
    const interval = setInterval(() => {
      // Periodically check if Razorpay SDK is loaded
      if (window.Razorpay) {
        clearInterval(interval); // Stop checking once loaded
        resolve(window.Razorpay); // Resolve the promise with the Razorpay object
      } else if (Date.now() - startTime > maxWait) {
        // If the maximum wait time is exceeded
        clearInterval(interval); // Stop checking
        reject(new Error("Razorpay SDK failed to load")); // Reject the promise with an error
      }
    }, 100); // Check every 100 milliseconds
  });
};

// Custom error class for handling payment-related errors
class PaymentError extends Error {
  constructor(message, code, details = {}) {
    super(message); // Call the parent Error constructor
    this.name = "PaymentError"; // Set the error name
    this.code = code; // Set the error code
    this.details = details; // Additional details about the error

    // Capture the stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError);
    }
  }

  // Override the toString method to provide a custom error message format
  toString() {
    return `${this.name}: ${this.message} (Code: ${this.code})`;
  }
}

// Helper function to normalize API errors into PaymentError instances
const normalizeError = (error) => {
  if (error instanceof PaymentError) {
    return error; // Return the error if it's already a PaymentError
  }

  // Extract error details from the response or fallback to generic values
  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "An unknown payment error occurred";

  const code = error.response?.status || 500; // Default to HTTP 500 if no status is provided
  const details = error.response?.data?.details || {}; // Extract additional details

  return new PaymentError(message, code, details); // Return a new PaymentError instance
};

// Function to initialize the payment process
export const initializePayment = async () => {
  try {
    // Wait for Razorpay SDK to load
    await waitForRazorpay();

    // Create a payment order on the server
    const response = await axios.post(`${API_ENDPOINTS.payment}/create-order`);

    if (!response.data) {
      throw new PaymentError("Empty response from server", 500); // Throw an error if the response is empty
    }

    // Log the server response for debugging purposes
    console.debug("Payment order response:", {
      ...response.data,
      key_id: response.data.key_id ? "***" : undefined, // Mask sensitive data
    });

    // Validate required fields in the server response
    const requiredFields = ["order_id", "key_id", "amount", "currency"];
    const missingFields = requiredFields.filter(
      (field) => !response.data[field]
    );

    if (missingFields.length > 0) {
      throw new PaymentError("Invalid order response from server", 400, {
        missingFields, // Include missing fields in the error details
      });
    }

    // Configure Razorpay payment options
    const options = {
      key: response.data.key_id, // Razorpay API key
      amount: response.data.amount, // Payment amount in paise
      currency: response.data.currency, // Payment currency
      name: "Anveshak", // Merchant name
      description: "Monthly Subscription", // Payment description
      order_id: response.data.order_id, // Razorpay order ID
      notes: {
        address: "user payment", // Additional notes
      },
      prefill: {
        name: localStorage.getItem("userName") || "", // Prefill user name
        email: localStorage.getItem("userEmail") || "", // Prefill user email
        contact: "", // Optional phone number
      },
      config: {
        display: {
          blocks: {
            utib: {
              name: "Pay using Bank Account or UPI", // Block name
              instruments: [
                { method: "upi" }, // UPI payment method
                { method: "netbanking" }, // Netbanking payment method
              ],
            },
            other: {
              name: "Other Payment modes", // Block name
              instruments: [
                { method: "card" }, // Card payment method
                { method: "wallet" }, // Wallet payment method
              ],
            },
          },
          sequence: ["block.utib", "block.other"], // Display sequence
          preferences: {
            show_default_blocks: true, // Show default blocks
          },
        },
      },
      modal: {
        confirm_close: true, // Require confirmation before closing
        escape: false, // Disable escape key to close modal
        animation: true, // Enable modal animation
        backdropclose: false, // Disable backdrop click to close modal
        handleback: true, // Handle back button
      },
      retry: {
        enabled: true, // Enable retry for failed payments
        max_count: 3, // Maximum retry attempts
      },
      timeout: 300, // Timeout for payment modal
      handler: async function (response) {
        try {
          if (!window.navigator.onLine) {
            throw new Error(
              "No internet connection. Please check your connection and try again."
            );
          }

          // Validate the response data from Razorpay
          const requiredFields = [
            "razorpay_payment_id",
            "razorpay_order_id",
            "razorpay_signature",
          ];
          const missingFields = requiredFields.filter(
            (field) => !response[field]
          );

          if (missingFields.length > 0) {
            throw new Error(
              `Missing required fields: ${missingFields.join(", ")}`
            );
          }

          // Verify the payment on the server
          const result = await verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (result?.message === "Payment verified successfully") {
            // Small delay to ensure server state is updated
            await new Promise((resolve) => setTimeout(resolve, 1500));
            window.location.reload(); // Reload the page after successful payment
          } else {
            throw new Error(
              "Payment verification failed: Invalid server response"
            );
          }
        } catch (error) {
          console.error("Payment verification failed:", error);
          alert(
            `Payment verification failed: ${
              error.message
            }\n\nIf amount was deducted, please contact support with these details:\nPayment ID: ${
              response.razorpay_payment_id || "unknown"
            }\nOrder ID: ${response.razorpay_order_id || "unknown"}`
          );
        }
      },
      theme: {
        color: "#2563eb", // Theme color for the payment modal
        backdrop_color: "rgba(0,0,0,0.7)", // Backdrop color for the modal
      },
    };

    // Create a new Razorpay instance with the configured options
    const razorpay = new window.Razorpay(options);

    // Attach event listener for payment failures
    razorpay.on("payment.failed", function (response) {
      console.error("Payment failed:", response.error);
      const errorMessage =
        response.error.description ||
        response.error.reason ||
        response.error.message ||
        "Unknown error occurred";
      alert(
        `Payment failed: ${errorMessage}\n\nError code: ${response.error.code}`
      );
    });

    // Attach additional event listener for payment errors
    razorpay.on("payment.error", function (data) {
      console.error("Payment error:", data);
    });

    // Open the Razorpay payment modal
    razorpay.open();
    return response.data; // Return the server response data
  } catch (error) {
    console.error("Payment initialization failed:", error);

    // Handle specific errors
    if (!window.navigator.onLine) {
      throw new PaymentError(
        "No internet connection. Please check your connection and try again.",
        0
      );
    }

    if (error.message === "Razorpay SDK failed to load") {
      throw new PaymentError(
        "Payment service is temporarily unavailable. Please check if any ad blockers are enabled and try again.",
        500
      );
    }

    if (error.response?.status === 500) {
      throw new PaymentError(
        "Payment service temporarily unavailable. Please try again in a few minutes.",
        500
      );
    }

    throw normalizeError(error); // Normalize and throw the error
  }
};

// Function to verify payment on the server
export const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.payment}/verify`,
      paymentData
    );
    return response.data; // Return the server response data
  } catch (error) {
    throw normalizeError(error); // Normalize and throw the error
  }
};

// Function to check payment status
export const checkPaymentStatus = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.payment}/status`, {
      headers: {
        "Cache-Control": "no-cache", // Prevent caching
        Pragma: "no-cache", // Prevent caching
      },
    });

    if (!response.data) {
      throw new PaymentError("Invalid response from payment status check", 500);
    }

    const { hasValidPayment, paymentExpiryDate, lastPaymentId } = response.data;

    // Validate payment expiry date
    const now = new Date();
    const expiryDate = paymentExpiryDate ? new Date(paymentExpiryDate) : null;
    const isValid = Boolean(hasValidPayment) && expiryDate && expiryDate > now;

    return {
      hasValidPayment: isValid, // Whether the payment is valid
      paymentExpiryDate: expiryDate, // Expiry date of the payment
      lastPaymentId, // Last payment ID
    };
  } catch (error) {
    // Return error state instead of throwing
    return {
      hasValidPayment: false,
      paymentExpiryDate: null,
      error: normalizeError(error).message, // Normalize and return the error message
    };
  }
};

// Function to fetch payment history
export const getPaymentHistory = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.payment}/history`);
    return response.data; // Return the server response data
  } catch (error) {
    throw normalizeError(error); // Normalize and throw the error
  }
};
