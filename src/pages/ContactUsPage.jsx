import React, { useState } from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitStatus({
        success: true,
        message: "Thank you for your message! We will get back to you soon.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: "There was an error sending your message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Contact Us
        </h1>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-10">
          <div className="flex flex-col md:flex-row">
            <div className="bg-blue-600 text-white p-8 md:w-1/3">
              <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
              <p className="mb-8 text-blue-100">
                Have questions about our services? Want to learn more about how
                Anveshak can help you? Reach out to us and we'll get back to you
                as soon as possible.
              </p>

              <div className="space-y-6">
                {" "}
                <div className="flex items-start space-x-3">
                  <FaMapMarkerAlt className="h-5 w-5 mt-1 text-blue-200" />
                  <div>
                    <h3 className="font-semibold text-white">Address</h3>
                    <p className="text-blue-100">
                      AI Department, SVNIT, Surat, Gujarat, India
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FaEnvelope className="h-5 w-5 mt-1 text-blue-200" />
                  <div>
                    <h3 className="font-semibold text-white">Email</h3>
                    <a
                      href="mailto:deepdblm@outlook.com"
                      className="text-blue-100 hover:text-white transition-colors"
                    >
                      deepdblm@outlook.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 md:w-2/3">
              <h2 className="text-2xl font-semibold mb-6 text-gray-700">
                Send us a Message
              </h2>

              {submitStatus && (
                <div
                  className={`mb-6 p-4 rounded-md ${
                    submitStatus.success
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                What is Anveshak?
              </h3>
              <p className="text-gray-600">
                {" "}
                Anveshak is an advanced AI-powered platform that uses multiple
                parsing algorithms and Google's Gemini AI to accurately analyze
                resumes and help students create personalized cold emails to
                potential employers and professors, significantly increasing
                their chances of landing interviews and research opportunities.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                How does the pricing work?
              </h3>
              <p className="text-gray-600">
                We offer a simple, affordable subscription at just Rs. 99 per
                month. There's no automatic renewal or hidden fees. Visit our{" "}
                <a href="/pricing" className="text-blue-600 hover:underline">
                  Pricing page
                </a>{" "}
                to learn more.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                How can I get a refund?
              </h3>
              <p className="text-gray-600">
                If you're not satisfied with our service, you can request a
                refund within 7 days of your purchase. Please check our{" "}
                <a
                  href="/refund-policy"
                  className="text-blue-600 hover:underline"
                >
                  Refund Policy
                </a>{" "}
                for more information.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Do you provide technical support?
              </h3>
              <p className="text-gray-600">
                Yes, we offer technical support via email. If you encounter any
                issues, please contact us at
                <a
                  href="mailto:deepdblm@outlook.com"
                  className="text-blue-600 hover:underline ml-1"
                >
                  deepdblm@outlook.com
                </a>{" "}
                and we'll get back to you within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
