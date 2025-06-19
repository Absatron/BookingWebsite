
import React, { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBooking } from '@/contexts/BookingContext';
import { TimeSlot } from '@/types';
import { format } from 'date-fns';
import { Calendar, Clock, DollarSign, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 

const AdminPanel = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [price, setPrice] = useState('');
  const { timeSlots, addTimeSlot, deleteTimeSlot, isLoading } = useBooking();
  const navigate = useNavigate();
  
  const handleAddSlot = async () => {
    if (!selectedDate || !startTime || !endTime || !price) {
      return;
    }
    
    await addTimeSlot(selectedDate, startTime, endTime, parseFloat(price));
    
    // Reset form
    setStartTime('');
    setEndTime('');
    setPrice('');
  };
  
  // Filter time slots to display only future ones (considering actual time for today)
  const futureSlots = [...timeSlots]
    .filter(slot => {
      const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
      return slotDateTime >= new Date();
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });
  
  // Group slots by date for better UI organization
  const slotsByDate = futureSlots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {});
  
  return (
    <div className="booking-container py-8">
      <h1 className="text-2xl font-bold text-booking-primary mb-8">Admin Panel</h1>
      
      <div className="space-y-8">
        <Card>
        <CardHeader>
          <CardTitle>Add New Time Slot</CardTitle>
          <CardDescription>Create available time slots for bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker 
                selected={selectedDate} 
                onSelect={setSelectedDate} 
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAddSlot} 
            className="bg-booking-primary" 
            disabled={isLoading || !selectedDate || !startTime || !endTime || !price}
          >
            {isLoading ? 'Adding...' : 'Add Time Slot'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Time Slots</CardTitle>
          <CardDescription>View and manage your available time slots</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(slotsByDate).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No future time slots available. Add some slots above.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(slotsByDate).map(([date, slots]) => (
                <div key={date} className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-booking-primary" />
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slots.map((slot) => (
                      <div 
                        key={slot.id} 
                        className={`booking-card relative ${slot.isBooked ? 'opacity-75 cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                        onClick={slot.isBooked ? () => navigate(`/admin/booking/${slot.id}`) : undefined}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="font-bold text-booking-primary">
                            ${slot.price.toFixed(2)}
                          </span>
                        </div>
                        
                        {slot.isBooked ? (
                          <div className="bg-booking-warning text-white text-xs py-1 px-2 rounded-md inline-block">
                            Booked 
                          </div>
                        ) : (
                          <div className="bg-green-100 text-green-800 text-xs py-1 px-2 rounded-md inline-block">
                            Available
                          </div>
                        )}
                        
                        {!slot.isBooked && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click when delete button is clicked
                              deleteTimeSlot(slot.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
