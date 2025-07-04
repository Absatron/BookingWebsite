import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, DollarSign, Loader2 } from 'lucide-react'; 
import { Booking as BookingType } from '@/types'; 
import mongoose from 'mongoose'; 
import { config } from '@/lib/config';

interface FetchedBooking extends Omit<BookingType, '_id' | 'bookedBy' | 'date' | 'isBooked' | 'paymentStatus'> {
  _id: string | mongoose.Types.ObjectId; 
  bookedBy?: string | mongoose.Types.ObjectId; 
  date: string;
  stripePriceId: string; 
  price: number; 
  startTime: string; 
  endTime: string; 
  status: 'available' | 'pending' | 'completed' | 'cancelled'; 
}


const PaymentForm = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const { toast } = useToast();

  // State for fetched booking details and loading status
  const [bookingDetails, setBookingDetails] = useState<FetchedBooking | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [processing, setProcessing] = useState(false); // For form submission state
  const proceedingToPayment = useRef(false); // Track if user is proceeding to payment

  // Check for cancellation query parameter
  const queryParams = new URLSearchParams(location.search);
  const cancelled = queryParams.get('cancelled');


  useEffect(() => {
    // Show toast if redirected back from cancellation
    if (cancelled === 'true') {
      toast({
        title: "Payment Cancelled",
        description: "Your booking was not completed. You can try again.",
        variant: "default",
      });

    }

    // Fetch details when component mounts or bookingId changes
    if (!bookingId) {
      toast({
        title: "Error",
        description: "No booking ID provided.",
        variant: "destructive",
      });
      navigate('/booking'); 
      return;
    }

    const fetchBookingDetails = async () => {
      setIsLoadingDetails(true);
      setProcessing(false); // Reset processing state on fetch
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${config.apiUrl}/api/bookings/${bookingId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch booking details.');
        }

        const fetchedBooking = data as FetchedBooking;

        // Check if the booking is still 'pending' before allowing payment
        if (fetchedBooking.status !== 'pending') {
            toast({
                title: "Booking Not Payable",
                description: `This booking is already ${fetchedBooking.status}. You cannot proceed with payment.`,
                variant: "destructive",
            });
            navigate('/my-bookings'); 
            return;
        }

        setBookingDetails(fetchedBooking);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Booking details not found or invalid.";
        console.error("Error fetching booking details:", error);
        toast({
          title: "Error Fetching Details",
          description: errorMsg,
          variant: "destructive",
        });
        navigate('/booking'); // Redirect on error
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchBookingDetails();

    // Add cleanup function for navigation away
    const handleBeforeUnload = () => {
      // Only cancel if not proceeding to payment
      if (bookingId && !proceedingToPayment.current) {
        const token = localStorage.getItem('authToken')
        fetch(`${config.apiUrl}/api/bookings/${bookingId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          keepalive: true
        }).catch(() => {}); // Silent fail for page unload
      }
    };

  // Handles page navigation or refresh
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Cleanup function - runs when component unmounts
  // Handles react navigation
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    
    // If component unmounts and we have a booking ID, try to cancel
    // Only cancel if not proceeding to payment
    if (bookingId && !proceedingToPayment.current) {
      const token = localStorage.getItem('authToken');
      fetch(`${config.apiUrl}/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        keepalive: true // Important: keeps request alive even if page is closing
      }).catch(error => {
        console.warn('Failed to cancel booking on unmount:', error);
      });
    }
  };


  }, [bookingId, navigate, toast, cancelled]); 


  // PAYEMENT PROCESSING - REDIRECT TO STRIPE
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     // Basic validation before allowing submission
     if (!bookingDetails || !bookingDetails.stripePriceId) {
       e.preventDefault(); // Prevent form submission
       toast({
         title: "Error",
         description: "Booking details are incomplete. Cannot proceed.",
         variant: "destructive",
       });
       return;
     }
    
    // Set flag to indicate user is proceeding to payment
    proceedingToPayment.current = true;
    setProcessing(true); // Set processing state to true
  };  // Handle cancellation button click
  const handleCancel = async () => {
      if (!bookingId) return;
      
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${config.apiUrl}/api/bookings/${bookingId}/cancel`, { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Handle specific error responses from backend
          throw new Error(data.message || `Server error: ${response.status}`);
        }
        
        // Success - show success toast with backend message and navigate
        toast({ 
          title: "Booking Cancelled", 
          description: data.message || "Your pending booking has been cancelled.",
          variant: "default"
        });
        
        navigate('/booking');
        
      } catch (error) {
        console.error("Failed to cancel booking:", error);
        const errorMsg = error instanceof Error ? error.message : "Could not cancel booking.";
        toast({ 
          title: "Error", 
          description: errorMsg, 
          variant: "destructive" 
        });
        // Don't navigate on error - let user try again or handle manually
      }
  };

  // Show loading state while fetching booking details
  if (isLoadingDetails) {
    return (
        <div className="booking-container py-8">
          <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-booking-primary" />
              <span className="ml-2">Loading Booking Details...</span>
          </div>
        </div>
    );
  }

  if (!bookingDetails) {
    // Error toast and navigation are handled in useEffect, this is a fallback
    return (
      <div className="booking-container py-8">
        <div className="text-center py-12 text-red-500">Could not load booking details. Please try again or select a different slot.</div>
      </div>
    );
  }

  // Destructure booking details for easier access
  const { date, startTime, endTime, price, stripePriceId } = bookingDetails;

  return (
    <div className="booking-container py-8">
      <h1 className="text-2xl font-bold text-booking-primary mb-8">Payment</h1>
      
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
      <form
        action={`${config.apiUrl}/api/payment/create-checkout-session`}
        method="POST"
        onSubmit={handleFormSubmit} // Use the handler to set processing state
        className="lg:col-span-2"
      >
        {/* Pass necessary data to the backend in correct format */}
        <input type="hidden" name="bookingId" value={bookingId} />
        {stripePriceId && <input type="hidden" name="stripePriceId" value={stripePriceId} />}
         <input type="hidden" name="bookingPrice" value={price.toString()} />


        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Proceed to Payment</CardTitle>
            <CardDescription>Review your booking details and proceed to Stripe for secure payment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <p>Click the button below to proceed to our secure payment gateway powered by Stripe.</p>
              <p>You are booking the time slot for:</p>
              <ul className="list-disc pl-5 space-y-1">
                 {/* Parse the date string from backend */}
                <li>Date: {format(parseISO(date), 'EEEE, MMMM d, yyyy')}</li>
                <li>Time: {startTime} - {endTime}</li>
                <li>Price: ${price.toFixed(2)}</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button" // Important: type="button" prevents form submission
              onClick={handleCancel}
              disabled={processing} 
            >
              Cancel Booking
            </Button>
            <Button
              type="submit" // This button submits the form
              className="bg-booking-primary hover:bg-opacity-90 min-w-[180px]" 
              // Disable if processing, loading, or essential data is missing
              disabled={processing || isLoadingDetails || !stripePriceId}
            >
              {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
               ) : (
                 `Proceed to Pay $${price.toFixed(2)}`
               )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Booking Summary Card - uses fetched details */}
      <Card className="animate-fade-in lg:col-span-1">
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-booking-primary" />
            {/* Parse the date string from backend */}
            <span>{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-booking-primary" />
            <span>{startTime} - {endTime}</span>
          </div>
          <hr className="my-2" />
          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold">Total</span>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="font-bold text-lg">{price.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-4">
             <p>* You will be redirected to Stripe's secure checkout page.</p>
             <p>* Your booking is reserved for a limited time pending payment.</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default PaymentForm;
