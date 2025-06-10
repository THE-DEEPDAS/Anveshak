import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <FaEnvelope className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-lg">Anveshak</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Helping students land their dream tech internships
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row md:space-x-8 text-center md:text-left">
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold mb-2 text-white">Links</h3>
              <ul className="space-y-1 text-sm">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/about-us" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/contact-us" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold mb-2 text-white">Legal</h3>
              <ul className="space-y-1 text-sm">
                <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="text-gray-400 hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-white">Connect</h3>
              <div className="flex space-x-4 justify-center md:justify-start">
                <a href="https://github.com/THE-DEEPDAS" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <FaGithub className="h-5 w-5" />
                </a>
                <a href="https://www.linkedin.com/in/deep-das-4b5aa527b/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <FaLinkedin className="h-5 w-5" />
                </a>
                <a href="mailto:deepdblm@outlook.com" className="text-gray-400 hover:text-white transition-colors">
                  <FaEnvelope className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Anveshak. All rights reserved with Deep Das.</p>
          <p className="mt-1">Built with React, Node.js, MongoDB, and Gemini AI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;