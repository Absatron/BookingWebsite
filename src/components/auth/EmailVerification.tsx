import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const EmailVerification: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token found');
            return;
        }

        verifyEmail(token);
    }, [token]);

    const verifyEmail = async (verificationToken: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/user/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: verificationToken }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message);
                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.message);
                if (data.email) {
                    setEmail(data.email);
                }
            }
        } catch (error) {
            setStatus('error');
            setMessage('Failed to verify email. Please try again.');
        }
    };

    const resendVerificationEmail = async () => {
        if (!email) return;

        try {
            const response = await fetch('http://localhost:3000/api/user/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Verification email sent! Please check your inbox.');
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage('Failed to resend verification email. Please try again.');
        }
    };

    return (
        <div className="container mx-auto max-w-md mt-8">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle>Email Verification</CardTitle>
                    <CardDescription>
                        {status === 'loading' && 'Verifying your email address...'}
                        {status === 'success' && 'Your email has been verified!'}
                        {status === 'error' && 'Email verification failed'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'loading' && (
                        <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                            <Alert>
                                <AlertDescription>
                                    {message}
                                    <br />
                                    <span className="text-sm text-gray-500">
                                        Redirecting to dashboard in 3 seconds...
                                    </span>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {message}
                                </AlertDescription>
                            </Alert>
                            
                            {email && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Didn't receive the email? We can send you a new one.
                                    </p>
                                    <Button 
                                        onClick={resendVerificationEmail}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Resend Verification Email
                                    </Button>
                                </div>
                            )}
                            
                            <Button 
                                onClick={() => navigate('/login')}
                                className="w-full mt-4"
                            >
                                Back to Login
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EmailVerification;
