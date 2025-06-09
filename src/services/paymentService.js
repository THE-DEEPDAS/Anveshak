import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

// Helper to ensure Razorpay SDK is loaded
const waitForRazorpay = (maxWait = 10000) => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      return resolve(window.Razorpay);
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.Razorpay) {
        clearInterval(interval);
        resolve(window.Razorpay);
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(interval);
        reject(new Error("Razorpay SDK failed to load"));
      }
    }, 100);
  });
};

class PaymentError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.details = details;
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError);
    }
  }

  toString() {
    return `${this.name}: ${this.message} (Code: ${this.code})`;
  }
}

// Helper to normalize API errors
const normalizeError = (error) => {
  if (error instanceof PaymentError) {
    return error;
  }

  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "An unknown payment error occurred";

  const code = error.response?.status || 500;
  const details = error.response?.data?.details || {};

  return new PaymentError(message, code, details);
};

export const initializePayment = async () => {
  try {
    // Wait for Razorpay SDK to load
    await waitForRazorpay();

    // Create order on server
    const response = await axios.post(`${API_ENDPOINTS.payment}/create-order`);

    if (!response.data) {
      throw new PaymentError("Empty response from server", 500);
    }

    // Log response for debugging
    console.debug("Payment order response:", {
      ...response.data,
      key_id: response.data.key_id ? "***" : undefined,
    });

    // Validate required fields
    const requiredFields = ["order_id", "key_id", "amount", "currency"];
    const missingFields = requiredFields.filter(
      (field) => !response.data[field]
    );

    if (missingFields.length > 0) {
      throw new PaymentError("Invalid order response from server", 400, {
        missingFields,
      });
    }

    const options = {
      key: response.data.key_id,
      amount: response.data.amount,
      currency: response.data.currency,
      name: "Anveshak",
      description: "Monthly Subscription",
      order_id: response.data.order_id,
      notes: {
        address: "user payment",
      },
      prefill: {
        name: localStorage.getItem("userName") || "",
        email: localStorage.getItem("userEmail") || "",
        contact: "", // Optional phone number
      },
      config: {
        display: {
          blocks: {
            utib: {
              name: "Pay using Bank Account or UPI",
              instruments: [
                {
                  method: "upi",
                },
                {
                  method: "netbanking",
                },
              ],
            },
            other: {
              name: "Other Payment modes",
              instruments: [
                {
                  method: "card",
                },
                {
                  method: "wallet",
                },
              ],
            },
          },
          sequence: ["block.utib", "block.other"],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      modal: {
        confirm_close: true,
        escape: false,
        animation: true,
        backdropclose: false,
        handleback: true,
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
      timeout: 300,
      handler: async function (response) {
        try {
          if (!window.navigator.onLine) {
            throw new Error(
              "No internet connection. Please check your connection and try again."
            );
          }

          // Validate the response data
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

          const result = await verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (result?.message === "Payment verified successfully") {
            // Small delay to ensure server state is updated
            await new Promise((resolve) => setTimeout(resolve, 1500));
            window.location.reload();
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
        color: "#2563eb",
        backdrop_color: "rgba(0,0,0,0.7)",
      },
    };

    // Create new instance and handle errors
    const razorpay = new window.Razorpay(options);

    // Enhanced error handling for payment failures
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

    // Additional event listeners for better error tracking
    razorpay.on("payment.error", function (data) {
      console.error("Payment error:", data);
    });

    // Open payment modal
    razorpay.open();
    return response.data;
  } catch (error) {
    console.error("Payment initialization failed:", error);

    // Special handling for network errors
    if (!window.navigator.onLine) {
      throw new PaymentError(
        "No internet connection. Please check your connection and try again.",
        0
      );
    }

    // Special handling for SDK load failure
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

    throw normalizeError(error);
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.payment}/verify`,
      paymentData
    );
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const checkPaymentStatus = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.payment}/status`, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.data) {
      throw new PaymentError("Invalid response from payment status check", 500);
    }

    const { hasValidPayment, paymentExpiryDate, lastPaymentId } = response.data;

    // Add client-side validation
    const now = new Date();
    const expiryDate = paymentExpiryDate ? new Date(paymentExpiryDate) : null;
    const isValid = Boolean(hasValidPayment) && expiryDate && expiryDate > now;

    return {
      hasValidPayment: isValid,
      paymentExpiryDate: expiryDate,
      lastPaymentId,
    };
  } catch (error) {
    // Don't throw for status check, return error state
    return {
      hasValidPayment: false,
      paymentExpiryDate: null,
      error: normalizeError(error).message,
    };
  }
};

export const getPaymentHistory = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.payment}/history`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};
