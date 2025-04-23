import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { TimeSlot, Booking } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from './AuthContext';

type BookingContextType = {
  timeSlots: TimeSlot[];
  bookings: Booking[];
  selectedSlot: TimeSlot | null;
  isLoading: boolean;
  addTimeSlot: (date: Date, startTime: string, endTime: string, price: number) => Promise<boolean>;
  deleteTimeSlot: (id: string) => Promise<boolean>;
  selectSlot: (slot: TimeSlot) => void;
  createBooking: (slotId: string) => Promise<{ bookingId: string; stripePriceId: string } | null>;
  confirmPayment: (bookingId: string) => Promise<boolean>;
  getSlotById: (id: string) => TimeSlot | undefined;
  getUserBookings: () => Booking[];
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const fetchTimeSlots = useCallback(async () => {
    setIsFetchingSlots(true);
    try {
      const response = await fetch('http://localhost:3000/api/events');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch time slots');
      }
      const data = await response.json();
      
      const fetchedSlots: TimeSlot[] = data.events.map((event) => ({ 
        id: event.id, 
        date: format(new Date(event.date), 'yyyy-MM-dd'), 
        startTime: event.startTime,
        endTime: event.endTime,
        isBooked: event.isBooked, 
        price: event.price,       
        bookedBy: event.bookedBy,
      }));
      
      setTimeSlots(fetchedSlots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast({
        title: "Error Loading Slots",
        description: error.message || "Could not load available time slots.",
        variant: "destructive",
      });
      setTimeSlots([]);
    } finally {
      setIsFetchingSlots(false);

      
    }
  }, [toast]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const addTimeSlot = async (date: Date, startTime: string, endTime: string, price: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // <--- Add this line
        body: JSON.stringify({ date: formattedDate, startTime, endTime, price }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add time slot');
      }
      
      toast({
        title: "Success",
        description: data.message || "Time slot added successfully",
      });
      
      await fetchTimeSlots(); 
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add time slot",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTimeSlot = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3000/api/events/${id}`, {
        method: 'DELETE',
        credentials: 'include', // <--- Add this line
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete time slot');
      }
      
      await fetchTimeSlots(); 

      toast({
        title: "Success",
        description: data.message || "Time slot deleted successfully",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete time slot",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const selectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const getSlotById = (id: string): TimeSlot | undefined => {
    return timeSlots.find(slot => slot.id === id);
  };

  const createBooking = async (slotId: string): Promise<{ bookingId: string; stripePriceId: string } | null> => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to book a slot.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/bookings/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with the request
        body: JSON.stringify({ slotId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the error message from the backend if available
        throw new Error(data.message || 'Failed to initiate booking');
      }

      // No longer need to update local state here, backend handles status change
      // setBookings(prev => [...prev, newBooking]);
      // setTimeSlots(prev => prev.map(s => 
      //   s.id === slotId ? { ...s, isBooked: true, bookedBy: currentUser.id } : s
      // ));

      // Refetch time slots to get the updated status from the server
      await fetchTimeSlots();

      // Return bookingId and stripePriceId for payment processing
      return { bookingId: data.bookingId, stripePriceId: data.stripePriceId };

    } catch (error) {
      toast({
        title: "Booking Error",
        description: error.message || "Failed to initiate booking. The slot might already be taken.",
        variant: "destructive",
      });
      // Refetch time slots in case the error was due to outdated local state
      await fetchTimeSlots(); 
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (bookingId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, paymentStatus: 'completed' } : booking
      ));
      
      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed",
      });
      return true;
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserBookings = (): Booking[] => {
    if (!currentUser) return [];
    return bookings.filter(booking => booking.userId === currentUser.id);
  };

  const value = {
    timeSlots,
    bookings,
    selectedSlot,
    isLoading: isLoading || isFetchingSlots,
    addTimeSlot,
    deleteTimeSlot,
    selectSlot,
    createBooking,
    confirmPayment,
    getSlotById,
    getUserBookings,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
