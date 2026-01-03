import React, { useState } from 'react';
import { Mail, ArrowRight, Briefcase, Key, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { sendPasswordReset } from '../services/authService';

interface ForgotPasswordProps {
  initialEmail: string;
  onNavigateToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ initialEmail, onNavigateToLogin }) => {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
          setError("No user found with this email address.");
      } else if (err.code === 'auth/invalid-email') {
          setError("Please enter a valid email address.");
      } else {
          setError("Failed to send reset link. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-8">
        
        <div className="flex justify-center mb-6">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isSubmitted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {isSubmitted ? <CheckCircle size={32} /> : <Key size={32} />}
            </div>
        </div>

        {isSubmitted ? (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    We sent you a password change link to<br/>
                    <span className="font-semibold text-slate-800">{email}</span>.
                </p>
                <button
                    onClick={onNavigateToLogin}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-indigo-200"
                >
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                </button>
                <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 text-sm text-slate-500 hover:text-indigo-600 font-medium"
                >
                    Resend link?
                </button>
            </div>
        ) : (
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Forgot password?</h2>
                <p className="text-slate-600 mb-6 text-center text-sm">
                    No worries! Enter your email and we'll send you reset instructions.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-slate-900 bg-white"
                            placeholder="name@ravechi.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                    >
                        {isLoading ? (
                            <span>Sending...</span>
                        ) : (
                            <span>Get Reset Link</span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={onNavigateToLogin}
                        className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center justify-center gap-1 mx-auto"
                    >
                        <ArrowLeft size={16} /> Back to Login
                    </button>
                </div>
            </div>
        )}

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

export default ForgotPassword;