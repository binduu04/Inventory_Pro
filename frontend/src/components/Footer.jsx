import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-emerald-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-700">
          {/* Left Side - Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="tel:+919876543210" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors font-medium">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>+91 98765 43210</span>
            </a>
            <span className="text-emerald-200">|</span>
            <a href="mailto:support@quickmart.com" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors font-medium">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>support@quickmart.com</span>
            </a>
          </div>

          {/* Right Side - Address */}
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>123 Market Street, Bangalore 560001</span>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center text-xs text-gray-600 mt-3 pt-3 border-t border-emerald-200">
          © 2025 QuickMart. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;