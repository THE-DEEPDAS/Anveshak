import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Terms and Conditions</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <p className="text-gray-600 mb-6">
            Last Updated: May 27, 2025
          </p>
          
          <div className="prose prose-blue max-w-none text-gray-600">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">1. Introduction</h2>
            <p>
              Welcome to Anveshak ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of the Anveshak website
              and services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
              If you disagree with any part of the Terms, you may not access the Service.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">2. Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information at all times.
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
              You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
              <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">3. Subscription and Payment</h2>
            <p>
              Our Service is offered on a subscription basis. You agree to pay the fees applicable to your subscription plan.
              All payments are processed securely through our payment system.
            </p>
            <p>
              We offer a monthly subscription at Rs. 99 per month. Each subscription grants you access to all features of the Service for a period of 30 days from the date of purchase.
              There is no automatic renewal; you must manually renew your subscription at the end of each period if you wish to continue using the Service.
            </p>
            <p>
              For information on our subscription terms, please refer to our <Link to="/refund-policy" className="text-blue-600 hover:underline">Subscription Policy</Link>.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">4. Content and License</h2>
            <p>
              Our Service allows you to upload, submit, store, and share content, including resumes and other personal information.
              By uploading, submitting, storing, or sharing content on our Service, you grant us a worldwide, non-exclusive, royalty-free license
              to use, reproduce, modify, adapt, publish, and display such content solely for the purpose of providing and improving the Service.
            </p>
            <p>
              You represent and warrant that you own or have the necessary rights to the content you submit and that the content does not infringe
              the intellectual property rights or other rights of any third party.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">5. Prohibited Uses</h2>
            <p>
              You agree not to use the Service for any purpose that is prohibited by these Terms or applicable law. You may not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the Service in any way that violates any applicable law or regulation</li>
              <li>Use the Service to send unsolicited commercial messages or spam</li>
              <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service, other accounts, computer systems, or networks connected to the Service</li>
              <li>Use the Service to generate deceptive, fraudulent, or misleading content</li>
              <li>Collect or track the personal information of other users</li>
              <li>Harass, abuse, or harm another person</li>
              <li>Use the Service for any activity that may adversely affect the quality of other users' experience</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of Anveshak and its licensors.
              The Service is protected by copyright, trademark, and other laws of India and foreign countries.
              Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Anveshak.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">7. Limitation of Liability</h2>
            <p>
              In no event shall Anveshak, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental,
              special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses,
              resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service;
              (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty,
              contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">8. Disclaimer</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis.
              The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability,
              fitness for a particular purpose, non-infringement, or course of performance.
            </p>
            <p>
              Anveshak does not warrant that (i) the Service will function uninterrupted, secure, or available at any particular time or location;
              (ii) any errors or defects will be corrected; (iii) the Service is free of viruses or other harmful components; or (iv) the results of using the Service will meet your requirements.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">9. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
            <p>
              If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">10. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice
              prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms,
              please stop using the Service.
            </p>
              <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-700">11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              Email: deepdblm@outlook.com<br />
              Address: AI Department, SVNIT, Surat, Gujarat, India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
