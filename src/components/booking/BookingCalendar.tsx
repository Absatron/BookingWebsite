import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import { Clock, DollarSign } from 'lucide-react';
import { TimeSlot } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const BookingCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { timeSlots, selectSlot, selectedSlot, createBooking, isLoading } = useBooking();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get available dates that have slots
  const availableDates = [...new Set(timeSlots
    .filter(slot => !slot.isBooked)
    .map(slot => slot.date)
  )];

  // Filter slots for the selected date that aren't booked
  const availableSlots = selectedDate
    ? timeSlots.filter(
        slot => 
          slot.date === format(selectedDate, 'yyyy-MM-dd') && 
          !slot.isBooked
      )
    : [];

  // Check if a date has available slots
  const hasAvailableSlot = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateString);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    selectSlot(slot);
  };

  const handleBookNow = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please login to book an appointment",
        variant: "destructive",
      });
      navigate('/login', { state: { from: '/booking' } });
      return;
    }

    if (!selectedSlot) {
      toast({
        title: "Selection Required",
        description: "Please select a time slot first",
        variant: "destructive",
      });
      return;
    }

    // Call the updated createBooking which now initiates the booking on the backend
    // calls route /api/bookings/initiate
    const bookingResult = await createBooking(selectedSlot.id);

    if (!currentUser) {
      // Session expired during booking attempt
      navigate('/login', { state: { from: '/booking' } });
      return;
    }
    
    // Check if the initiation was successful and we received the bookingId
    if (bookingResult && bookingResult.bookingId) {
      // Navigate to the payment page, passing the bookingId
      // The stripePriceId is also available in bookingResult.stripePriceId if needed on the payment page
      navigate(`/payment/${bookingResult.bookingId}`); 
    } else {
      // Error handling is done within createBooking (toast messages)
      // Optionally add more specific UI feedback here if needed
      console.error("Booking initiation failed or bookingId not received.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Select a Date</CardTitle>
          <CardDescription>Choose from available dates</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => {
              return (
                date < new Date() || // Past dates
                !hasAvailableSlot(date) // Dates without available slots
              );
            }}
            className="rounded-md border"
            classNames={{
              day_today: "bg-booking-accent text-booking-primary",
              day_selected: "bg-booking-primary text-white",
            }}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Available Time Slots</CardTitle>
          <CardDescription>
            {selectedDate
              ? `Select a time on ${format(selectedDate, 'EEEE, MMMM d, yyyy')}`
              : 'Select a date to view available times'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="text-center py-8 text-gray-500">
              Please select a date to see available time slots
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No available time slots for this date
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {availableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`booking-card cursor-pointer transition-transform hover:-translate-y-1 ${
                    selectedSlot?.id === slot.id ? 'ring-2 ring-booking-primary' : ''
                  }`}
                  onClick={() => handleSlotSelect(slot)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-booking-primary" />
                    <span className="font-medium">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-bold">${slot.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              className="bg-booking-primary hover:bg-opacity-90"
              size="lg"
              disabled={!selectedSlot || isLoading}
              onClick={handleBookNow}
            >
              {isLoading ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingCalendar;
