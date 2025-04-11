
export type User = {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
};

export type TimeSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  price: number;
  bookedBy?: string;
};

export type Booking = {
  id: string;
  userId: string;
  slotId: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  slot: TimeSlot;
};
