'use client';

import { useState, useEffect } from 'react';
import { supabase, Booking, OccupiedSlot } from '@/lib/supabase';
import { Calendar, Clock, User, MapPin, CheckCircle, XCircle } from 'lucide-react';

interface BookingDisplayProps {
  selectedDate: Date;
  onClose: () => void;
}

const BookingDisplay = ({ selectedDate, onClose }: BookingDisplayProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Obtener reservas
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_date', dateString)
        .order('created_at', { ascending: true });

      if (bookingsError) {
        console.warn('Error fetching bookings (column may not exist yet):', bookingsError);
        setBookings([]);
      } else {
        setBookings(bookingsData || []);
      }

      // Obtener horarios ocupados
      const { data: slotsData, error: slotsError } = await supabase
        .from('occupied_slots')
        .select('*')
        .eq('date', dateString)
        .order('start_time', { ascending: true });

      if (slotsError) {
        console.warn('Error fetching occupied slots (table may not exist yet):', slotsError);
        setOccupiedSlots([]);
      } else {
        setOccupiedSlots(slotsData || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Confirmada';
      case 'rejected': return 'Rechazada';
      default: return 'Pendiente';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Reservas para {selectedDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="login-spinner mx-auto"></div>
          </div>
        ) : bookings.length === 0 && occupiedSlots.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hay eventos para este día</p>
            <p className="text-gray-500 text-sm mt-2">Este día está completamente disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Horarios ocupados */}
            {occupiedSlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-800 mb-2">
                      {slot.event_name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-700 font-semibold">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                    
                    {slot.notes && (
                      <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-800">
                          <strong>Notas:</strong> {slot.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold text-orange-600 bg-orange-100">
                      Confirmado
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Reservas pendientes */}
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {booking.event_name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-600">{booking.event_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-600">{booking.client_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-600">{booking.event_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{booking.guests} invitados</span>
                      </div>
                    </div>
                    
                    {booking.special_requests && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Solicitudes especiales:</strong> {booking.special_requests}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDisplay;
