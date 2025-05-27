import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const PricingPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">Simple, Transparent Pricing</h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Affordable plans to help you land your dream opportunities
        </p>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 text-white p-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Monthly Subscription</h2>
            <div className="flex justify-center items-center mb-4">
              <span className="text-5xl font-bold">₹99</span>
              <span className="ml-2 text-blue-200">/month</span>
            </div>
            <p className="text-blue-100 mb-6">
              One simple plan with everything you need
            </p>
            <Link 
              to="/signup" 
              className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
          </div>
          
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">What's included:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Unlimited personalized cold emails to companies</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Academic emails for research opportunities</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">AI-powered resume parsing and analysis</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Email tracking and management</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Email templates and customization options</span>
                </li>
                <li className="flex items-start">
                  <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Priority customer support</span>
                </li>
              </ul>
            </div>              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Important Notes:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• No automatic renewal - pay only when you need it</li>
                <li>• No long-term commitments - subscribe month by month</li>
                <li>• Full access to all features for 30 days</li>
                <li>• Secure payment processing</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Why Choose Anveshak?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Proven Results</h3>
                <p className="text-gray-600">
                  Our platform has helped hundreds of students land interviews at top tech companies and research positions
                  at prestigious universities.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">AI-Powered Personalization</h3>
                <p className="text-gray-600">
                  Our advanced AI analyzes your resume and tailors emails that highlight your strengths and relevant experience
                  for each specific opportunity.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Affordable & Accessible</h3>
                <p className="text-gray-600">
                  We've kept our pricing student-friendly because we believe everyone deserves access to tools that can help
                  them advance their careers.
                </p>
              </div>
                <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">No Risk</h3>
                <p className="text-gray-600">
                  With our commitment-free subscription model and no auto-renewal, you can try Anveshak without any long-term obligations.
                  You're in complete control of your subscription.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Do you offer student discounts?</h3>
                <p className="text-gray-600">
                  Our pricing is already optimized for students! At just Rs. 99 per month, we've made sure our service is affordable
                  for students at all levels.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">
                  Absolutely! There's no auto-renewal, so you simply pay for each month as you need it. You have full control over your subscription.
                </p>
              </div>
                <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">How does the subscription work?</h3>
                <p className="text-gray-600">
                  Our subscription model is designed to be simple and student-friendly. You pay Rs. 99 for 30 days of full access.
                  There's no auto-renewal, so you only pay when you choose to extend your subscription for another month.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Do you store my payment information?</h3>
                <p className="text-gray-600">
                  No, we don't store your payment information. All payments are securely processed and we implement the highest security standards
                  to protect your information during the payment process.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Will there be any price increases?</h3>
                <p className="text-gray-600">
                  We're committed to keeping our service affordable. If there are any changes to our pricing structure,
                  we'll notify all users well in advance.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Ready to start landing more interviews?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join hundreds of students who have successfully used Anveshak to secure internships and research opportunities.
            </p>
            <Link 
              to="/signup" 
              className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
