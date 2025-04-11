
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';

const UserBookings = () => {
  const { getUserBookings } = useBooking();
  const { currentUser } = useAuth();
  
  const userBookings = getUserBookings();
  
  if (!currentUser) {
    return <div>Please log in to view your bookings</div>;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-booking-primary">My Bookings</h1>
      
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
            <Card key={booking.id} className="animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Booking #{booking.id.slice(-4)}</CardTitle>
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
