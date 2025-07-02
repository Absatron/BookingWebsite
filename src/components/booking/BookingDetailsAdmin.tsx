import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, DollarSign, User, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { config } from '@/lib/config';
import { parseCreatedAtDate } from '@/utils/dateUtils';

interface BookingDetailsData {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
  bookedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

const BookingDetailsAdmin = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${config.apiUrl}/api/bookings/${bookingId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in again.');
          }
          throw new Error('Failed to fetch booking details');
        }
        
        const bookingData = await response.json();
        setBooking(bookingData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading booking details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <Button onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Booking not found</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="booking-container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Panel
        </Button>
        <h1 className="text-2xl font-bold text-booking-primary">Booking Details</h1>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Booking Information</CardTitle>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Time Slot Details</h3>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-booking-primary" />
                  <div>
                    <div className="font-medium">Date</div>
                    <div className="text-gray-600">
                      {format(new Date(booking.date), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-booking-primary" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div className="text-gray-600">
                      {booking.startTime} - {booking.endTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-booking-primary" />
                  <div>
                    <div className="font-medium">Price</div>
                    <div className="text-gray-600">${booking.price.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              {booking.bookedBy && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Details</h3>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-booking-primary" />
                    <div>
                      <div className="font-medium">Name</div>
                      <div className="text-gray-600">{booking.bookedBy.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-booking-primary" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-gray-600">{booking.bookedBy.email}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Booking Metadata */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Booking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Booking ID:</span>
                  <span className="ml-2 text-gray-600">{booking._id}</span>
                </div>
                <div>
                  <span className="font-medium">Created At:</span>
                  <span className="ml-2 text-gray-600">
                    {format(parseCreatedAtDate(booking.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingDetailsAdmin;
