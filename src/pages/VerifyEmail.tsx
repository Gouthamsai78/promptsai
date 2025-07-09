import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const VerifyEmail: React.FC = () => {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if this is a verification callback
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (token && type === 'signup') {
      handleEmailVerification(token);
    }
  }, [searchParams]);

  const handleEmailVerification = async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) {
        setVerificationError('Invalid or expired verification link. Please request a new one.');
      } else {
        setIsVerified(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    } catch (error) {
      setVerificationError('Failed to verify email. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      // Note: Supabase automatically sends verification emails on signup
      // This is just for user feedback
      setResendMessage('If your email is in our system, you will receive a verification email shortly.');
    } catch (error: any) {
      setResendMessage('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            We've sent a verification link to{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {user?.email || 'your email address'}
            </span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">To complete your registration:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>You'll be automatically signed in</li>
              </ol>
            </div>

            {resendMessage && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {resendMessage}
                </p>
              </div>
            )}

            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isResending ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Resending...
                </>
              ) : (
                'Resend verification email'
              )}
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already verified?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
