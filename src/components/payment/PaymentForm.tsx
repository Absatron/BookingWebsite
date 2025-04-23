import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Removed unused context import
// import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { Booking as BookingType } from '@/types'; // Assuming Booking type is defined in types/index.ts
import mongoose from 'mongoose'; // Import mongoose to use its types if needed, or define ObjectId type

// Define a more specific type if BookingType uses string for _id
interface FetchedBooking extends Omit<BookingType, '_id' | 'bookedBy' | 'date'> {
  _id: string | mongoose.Types.ObjectId; // Or just string if always converted
  bookedBy?: string | mongoose.Types.ObjectId; // Optional if not always populated
  date: string; // Expecting ISO string from backend
  stripePriceId: string; // Ensure this is part of your BookingType or add it
  price: number; // Ensure price is included
  startTime: string; // Ensure startTime is included
  endTime: string; // Ensure endTime is included
}


const PaymentForm = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Removed context usage for booking/slot data
  // const { bookings, isLoading, getSlotById } = useBooking();

  // State for fetched booking details and loading status
  const [bookingDetails, setBookingDetails] = useState<FetchedBooking | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Removed state related to card details
  // ...

  // Removed context-based booking/slot finding
  // const booking = bookingId ? bookings.find(b => b.id === bookingId) : null;
  // const timeSlot = booking ? getSlotById(booking.slotId) : null;

  useEffect(() => {
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
      try {
        // Make sure credentials are included if your backend route needs the session
        const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
           credentials: 'include',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch booking details.');
        }
         // Ensure the fetched data matches the FetchedBooking structure
        setBookingDetails(data as FetchedBooking);
      } catch (error) { // Catch specific error type
        console.error("Error fetching booking details:", error);
        toast({
          title: "Error Fetching Details",
          description: error.message || "Booking details not found or invalid.",
          variant: "destructive",
        });
        navigate('/booking');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchBookingDetails();
    // Removed context dependencies from the dependency array
  }, [bookingId, navigate, toast]);

  // Removed card detail formatting handlers
  // ...

  // Removed simulation handleSubmit
  // ...

  // Handle form submission start
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
    setProcessing(true);
    // Form action handles the rest
  };


  // Updated loading condition
  if (isLoadingDetails) {
    return <div className="text-center py-12">Loading Booking Details...</div>;
  }

  // Updated condition for missing details after loading
  if (!bookingDetails) {
    // Error toast and navigation are handled in useEffect, this is a fallback
    return <div className="text-center py-12 text-red-500">Could not load booking details. Please try again.</div>;
  }

  // Destructure AFTER checking !bookingDetails
  const { date, startTime, endTime, price, stripePriceId } = bookingDetails;

  // Removed isSuccess block
  // ...

  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
      <form
        action="http://localhost:3000/api/payment/create-checkout-session"
        method="POST"
        onSubmit={handleFormSubmit} // Use the handler
        className="lg:col-span-2"
      >
        {/* Pass necessary data to the backend */}
        {/* Ensure bookingId is the string version */}
        <input type="hidden" name="bookingId" value={bookingId} />
        {/* Ensure stripePriceId exists before rendering */}
        {stripePriceId && <input type="hidden" name="stripePriceId" value={stripePriceId} />}
        {/* Pass price for potential backend verification */}
         <input type="hidden" name="bookingPrice" value={price} />


        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Proceed to Payment</CardTitle>
            <CardDescription>You will be redirected to Stripe to complete your payment securely.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Removed card input fields */}
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
              onClick={() => navigate('/booking')}
              disabled={processing}
            >
              Back
            </Button>
            <Button
              type="submit" // This button submits the form
              className="bg-booking-primary hover:bg-opacity-90"
              // Disable if processing, loading, or essential data is missing
              disabled={processing || isLoadingDetails || !stripePriceId}
            >
              {processing ? 'Redirecting...' : `Proceed to Pay $${price.toFixed(2)}`}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Booking Summary Card - uses fetched details */}
      <Card className="animate-fade-in">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentForm;
