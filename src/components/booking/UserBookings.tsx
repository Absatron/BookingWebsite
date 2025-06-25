import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { format, parseISO, compareAsc } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Loader2 } from 'lucide-react'; // Added Loader2
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Booking } from '@/types'; // Import the Booking type

const UserBookings = () => {
  const { getUserBookings } = useBooking();
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate(); // Add navigate hook
  const [userBookings, setUserBookings] = useState<Booking[]>([]); // Added state for bookings
  const [isLoading, setIsLoading] = useState<boolean>(true); // Added loading state
  const [error, setError] = useState<string | null>(null); // Added error state

  // useEffect to fetch bookings on mount and when user changes
  useEffect(() => {
    const fetchBookings = async () => {

      if (loading) return;

      if (!currentUser) {
        setIsLoading(false);
        setUserBookings([]); // Clear bookings if user logs out
        return;
      }

      setIsLoading(true);
      setError(null); // Reset error state
      try {
        // Call the async function from context
        const bookingsData = await getUserBookings();
        // Sort bookings by date and time (earliest first)
        const sortedBookings = bookingsData.sort((a, b) => {
          const dateTimeA = parseISO(a.slot.date + 'T' + a.slot.startTime);
          const dateTimeB = parseISO(b.slot.date + 'T' + b.slot.startTime);
          return compareAsc(dateTimeA, dateTimeB);
        });
        setUserBookings(sortedBookings);
      } catch (err) {
        console.error("Failed to fetch user bookings:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        setUserBookings([]); // Clear bookings on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser, loading, getUserBookings]); // Rerun effect if user or fetch function changes

  // Handle logged out state
  if (!currentUser) {
    return <div>Please log in to view your bookings</div>;
  }

  // Handle loading state
  if (loading || isLoading) {
    return (
      <div className="booking-container py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-booking-primary" />
          <span className="ml-2 text-gray-600">Loading your bookings...</span>
        </div>
      </div>
    );
  }

    if (!currentUser) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-booking-primary" />
          <span className="ml-2 text-gray-600">Redirecting to login...</span>
        </div>
      );
    }

  // Handle error state
  if (error) {
     return (
        <div className="booking-container py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center justify-center py-12">
               <Calendar className="h-12 w-12 text-red-300 mb-4" />
               <h3 className="text-xl font-medium text-red-700 mb-2">Error Loading Bookings</h3>
               <p className="text-red-600 text-center max-w-md">
                 Could not load your bookings. Please try again later. <br/>
                 <span className="text-sm">({error})</span>
               </p>
            </CardContent>
          </Card>
        </div>
     );
  }

  // Render bookings or empty state
  return (
    <div className="booking-container py-8">
      <h1 className="text-2xl font-bold text-booking-primary mb-8">My Bookings</h1>

      {userBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 text-center max-w-md">
              You haven't made any bookings yet. Browse available slots and schedule your first appointment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userBookings.map((booking) => (
            <Card 
              key={booking.id} 
              className="animate-fade-in cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => navigate(`/booking/${booking.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Booking #{booking.id.slice(-6)}</CardTitle>
                    <CardDescription>
                      Created on {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge
                    className={
                      booking.paymentStatus === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : booking.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {booking.paymentStatus === 'completed'
                      ? 'Confirmed'
                      : booking.paymentStatus === 'pending'
                      ? 'Pending'
                      : 'Failed'
                    }
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-booking-primary" />
                    <span>{format(parseISO(booking.slot.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-booking-primary" />
                    <span>{booking.slot.startTime} - {booking.slot.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-booking-primary" />
                    <span className="font-bold">${booking.slot.price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBookings;