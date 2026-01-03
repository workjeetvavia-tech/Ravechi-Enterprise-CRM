import React from 'react';
import { Mail, ArrowRight, Briefcase } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onNavigateToLogin: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onNavigateToLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-center p-8">
        
        <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <Mail size={32} />
            </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify your email</h2>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          We have sent you a verification email to <br/>
          <span className="font-semibold text-slate-800">{email}</span>.
          <br/><br/>
          Please verify it and log in to access your account.
        </p>

        <button
          onClick={onNavigateToLogin}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-indigo-200"
        >
          <span>Back to Login</span>
          <ArrowRight size={18} />
        </button>

        <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-center gap-2 text-slate-400">
                <Briefcase size={16} />
                <span className="text-xs font-semibold tracking-wider uppercase">Ravechi Enterprises Pvt. Ltd</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;