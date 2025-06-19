import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResendVerificationProps {
    initialEmail?: string;
}

const ResendVerification: React.FC<ResendVerificationProps> = ({ initialEmail = '' }) => {
    const [email, setEmail] = useState(initialEmail || localStorage.getItem('unverifiedEmail') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // Clear stored email on component mount
    React.useEffect(() => {
        return () => {
            localStorage.removeItem('unverifiedEmail');
        };
    }, []);

    const handleResendVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            setMessage('Please enter your email address');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('');

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
                setMessage(data.message);
                setMessageType('success');
            } else {
                setMessage(data.message);
                setMessageType('error');
            }
        } catch (error) {
            setMessage('Failed to send verification email. Please try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-md mt-8">
            <Card>
                <CardHeader className="text-center">
                    <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <CardTitle>Resend Verification Email</CardTitle>
                    <CardDescription>
                        Enter your email address to receive a new verification link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleResendVerification} className="space-y-4">
                        <div>
                            <Input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {message && (
                            <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
                                <AlertDescription>
                                    {message}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Verification Email'}
                        </Button>

                        <div className="text-center">
                            <Link 
                                to="/login" 
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResendVerification;
