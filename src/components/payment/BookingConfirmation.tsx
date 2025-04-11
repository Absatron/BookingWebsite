
import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, DollarSign, CheckCircle, Download } from 'lucide-react';

const BookingConfirmation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookings, getSlotById } = useBooking();
  
  // Find the booking by ID
  const booking = bookingId ? bookings.find(b => b.id === bookingId) : null;
  const timeSlot = booking ? getSlotById(booking.slotId) : null;
  
  useEffect(() => {
    if (!bookingId || !booking || booking.paymentStatus !== 'completed') {
      toast({
        title: "Error",
        description: "Booking confirmation not found",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [bookingId, booking, navigate, toast]);
  
  if (!booking || !timeSlot) {
    return <div className="text-center py-12">Loading...</div>;
  }
  
  // Generate a booking reference number
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
                <div className="font-medium">{format(parseISO(timeSlot.date), 'EEEE, MMMM d, yyyy')}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-booking-accent rounded-full p-2">
                <Clock className="h-5 w-5 text-booking-primary" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Time</div>
                <div className="font-medium">{timeSlot.startTime} - {timeSlot.endTime}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-booking-accent rounded-full p-2">
                <DollarSign className="h-5 w-5 text-booking-primary" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Amount Paid</div>
                <div className="font-medium">${timeSlot.price.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium">We've sent a confirmation email with these details.</p>
            <p>Please keep this reference number for your records.</p>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-booking-primary text-booking-primary"
          >
            <Download className="h-4 w-4" />
            <span>Download Receipt</span>
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
