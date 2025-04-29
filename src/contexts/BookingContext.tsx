import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { TimeSlot, Booking } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from './AuthContext';

// Define a type for the raw event data coming from the backend API
interface BackendEventData {
  id: string;
  date: string; // Expecting ISO string or YYYY-MM-DD
  startTime: string;
  endTime: string;
  price: number;
  status: 'available' | 'pending' | 'completed' | 'cancelled';
  bookedBy?: string | null; // Optional, might be null or ObjectId string
  stripePriceId: string;
  // Add any other fields returned by the /api/events endpoint
}

type BookingContextType = {
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  isLoading: boolean;
  addTimeSlot: (date: Date, startTime: string, endTime: string, price: number) => Promise<boolean>;
  deleteTimeSlot: (id: string) => Promise<boolean>;
  selectSlot: (slot: TimeSlot) => void;
  createBooking: (slotId: string) => Promise<{ bookingId: string; stripePriceId: string } | null>;
  getSlotById: (id: string) => TimeSlot | undefined;
  fetchTimeSlots: () => Promise<void>;
  getUserBookings: () => Promise<Booking[]>; // Changed from getUserBookings
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
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
      // Assuming the backend returns { events: BackendEventData[] }
      const data: { events: BackendEventData[] } = await response.json();

      // Use the specific BackendEventData type here
      const fetchedSlots: TimeSlot[] = data.events.map((event: BackendEventData) => ({
        id: event.id,
        // Parse date string correctly, assuming backend sends YYYY-MM-DD or ISO
        // format() expects a Date object, so parse first if needed
        date: format(new Date(event.date), 'yyyy-MM-dd'),
        startTime: event.startTime,
        endTime: event.endTime,
        isBooked: event.status !== 'available',
        price: event.price,
        // Ensure bookedBy is handled correctly (might be null)
        bookedBy: event.bookedBy || undefined,
        status: event.status,
        stripePriceId: event.stripePriceId
      }));

      setTimeSlots(fetchedSlots);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      const errorMsg = error instanceof Error ? error.message : "Could not load available time slots.";
      toast({
        title: "Error Loading Slots",
        description: errorMsg,
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
        credentials: 'include',
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

      await fetchTimeSlots(); // Refresh slots list

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add time slot";
      toast({
        title: "Error",
        description: errorMsg,
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
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete time slot');
      }

      await fetchTimeSlots(); // Refresh slots list

      toast({
        title: "Success",
        description: data.message || "Time slot deleted successfully",
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete time slot";
      toast({
        title: "Error",
        description: errorMsg,
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
        credentials: 'include',
        body: JSON.stringify({ slotId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate booking');
      }

      // Refetch time slots to get the updated 'pending' status from the server
      await fetchTimeSlots();

      // Return bookingId and stripePriceId needed for the payment form
      return { bookingId: data.bookingId, stripePriceId: data.stripePriceId };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to initiate booking. The slot might already be taken or there was a server error.";
      toast({
        title: "Booking Error",
        description: errorMsg,
        variant: "destructive",
      });
      // Refetch time slots in case the error was due to outdated local state or concurrent booking
      await fetchTimeSlots();
      return null;
    } finally {
      setIsLoading(false);
      setSelectedSlot(null); // Clear selection after attempting booking
    }
  };

  // Renamed function to fetch user-specific bookings from the API
  const getUserBookings = async (): Promise<Booking[]> => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to view your bookings.",
        variant: "destructive",
      });
      return []; // Return empty array if not logged in
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending session cookie
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user bookings');
      }

      // Raw data from the backend (adjust type if backend structure is known)
      const rawBookings = await response.json();

      // Parse raw data into the frontend Booking type
      const parsedBookings: Booking[] = rawBookings.map(rawBooking => {
        // Map backend status ('confirmed', 'pending') to frontend paymentStatus
        let paymentStatus: 'pending' | 'completed' | 'failed';
        switch (rawBooking.status) {
          case 'confirmed':
            paymentStatus = 'completed';
            break;
          case 'pending':
            paymentStatus = 'pending';
            break;
          default: // Handle unexpected statuses
            console.warn(`Unexpected booking status: ${rawBooking.status} for booking ${rawBooking._id}`);
            paymentStatus = 'failed'; // Default to failed for safety
        }

        return {
          id: rawBooking._id, // Use backend booking ID
          userId: rawBooking.bookedBy, // Assuming backend returns the ID string
          slotId: rawBooking._id, // Using the booking ID as the slotId based on current type
          paymentStatus: paymentStatus,
          createdAt: '2024-01-01T12:00:00.000Z', // Hardcoded date for now
          slot: { // Construct the nested slot object from booking details
            id: rawBooking._id, // Use booking ID for slot ID
            date: format(new Date(rawBooking.date), 'yyyy-MM-dd'), // Format date string
            startTime: rawBooking.startTime,
            endTime: rawBooking.endTime,
            isBooked: true, // This represents a booked slot
            price: rawBooking.price,
            bookedBy: rawBooking.bookedBy, // Include bookedBy if needed
            // Note: Other TimeSlot fields like 'status' or 'stripePriceId' might exist in the backend
            // booking model but are not part of the nested `slot` in the `Booking` type.
          }
        };
      });

      return parsedBookings;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred while fetching your bookings.";
      toast({
        title: "Error Fetching Bookings",
        description: errorMsg,
        variant: "destructive",
      });
      return []; // Return empty array on error
    } finally {
      setIsLoading(false);
    }
  };


  const value = {
    timeSlots,
    selectedSlot,
    isLoading: isLoading || isFetchingSlots,
    addTimeSlot,
    deleteTimeSlot,
    selectSlot,
    createBooking,
    getSlotById,
    getUserBookings, // Expose the updated function
    fetchTimeSlots,
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
