
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, CreditCard, DollarSign, CheckCircle } from 'lucide-react';

const PaymentForm = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookings, confirmPayment, isLoading, getSlotById } = useBooking();
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Find the booking by ID
  const booking = bookingId ? bookings.find(b => b.id === bookingId) : null;
  const timeSlot = booking ? getSlotById(booking.slotId) : null;
  
  useEffect(() => {
    if (!bookingId || !booking) {
      toast({
        title: "Error",
        description: "Booking not found",
        variant: "destructive",
      });
      navigate('/booking');
    }
  }, [bookingId, booking, navigate, toast]);
  
  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    let formattedValue = '';
    
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    
    setCardNumber(formattedValue.slice(0, 19)); // 16 digits + 3 spaces
  };
  
  // Format expiry date with slash
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 2) {
      setExpiryDate(value);
    } else {
      setExpiryDate(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      toast({
        title: "Invalid Card Number",
        description: "Please enter a valid 16-digit card number",
        variant: "destructive",
      });
      return;
    }
    
    if (expiryDate.length !== 5) {
      toast({
        title: "Invalid Expiry Date",
        description: "Please enter a valid expiry date (MM/YY)",
        variant: "destructive",
      });
      return;
    }
    
    if (cvv.length !== 3) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid 3-digit CVV",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    
    if (bookingId) {
      // Simulate payment processing
      setTimeout(async () => {
        const success = await confirmPayment(bookingId);
        if (success) {
          setIsSuccess(true);
          setTimeout(() => {
            navigate(`/confirmation/${bookingId}`);
          }, 2000);
        } else {
          toast({
            title: "Payment Failed",
            description: "There was an error processing your payment. Please try again.",
            variant: "destructive",
          });
          setProcessing(false);
        }
      }, 2000);
    }
  };
  
  if (!booking || !timeSlot) {
    return <div className="text-center py-12">Loading...</div>;
  }
  
  if (isSuccess) {
    return (
      <Card className="w-full animate-fade-in">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 mb-4">Your booking has been confirmed.</p>
          <p className="text-gray-500">Redirecting to confirmation page...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-2 animate-fade-in">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Complete your booking by providing payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Smith"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  disabled={processing}
                />
              </div>
              
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    required
                    disabled={processing}
                  />
                  <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryDateChange}
                    maxLength={5}
                    required
                    disabled={processing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                    required
                    disabled={processing}
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/booking')}
            disabled={processing}
          >
            Back
          </Button>
          <Button 
            className="bg-booking-primary hover:bg-opacity-90"
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing ? 'Processing...' : `Pay $${timeSlot.price.toFixed(2)}`}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-booking-primary" />
            <span>{format(parseISO(timeSlot.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-booking-primary" />
            <span>{timeSlot.startTime} - {timeSlot.endTime}</span>
          </div>
          <hr className="my-2" />
          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold">Total</span>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="font-bold text-lg">{timeSlot.price.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-4">
            <p>* This is a demo payment form. No actual payments will be processed.</p>
            <p>* Enter any card details for testing purposes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentForm;
