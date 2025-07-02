import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { TimeSlot, Booking } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from './AuthContext';
import { config } from '@/lib/config';

// Define a type for the raw event data coming from the backend API
interface BackendEventData {
  id: string;
  date: string; // Expecting ISO string or YYYY-MM-DD
  startTime: string;
  endTime: string;
  price: number;
  status: 'available' | 'pending' | 'completed' | 'cancelled';
  bookedBy?: string | null; 
  stripePriceId: string;
}

type BookingContextType = {
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  isLoading: boolean;
  addTimeSlot: (date: Date, startTime: string, endTime: string, price: number) => Promise<boolean>;
  deleteTimeSlot: (id: string) => Promise<boolean>;
  selectSlot: (slot: TimeSlot) => void;
  createBooking: (bookingId: string) => Promise<{ bookingId: string; stripePriceId: string } | null>;
  getSlotById: (id: string) => TimeSlot | undefined;
  fetchTimeSlots: () => Promise<void>;
  getUserBookings: () => Promise<Booking[]>; 
  getAllAdminBookings: () => Promise<Booking[]>; 
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(true);
  const { toast } = useToast();
  const { currentUser , handleSessionExpired } = useAuth();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const fetchTimeSlots = useCallback(async () => {
    setIsFetchingSlots(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/bookings`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch time slots');
      }
      // Assuming the backend returns { bookings: BackendEventData[] }
      const data: { bookings: BackendEventData[] } = await response.json();

      // Use the specific BackendEventData type here
      const fetchedSlots: TimeSlot[] = data.bookings.map((event: BackendEventData) => ({
        id: event.id,
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
      const response = await fetch(`${config.apiUrl}/api/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const response = await fetch(`${config.apiUrl}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
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

  const createBooking = useCallback(async (bookingId: string): Promise<{ bookingId: string; stripePriceId: string } | null> => {

    setIsLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/bookings/initiate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleSessionExpired(); // This immediately clears currentUser
        throw new Error('Your session has expired. Please log in again.');
      }

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
  }, [toast, fetchTimeSlots, handleSessionExpired]);

  // Renamed function to fetch user-specific bookings from the API
  // Callback needed to ensure stable reference for useEffect in Dashboard or Profile component
  const getUserBookings = useCallback(async (): Promise<Booking[]> => {
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
      const response = await fetch(`${config.apiUrl}/api/bookings/user`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired()
          throw new Error('Authentication required. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user bookings');
      }

      // Raw data from the backend 
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
          bookingId: rawBooking._id, // Using the booking ID as the bookingId
          paymentStatus: paymentStatus,
          createdAt: rawBooking.createdAt || '2024-01-01T12:00:00.000Z', // Fallback date if not provided
          slot: { // Construct the nested slot object from booking details
            id: rawBooking._id, // Use booking ID for slot ID
            date: format(new Date(rawBooking.date), 'yyyy-MM-dd'), // Format date string
            startTime: rawBooking.startTime,
            endTime: rawBooking.endTime,
            isBooked: true, // This represents a booked slot
            price: rawBooking.price,
            bookedBy: rawBooking.bookedBy, // Include bookedBy if needed
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
  }, [currentUser, toast, handleSessionExpired]);

  // Function to fetch all confirmed bookings for admin users
  const getAllAdminBookings = useCallback(async (): Promise<Booking[]> => {
    if (!currentUser || !currentUser.isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required to view all bookings.",
        variant: "destructive",
      });
      return [];
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/bookings/confirmed`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired()
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch admin bookings');
      }

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
          default:
            console.warn(`Unexpected booking status: ${rawBooking.status} for booking ${rawBooking._id}`);
            paymentStatus = 'failed';
        }

        // Safely handle populated bookedBy field
        const bookedByUser = rawBooking.bookedBy;
        const userId = bookedByUser?._id || bookedByUser || 'unknown';
        const customerName = bookedByUser?.name || 'Unknown';
        const customerEmail = bookedByUser?.email || 'Unknown';

        return {
          id: rawBooking._id,
          userId: userId,
          bookingId: rawBooking._id,
          paymentStatus: paymentStatus,
          createdAt: rawBooking.createdAt || '2024-01-01T12:00:00.000Z',
          slot: {
            id: rawBooking._id,
            date: format(new Date(rawBooking.date), 'yyyy-MM-dd'),
            startTime: rawBooking.startTime,
            endTime: rawBooking.endTime,
            isBooked: true,
            price: rawBooking.price,
            bookedBy: userId,
          },
          // Add customer details for admin view
          customerName: customerName,
          customerEmail: customerEmail,
        };
      });

      return parsedBookings;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred while fetching admin bookings.";
      toast({
        title: "Error Fetching Admin Bookings",
        description: errorMsg,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast, handleSessionExpired]);


  const value = {
    timeSlots,
    selectedSlot,
    isLoading: isLoading || isFetchingSlots,
    addTimeSlot,
    deleteTimeSlot,
    selectSlot,
    createBooking,
    getSlotById,
    getUserBookings,
    getAllAdminBookings, 
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
