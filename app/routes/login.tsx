import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card/card';
import { Input } from '../components/ui/input/input';
import { Label } from '../components/ui/label/label';
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { CyberLogo } from '../components/ui/cyber-logo';
import { Alert } from '../components/ui/alert/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { useAuth } from '../hooks/use-auth';
import styles from './login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      console.log('🔐 Login attempt started...');
      console.log('📧 Email:', loginData.email);
      
      // Handle demo credentials locally without hitting Supabase
      if (loginData.email === 'demo@cybershield.com' && loginData.password === 'demopassword123') {
        console.log('🎯 Demo user detected - using local auth');
        const demoUser = {
          id: 'demo-user-123',
          username: 'demo',
          email: 'demo@cybershield.com',
          role: 'user',
          subscription: 'professional',
          mfaEnabled: false,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(demoUser));
        
        setSuccess('Demo login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        return;
      }
      
      if (loginData.email === 'admin@cybershield.com' && loginData.password === 'adminpassword123') {
        console.log('🎯 Demo admin detected - using local auth');
        const adminUser = {
          id: 'admin-user-456',
          username: 'admin',
          email: 'admin@cybershield.com',
          role: 'admin',
          subscription: 'enterprise',
          mfaEnabled: false,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        
        setSuccess('Demo admin login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        return;
      }
      
      // Validate inputs
      if (!loginData.email || !loginData.password) {
        throw new Error('Please fill in all fields');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginData.email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('🔐 Attempting Supabase login...');
      // Use Supabase authentication
      await signIn(loginData.email, loginData.password);
      
      console.log('✅ Login successful!');
      setSuccess('Login successful! Redirecting...');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!signupData.username || !signupData.email || !signupData.password || !signupData.confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      // Username validation
      if (signupData.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signupData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Password validation
      if (signupData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (signupData.password !== signupData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      console.log('🔐 Attempting Supabase signup...');
      // Use Supabase authentication
      await signUp(signupData.username, signupData.email, signupData.password);
      
      console.log('✅ Signup successful!');
      setSuccess('Account created successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      console.error('❌ Signup error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <CyberLogo size="xl" />
          </div>
          <h1 className={styles.title}>CYBERSHIELD</h1>
          <p className={styles.subtitle}>Autonomous Cybersecurity Platform</p>
        </div>

        <Tabs defaultValue="login" className={styles.tabs}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="login" className={styles.tabsTrigger}>
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className={styles.tabsTrigger}>
              Create Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className={styles.card}>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in with your Supabase account or use demo credentials
                </CardDescription>
              </CardHeader>

              {/* Demo Credentials */}
              <div className={styles.demoAccounts}>
                <div className={styles.demoHeader}>
                  <Shield size={16} />
                  <span>Demo Credentials</span>
                </div>
                <div className={styles.demoGrid}>
                  <button
                    type="button"
                    className={styles.demoAccount}
                    onClick={() => {
                      setLoginData({ email: 'demo@cybershield.com', password: 'demopassword123' });
                    }}
                  >
                    <div className={styles.demoRole}>Demo User</div>
                    <div className={styles.demoEmail}>demo@cybershield.com</div>
                  </button>
                  <button
                    type="button"
                    className={styles.demoAccount}
                    onClick={() => {
                      setLoginData({ email: 'admin@cybershield.com', password: 'adminpassword123' });
                    }}
                  >
                    <div className={styles.demoRole}>Demo Admin</div>
                    <div className={styles.demoEmail}>admin@cybershield.com</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin}>
                <CardContent>
                  <div className={styles.form}>
                    {error && (
                      <Alert variant="destructive" className={styles.alert}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                      </Alert>
                    )}
                    {success && (
                      <Alert className={styles.successAlert}>
                        <CheckCircle size={16} />
                        <span>{success}</span>
                      </Alert>
                    )}

                    <div className={styles.field}>
                      <Label htmlFor="login-email">Email Address</Label>
                      <div className={styles.inputWrapper}>
                        <Mail className={styles.inputIcon} size={18} />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className={styles.inputWithIcon}
                          disabled={isLoading}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <Label htmlFor="login-password">Password</Label>
                      <div className={styles.inputWrapper}>
                        <Lock className={styles.inputIcon} size={18} />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className={styles.inputWithIcon}
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className={styles.togglePassword}
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.formFooter}>
                      <label className={styles.checkbox}>
                        <input type="checkbox" />
                        <span>Remember me</span>
                      </label>
                      <button type="button" className={styles.linkButton}>
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className={styles.submitBtn} 
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className={styles.card}>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join CyberShield and start protecting your digital assets
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent>
                  <div className={styles.form}>
                    {error && (
                      <Alert variant="destructive" className={styles.alert}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                      </Alert>
                    )}
                    {success && (
                      <Alert className={styles.successAlert}>
                        <CheckCircle size={16} />
                        <span>{success}</span>
                      </Alert>
                    )}

                    <div className={styles.field}>
                      <Label htmlFor="signup-username">Username</Label>
                      <div className={styles.inputWrapper}>
                        <User className={styles.inputIcon} size={18} />
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="Choose a username"
                          value={signupData.username}
                          onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                          className={styles.inputWithIcon}
                          disabled={isLoading}
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <Label htmlFor="signup-email">Email Address</Label>
                      <div className={styles.inputWrapper}>
                        <Mail className={styles.inputIcon} size={18} />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className={styles.inputWithIcon}
                          disabled={isLoading}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <Label htmlFor="signup-password">Password</Label>
                      <div className={styles.inputWrapper}>
                        <Lock className={styles.inputIcon} size={18} />
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className={styles.inputWithIcon}
                          disabled={isLoading}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className={styles.togglePassword}
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className={styles.hint}>Minimum 8 characters</p>
                    </div>

                    <div className={styles.field}>
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <div className={styles.inputWrapper}>
                        <Lock className={styles.inputIcon} size={18} />
                        <Input
                          id="signup-confirm"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Re-enter your password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          className={styles.inputWithIcon}
                          disabled={isLoading}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div className={styles.terms}>
                      <label className={styles.checkbox}>
                        <input type="checkbox" required />
                        <span>
                          I agree to the <button type="button" className={styles.linkButton}>Terms of Service</button> and{' '}
                          <button type="button" className={styles.linkButton}>Privacy Policy</button>
                        </span>
                      </label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className={styles.submitBtn} 
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className={styles.footer}>
          <p>© 2024 CYBERSHIELD. Autonomous Cybersecurity Platform.</p>
        </div>
      </div>
    </div>
  );
}
