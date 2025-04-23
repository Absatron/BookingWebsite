import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Remove unused Input and Label imports if card details are removed
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
// Remove CreditCard if input is removed
// import { Calendar, Clock, CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import { Calendar, Clock, DollarSign } from 'lucide-react'; // Removed CheckCircle and CreditCard

const PaymentForm = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Remove confirmPayment if not used directly here anymore
  const { bookings, isLoading, getSlotById } = useBooking();

  // Remove state related to card details and success/processing simulation
  // const [cardNumber, setCardNumber] = useState('');
  // const [cardName, setCardName] = useState('');
  // const [expiryDate, setExpiryDate] = useState('');
  // const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false); // Keep processing to disable button during form submission
  // const [isSuccess, setIsSuccess] = useState(false);

  // Find the booking by ID
  const booking = bookingId ? bookings.find(b => b.id === bookingId) : null;
  const timeSlot = booking ? getSlotById(booking.slotId) : null;

  useEffect(() => {
    // Keep this effect for initial booking validation
    if (!isLoading && (!bookingId || !booking || !timeSlot)) {
      toast({
        title: "Error",
        description: "Booking details not found or invalid.",
        variant: "destructive",
      });
      navigate('/booking');
    }
  }, [bookingId, booking, timeSlot, navigate, toast, isLoading]);

  // Remove card detail formatting handlers
  // const handleCardNumberChange = ...
  // const handleExpiryDateChange = ...

  // Remove the simulation handleSubmit function
  // const handleSubmit = async (e: React.FormEvent) => { ... };

  // Handle form submission start
  const handleFormSubmit = () => {
    setProcessing(true);
    // The actual submission is handled by the form's action attribute
    // You might want additional client-side checks here before allowing submission
  };


  if (isLoading || !booking || !timeSlot) {
    return <div className="text-center py-12">Loading...</div>;
  }

  // Remove the isSuccess block, Stripe handles redirection
  // if (isSuccess) { ... }

  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
      {/* Update form to POST directly to the backend endpoint */}
      <form
        action="http://localhost:3000/api/payment/create-checkout-session" // Adjust if your API route is different
        method="POST"
        onSubmit={handleFormSubmit} // Corrected: Use handleFormSubmit
        className="lg:col-span-2" // Apply grid span to the form itself
      >
        {/* Add hidden inputs if you need to pass data like bookingId or priceId */}
        {/* Example: <input type="hidden" name="bookingId" value={bookingId} /> */}
        {/* Example: <input type="hidden" name="priceId" value={timeSlot.stripePriceId} /> */}
        {/* Ensure your backend reads these values if needed */}

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Proceed to Payment</CardTitle>
            <CardDescription>You will be redirected to Stripe to complete your payment securely.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Remove card input fields */}
            <div className="space-y-4 text-sm text-gray-600">
              <p>Click the button below to proceed to our secure payment gateway powered by Stripe.</p>
              <p>You are booking the time slot for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Date: {format(parseISO(timeSlot.date), 'EEEE, MMMM d, yyyy')}</li>
                <li>Time: {timeSlot.startTime} - {timeSlot.endTime}</li>
                <li>Price: ${timeSlot.price.toFixed(2)}</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button" // Change type to button to prevent form submission
              onClick={() => navigate('/booking')}
              disabled={processing}
            >
              Back
            </Button>
            <Button
              type="submit" // Change type to submit
              className="bg-booking-primary hover:bg-opacity-90"
              disabled={processing || !booking || !timeSlot} // Disable if loading or no slot
            >
              {processing ? 'Redirecting...' : `Proceed to Pay $${timeSlot.price.toFixed(2)}`}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Booking Summary Card remains mostly the same */}
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
             <p>* You will be redirected to Stripe's secure checkout page.</p>
          </div>
        </CardContent>
      </Card> {/* Corrected: Added closing tag for Card */}
    </div> // Corrected: Added closing tag for div
  );
};

export default PaymentForm;
