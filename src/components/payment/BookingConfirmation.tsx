import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'; // Import useLocation
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, DollarSign, CheckCircle, Download, Loader2 } from 'lucide-react'; // Added Loader2
import { Booking as BookingType } from '@/types'; // Assuming Booking type is defined
import { config } from '@/lib/config';

// Define a type for the fetched booking details, ensure it includes status
interface ConfirmedBooking extends Omit<BookingType, '_id' | 'date' | 'isBooked' | 'paymentStatus'> {
  _id: string;
  date: string; // Expecting ISO string
  startTime: string;
  endTime: string;
  price: number;
  status: 'available' | 'pending' | 'confirmed'; // Add status field
  // Add other fields returned by your backend /api/bookings/:bookingId endpoint
}


const BookingConfirmation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const { toast } = useToast();

  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Extract session_id from query params (optional, for potential verification)
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');


  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID provided.");
      setIsLoading(false);
      navigate('/dashboard'); // Or appropriate error page/redirect
      return;
    }

    // Function to get response from backend and check booking status
    const getBookingDetails = async (id: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${config.apiUrl}/api/bookings/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch booking details.');
      }
      return response.json();
    };

    const fetchBookingStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch booking details directly from the backend
        const data = await getBookingDetails(bookingId);
        const fetchedBooking = data as ConfirmedBooking;

        if (fetchedBooking.status !== 'confirmed') {
           // Optional: Add a small delay and retry fetch in case webhook is slightly delayed
           //await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
           // const retryResponse = await fetch(...); // Retry fetch
           // ... handle retry response ...
           // If still not completed after retry:
           console.warn(`Booking ${bookingId} status is ${fetchedBooking.status}, expected 'completed'. Payment might be processing.`);
           toast({
             title: "Payment Processing",
             description: "Your payment might still be processing. Please check 'My Bookings' shortly or contact support if this persists.",
             variant: "default", // Use default or warning variant
           });
           // Navigate to a pending page or dashboard instead of showing confirmation
           navigate('/my-bookings'); // Redirect to user's bookings page
           return; // Stop further processing
        }

        setConfirmedBooking(fetchedBooking);

      } catch (err) {
        console.error("Error fetching booking confirmation:", err);
        const errorMsg = err instanceof Error ? err.message : "Could not load booking confirmation.";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
         navigate('/dashboard'); // Redirect on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingStatus();

  }, [bookingId, navigate, toast, sessionId]); // Added sessionId to dependencies (optional)

  // Handle receipt download
  const handleDownloadReceipt = async () => {
    if (!bookingId) return;
    
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${config.apiUrl}/api/bookings/${bookingId}/receipt`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download receipt');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-BK-${bookingId?.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Receipt downloaded successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download receipt.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-booking-primary" />
        <span className="ml-2">Loading Confirmation...</span>
      </div>
    );
  }

  // Error State
  if (error || !confirmedBooking) {
    return (
       <div className="max-w-2xl mx-auto text-center py-12">
         <Card>
           <CardHeader>
             <CardTitle className="text-red-600">Confirmation Error</CardTitle>
           </CardHeader>
           <CardContent>
             <p>{error || "Booking details could not be loaded."}</p>
             <Button asChild variant="link" className="mt-4">
               <Link to="/dashboard">Go to Dashboard</Link>
             </Button>
           </CardContent>
         </Card>
       </div>
     );
  }

  // Success State - Use confirmedBooking details
  const { date, startTime, endTime, price } = confirmedBooking;
  const bookingReference = `BK-${bookingId?.slice(-6).toUpperCase()}`;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="animate-fade-in">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600 mb-2">Booking Confirmed!</CardTitle>
          <CardDescription className="text-base">
            Your booking has been successfully confirmed. Thank you for your reservation.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="font-semibold text-gray-700 mb-2">Booking Reference</h3>
            <p className="text-xl font-bold text-booking-primary">{bookingReference}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Appointment Details</h3>

            <div className="flex items-center gap-3">
              <div className="bg-booking-accent rounded-full p-2">
                <Calendar className="h-5 w-5 text-booking-primary" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Date</div>
                {/* Use fetched data */}
                <div className="font-medium">{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-booking-accent rounded-full p-2">
                <Clock className="h-5 w-5 text-booking-primary" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Time</div>
                 {/* Use fetched data */}
                <div className="font-medium">{startTime} - {endTime}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-booking-accent rounded-full p-2">
                <DollarSign className="h-5 w-5 text-booking-primary" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Amount Paid</div>
                 {/* Use fetched data */}
                <div className="font-medium">${price.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            {/* Updated message */}
            <p className="font-medium">📧 A confirmation email will be sent to your registered email address </p>
            <p>Please keep this reference number for your records: <strong>{bookingReference}</strong></p>
          </div>
        </CardContent>

        <CardFooter className="pt-2 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-booking-primary text-booking-primary"
            onClick={handleDownloadReceipt} // Attach handler
            disabled={isDownloading} // Disable while downloading
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Receipt</span>
              </>
            )}
          </Button>
          <Link to="/my-bookings">
            <Button className="bg-booking-primary hover:bg-opacity-90 w-full sm:w-auto">
              View My Bookings
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BookingConfirmation;
