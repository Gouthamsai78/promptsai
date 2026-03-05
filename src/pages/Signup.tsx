import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Check, X, Sparkles, ArrowRight } from 'lucide-react';
import SEOHead from '../components/SEOHead';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const { signUpWithEmail, signInWithGoogle, isUsernameAvailable } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'username') {
      setUsernameAvailable(null);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    setCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(username);
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is not available');
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(
        formData.email,
        formData.password,
        formData.username,
        formData.fullName
      );
      navigate('/auth/verify-email');
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Google');
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.username &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 6 &&
      usernameAvailable === true
    );
  };

  return (
    <>
      <SEOHead
        title="Create Account | PromptShare AI"
        description="Join PromptShare AI to discover, share, and enhance AI prompts for Nano Banana, Gemini, ChatGPT, and more."
        keywords={['signup', 'create account', 'PromptShare', 'AI prompts', 'join']}
      />
      <div className="min-h-screen flex">
        {/* Left Panel - Decorative */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
              <Sparkles size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center">Join the Community</h1>
            <p className="text-lg text-gray-300 text-center max-w-md leading-relaxed">
              Create, share, and discover powerful AI prompts. Collaborate with creators worldwide.
            </p>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-gray-400">Prompts</div>
              </div>
              <div>
                <div className="text-3xl font-bold">5K+</div>
                <div className="text-sm text-gray-400">Creators</div>
              </div>
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-gray-400">AI Tools</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="w-full max-w-md py-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles size={28} className="text-white" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create Account
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/auth/login"
                  className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Google Button */}
              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    or create with email
                  </span>
                </div>
              </div>

              {/* Email Form */}
              <form className="space-y-4" onSubmit={handleEmailSignup}>
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm font-medium">@</span>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="username"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      {checkingUsername && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      )}
                      {!checkingUsername && usernameAvailable === true && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  {usernameAvailable === false && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                      Username is not available
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/25"
                >
                  {loading ? (
                    <span>Creating account...</span>
                  ) : (
                    <>
                      <span>Create account</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
