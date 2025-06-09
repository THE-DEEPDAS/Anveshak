import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaCheckCircle, FaArrowRight } from "react-icons/fa";
import Button from "../components/ui/Button";
import { initializePayment, verifyPayment } from "../services/paymentService";
import { useToast } from "../components/ui/Toaster";

const PaymentRequiredPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      const order = await initializePayment();

      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Anveshak",
        description: "Monthly Subscription",
        order_id: order.id,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            showToast(
              "Payment successful! You now have full access.",
              "success"
            );
            navigate("/dashboard");
          } catch (error) {
            showToast(
              error.response?.data?.message || "Payment verification failed",
              "error"
            );
          }
        },
        prefill: {
          name: localStorage.getItem("userName"),
          email: localStorage.getItem("userEmail"),
        },
        theme: {
          color: "#2563eb", // blue-600
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Could not initialize payment",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <FaLock className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Unlock Full Access
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Get access to all features and start landing your dream
            opportunities
          </p>
        </div>

        <div className="mt-12 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <div className="flex justify-center items-center mb-8">
                <span className="text-4xl font-bold text-gray-900">₹99</span>
                <span className="ml-2 text-xl text-gray-500">/month</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center">
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="ml-2 text-gray-600">
                    Personalized cold emails to companies
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="ml-2 text-gray-600">
                    AI-powered resume analysis
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="ml-2 text-gray-600">
                    Research opportunity emails
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="ml-2 text-gray-600">
                    Email tracking and management
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                isLoading={isProcessing}
                disabled={isProcessing}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-8"
                rightIcon={<FaArrowRight className="ml-2 h-4 w-4" />}
              >
                {isProcessing ? "Processing..." : "Subscribe Now"}
              </Button>

              <p className="mt-4 text-sm text-gray-500">
                Secure payment processed by Razorpay. No auto-renewal.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900">Why Subscribe?</h3>
          <p className="mt-2 text-blue-700">
            Join hundreds of students who have successfully landed internships
            and research positions using Anveshak. Our AI-powered platform helps
            you create personalized outreach that gets responses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequiredPage;
