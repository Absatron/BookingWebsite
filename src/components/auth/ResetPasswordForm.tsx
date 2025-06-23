import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff } from 'lucide-react';

export const ResetPasswordForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Verify token on component mount
      fetch(`/api/user/verify-reset-token/${token}`)
        .then(res => res.json())
        .then(data => {
          setTokenValid(data.valid);
          if (!data.valid) {
            setMessage(data.message || 'Invalid or expired reset token');
          }
        })
        .catch(() => {
          setTokenValid(false);
          setMessage('Failed to verify reset token');
        });
    } else {
      setTokenValid(false);
      setMessage('No reset token provided');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(data.message);
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthInfo = () => {
    return (
      <div className="text-sm text-gray-600 mt-2">
        Password must contain:
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>At least 8 characters</li>
          <li>At least one uppercase letter</li>
          <li>At least one lowercase letter</li>
          <li>At least one number</li>
          <li>At least one special character (@$!%*?&)</li>
        </ul>
      </div>
    );
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Verifying reset token...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Invalid Token</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {message || 'This password reset link is invalid or has expired.'}
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate('/forgot-password')} variant="outline">
                Request New Reset Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            Reset Password
          </CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <AlertDescription className={isSuccess ? 'text-green-800' : 'text-red-800'}>
                {message}
                {isSuccess && (
                  <div className="mt-2 text-sm">
                    Redirecting to login page in 3 seconds...
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {getPasswordStrengthInfo()}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
