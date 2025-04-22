import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { format, addDays, startOfDay, addHours } from 'date-fns';
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
  createBooking: (slotId: string) => Promise<string | null>;
  confirmPayment: (bookingId: string) => Promise<boolean>;
  getSlotById: (id: string) => TimeSlot | undefined;
  getUserBookings: () => Booking[];
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Generate some initial mock data
const generateMockSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const today = startOfDay(new Date());
  
  for (let i = 1; i <= 14; i++) {
    const day = addDays(today, i % 7);
    
    // Add morning slot
    slots.push({
      id: `slot_${i}_morning`,
      date: format(day, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      isBooked: false,
      price: 75 + (i % 3) * 10,
    });
    
    // Add afternoon slot
    slots.push({
      id: `slot_${i}_afternoon`,
      date: format(day, 'yyyy-MM-dd'),
      startTime: '14:00',
      endTime: '15:00',
      isBooked: i % 5 === 0, // Some slots already booked
      price: 85 + (i % 4) * 10,
    });
  }
  
  return slots;
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateMockSlots());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const addTimeSlot = async (date: Date, startTime: string, endTime: string, price: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          date: formattedDate, 
          startTime, 
          endTime, 
          price 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add time slot');
      }

      // Use the event data returned from the backend
      const backendEvent = data.event;
      if (!backendEvent || !backendEvent.id) {
        // Handle cases where the backend didn't return the expected event object
        console.error("Backend did not return the created event object:", data);
        throw new Error("Failed to retrieve created time slot from server.");
      }

      const newSlot: TimeSlot = {
        id: backendEvent.id, // Use the ID from the backend
        date: backendEvent.date,
        startTime: backendEvent.startTime,
        endTime: backendEvent.endTime,
        isBooked: backendEvent.isBooked,
        price: backendEvent.price, // Use price from backend response
      };

      setTimeSlots(prev => [...prev, newSlot]);
      toast({
        title: "Success",
        description: data.message || "Time slot added successfully",
      });
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
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete time slot",
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

  const createBooking = async (slotId: string): Promise<string | null> => {
    try {
      if (!currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to book a slot",
          variant: "destructive",
        });
        return null;
      }

      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      
      const slot = timeSlots.find(s => s.id === slotId);
      if (!slot || slot.isBooked) {
        toast({
          title: "Error",
          description: "This slot is no longer available",
          variant: "destructive",
        });
        return null;
      }
      
      const bookingId = `booking_${Date.now()}`;
      const newBooking: Booking = {
        id: bookingId,
        userId: currentUser.id,
        slotId: slot.id,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        slot: slot,
      };
      
      setBookings(prev => [...prev, newBooking]);
      
      // Mark the slot as tentatively booked
      setTimeSlots(prev => prev.map(s => 
        s.id === slotId ? { ...s, isBooked: true, bookedBy: currentUser.id } : s
      ));
      
      return bookingId;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (bookingId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate payment processing
      
      // Update booking status
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
    isLoading,
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
