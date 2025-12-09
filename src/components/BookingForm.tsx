'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Phone, Mail, MapPin, Music, Star, Send } from 'lucide-react';
import { supabase, Booking } from '@/lib/supabase';
import { useAvailability, useOccupiedSlots } from '@/hooks/useBookings';
import BookingDisplay from './BookingDisplay';

interface BookingData {
  date: Date | null;
  time: string;
  hour: number;
  minute: number;
  eventType: string;
  eventName: string;
  guests: number;
  location: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

const BookingForm = () => {
  const { availability } = useAvailability();
  const { occupiedSlots } = useOccupiedSlots();
  
  const [bookingData, setBookingData] = useState<BookingData>({
    date: null,
    time: '',
    hour: 12,
    minute: 0,
    eventType: '',
    eventName: '',
    guests: 0,
    location: '',
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showBookingDisplay, setShowBookingDisplay] = useState(false);
  const [selectedDateForBookings, setSelectedDateForBookings] = useState<Date | null>(null);

  const eventTypes = [
    { id: 'birthday', name: 'Cumpleaños', icon: '🎂', description: 'Celebración de cumpleaños especial' },
    { id: 'baptism', name: 'Bautizo', icon: '👶', description: 'Ceremonia de bautizo familiar' },
    { id: 'communion', name: 'Comunión', icon: '⛪', description: 'Primera comunión y celebración' },
    { id: 'wedding', name: 'Boda', icon: '💒', description: 'Ceremonia y celebración nupcial' },
    { id: 'anniversary', name: 'Aniversario', icon: '💕', description: 'Celebración de aniversario' },
    { id: 'corporate', name: 'Evento Corporativo', icon: '🏢', description: 'Evento empresarial o corporativo' },
    { id: 'private', name: 'Fiesta Privada', icon: '🎉', description: 'Celebración privada personalizada' },
    { id: 'other', name: 'Otro Evento', icon: '🎵', description: 'Otro tipo de celebración especial' }
  ];

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    
    // Días del mes anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = new Date(currentYear, currentMonth, -i);
      days.push({ date: day, isCurrentMonth: false, isDisabled: true });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const isPast = date < today;
      const dayAvailability = availability.find(a => a.date === dateString);
      const dayOccupiedSlots = occupiedSlots.filter(slot => slot.date === dateString);
      
      days.push({ 
        date, 
        isCurrentMonth: true, 
        isDisabled: isPast,
        occupiedSlots: dayOccupiedSlots,
        notes: dayAvailability?.notes
      });
    }
    
    return days;
  };

  const handleEventTypeSelect = (eventType: typeof eventTypes[0]) => {
    setBookingData((prev: BookingData) => ({
      ...prev,
      eventType: eventType.name
    }));
    setCurrentStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setBookingData((prev: BookingData) => ({ ...prev, date }));
    setShowCalendar(false);
    setShowTimePicker(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDateForBookings(date);
    setShowBookingDisplay(true);
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setBookingData((prev: BookingData) => ({
      ...prev,
      hour,
      minute,
      time: timeString
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            client_name: bookingData.name,
            client_email: bookingData.email,
            client_phone: bookingData.phone,
            event_date: bookingData.date?.toISOString().split('T')[0],
            event_time: bookingData.time,
            event_type: bookingData.eventType,
            event_name: bookingData.eventName,
            event_location: bookingData.location,
            guests: bookingData.guests,
            special_requests: bookingData.message,
            status: 'pending'
          }
        ]);

      if (error) {
        console.error('Error creating booking:', error);
        alert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.');
        return;
      }

      console.log('Booking created successfully:', data);

      // Enviar email de notificación a Frantana
      try {
        const fechaFormateada = bookingData.date?.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        const emailMessage = `
🎉 NUEVA RESERVA RECIBIDA 🎉

Se ha recibido una nueva solicitud de reserva desde el sitio web.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMACIÓN DEL EVENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tipo de Evento: ${bookingData.eventType}
Nombre del Evento: ${bookingData.eventName}
Fecha: ${fechaFormateada}
Hora: ${bookingData.time}
Ubicación: ${bookingData.location}
Número de Invitados: ${bookingData.guests} personas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 INFORMACIÓN DEL CLIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nombre: ${bookingData.name}
Email: ${bookingData.email}
Teléfono: ${bookingData.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 SOLICITUDES ESPECIALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${bookingData.message || 'No hay solicitudes especiales.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estado: PENDIENTE
Fecha de creación: ${new Date().toLocaleString('es-ES')}

Por favor, revisa el panel de administración para aprobar o rechazar esta reserva.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();

        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: ['appfrantana@gmail.com', 'Frantanaoriginal@gmail.com'],
            subject: `🎉 Nueva Reserva: ${bookingData.eventName} - ${fechaFormateada}`,
            message: emailMessage,
          }),
        });

        if (!emailResponse.ok) {
          console.warn('Error enviando email de notificación, pero la reserva se creó correctamente');
        } else {
          console.log('Email de notificación enviado correctamente');
        }
      } catch (emailError) {
        // No bloquear el flujo si falla el email, solo loguear
        console.warn('Error enviando email de notificación:', emailError);
      }

      setCurrentStep(5);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Evento', icon: Music },
    { id: 2, title: 'Fecha', icon: Calendar },
    { id: 3, title: 'Hora', icon: Clock },
    { id: 4, title: 'Detalles', icon: User },
    { id: 5, title: 'Confirmación', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 mb-6 md:mb-8">
            Reserva tu Evento
          </h1>
          <p className="text-gray-700 text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-light">
            Cuéntanos sobre tu evento especial y te enviaremos una propuesta personalizada. 
            <span className="font-semibold text-pink-600"> Sin compromiso, solo consulta.</span>
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12 md:mb-16">
          <div className="flex items-center space-x-4 md:space-x-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-xl' 
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Icon className="w-5 h-5 md:w-7 md:h-7" />
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-12 h-1 mx-3 rounded-full ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="card p-6 md:p-12"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Event Type Selection */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
                  ¿Qué tipo de evento es?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventTypes.map((eventType) => (
                    <motion.button
                      key={eventType.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEventTypeSelect(eventType)}
                      className="p-8 border-2 border-white/20 rounded-3xl hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50 transition-all duration-300 text-center group shadow-2xl hover:shadow-pink-500/25 backdrop-blur-sm bg-white/80"
                    >
                      <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {eventType.icon}
                      </div>
                      <h3 className="text-xl font-black text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300 mb-2">
                        {eventType.name}
                      </h3>
                      <p className="text-gray-600 text-sm font-medium">
                        {eventType.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Date Selection */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                  Elige tu Fecha
                </h2>
                
                <div className="space-y-6">
                  {/* Fecha seleccionada */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border-2 border-pink-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Fecha seleccionada:</p>
                        <p className={`text-lg font-bold ${bookingData.date ? 'text-gray-800' : 'text-gray-400'}`}>
                          {bookingData.date 
                            ? bookingData.date.toLocaleDateString('es-ES', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'Aún no has seleccionado una fecha'
                          }
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Calendario siempre visible */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-4">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center text-xs sm:text-sm font-bold text-gray-700 py-2">
                          {day}
                        </div>
                      ))}
                      {generateCalendarDays().map((day, index) => (
                        <button
                          key={index}
                          onClick={() => !day.isDisabled && handleDateSelect(day.date)}
                          disabled={day.isDisabled}
                          className={`py-2 sm:py-3 text-xs sm:text-sm rounded-lg transition-all duration-300 relative ${
                            day.isDisabled
                              ? 'text-gray-200 cursor-not-allowed'
                              : day.isCurrentMonth
                              ? 'text-gray-700 hover:bg-pink-100 hover:scale-105'
                              : 'text-gray-300'
                          } ${
                            bookingData.date?.toDateString() === day.date.toDateString()
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-110 shadow-lg'
                              : ''
                          }`}
                          title={day.occupiedSlots && day.occupiedSlots.length > 0 
                            ? `Horarios ocupados:\n${day.occupiedSlots.map(slot => `${slot.start_time}-${slot.end_time}: ${slot.event_name}`).join('\n')}`
                            : day.notes || ''
                          }
                        >
                          {day.date.getDate()}
                          {day.occupiedSlots && day.occupiedSlots.length > 0 && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-pink-50 hover:border-pink-400 hover:text-pink-600 transition-all duration-300"
                  >
                    ← Anterior
                  </button>
                  <div className="flex flex-col-reverse sm:flex-row gap-4">
                    {bookingData.date && (
                      <button
                        onClick={() => handleDateClick(bookingData.date!)}
                        className="px-6 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all duration-300"
                      >
                        Ver Reservas
                      </button>
                    )}
                    {bookingData.date && (
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-8 py-4 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
                      >
                        Continuar →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Time Selection */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                  Selecciona la Hora
                </h2>
                
                <div className="space-y-6">
                  {/* Hora seleccionada */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border-2 border-pink-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Hora seleccionada:</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                          {bookingData.time || '12:00'}
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Timepicker */}
                  <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
                    <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-8">
                      {/* Selector de Horas */}
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Hora</h3>
                        <div className="bg-gray-50 rounded-xl p-3 md:p-4 max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {Array.from({ length: 24 }, (_, i) => (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTimeSelect(i, bookingData.minute)}
                                className={`w-12 h-12 rounded-lg font-bold transition-all duration-300 ${
                                  bookingData.hour === i
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-110 shadow-lg'
                                    : 'bg-white hover:bg-pink-100 text-gray-700 hover:text-pink-600'
                                }`}
                              >
                                {i.toString().padStart(2, '0')}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Separador */}
                      <div className="text-4xl font-bold text-gray-400">:</div>

                      {/* Selector de Minutos */}
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Minutos</h3>
                        <div className="bg-gray-50 rounded-xl p-3 md:p-4 max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {Array.from({ length: 60 }, (_, i) => {
                              if (i % 5 === 0) { // Solo mostrar cada 5 minutos para simplificar
                                return (
                                  <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleTimeSelect(bookingData.hour, i)}
                                    className={`w-12 h-12 rounded-lg font-bold transition-all duration-300 ${
                                      bookingData.minute === i
                                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-110 shadow-lg'
                                        : 'bg-white hover:bg-pink-100 text-gray-700 hover:text-pink-600'
                                    }`}
                                  >
                                    {i.toString().padStart(2, '0')}
                                  </motion.button>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Opciones rápidas */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="text-center text-sm font-semibold text-gray-600 mb-4">Horarios Populares</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { hour: 10, minute: 0, label: '10:00' },
                          { hour: 12, minute: 0, label: '12:00' },
                          { hour: 15, minute: 0, label: '15:00' },
                          { hour: 18, minute: 0, label: '18:00' },
                          { hour: 19, minute: 30, label: '19:30' },
                          { hour: 20, minute: 0, label: '20:00' },
                          { hour: 21, minute: 0, label: '21:00' },
                          { hour: 22, minute: 0, label: '22:00' }
                        ].map((time) => (
                          <motion.button
                            key={time.label}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleTimeSelect(time.hour, time.minute)}
                            className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                              bookingData.hour === time.hour && bookingData.minute === time.minute
                                ? 'border-pink-500 bg-pink-500 text-white'
                                : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50 text-gray-700'
                            }`}
                          >
                            {time.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-pink-50 hover:border-pink-400 hover:text-pink-600 transition-all duration-300"
                  >
                    ← Anterior
                  </button>
                  {bookingData.time && (
                    <div className="flex sm:justify-end">
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="px-8 py-4 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
                      >
                        Continuar →
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Event Details */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                  Detalles del Evento
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Evento *
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingData.eventName}
                        onChange={(e) => setBookingData((prev: BookingData) => ({ ...prev, eventName: e.target.value }))}
                        className="input-field"
                        placeholder="Ej: Cumpleaños de María"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Invitados *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={bookingData.guests}
                        onChange={(e) => setBookingData((prev: BookingData) => ({ ...prev, guests: parseInt(e.target.value) }))}
                        className="input-field"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación del Evento *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        required
                        value={bookingData.location}
                        onChange={(e) => setBookingData((prev: BookingData) => ({ ...prev, location: e.target.value }))}
                        className="w-full px-10 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white transition-all duration-300"
                        placeholder="Dirección completa del evento"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tu Nombre *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          required
                          value={bookingData.name}
                          onChange={(e) => setBookingData((prev: BookingData) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-10 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white transition-all duration-300"
                          placeholder="Tu nombre completo"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          required
                          value={bookingData.phone}
                          onChange={(e) => setBookingData((prev: BookingData) => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-10 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white transition-all duration-300"
                          placeholder="+34 600 000 000"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        required
                        value={bookingData.email}
                        onChange={(e) => setBookingData((prev: BookingData) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-10 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:bg-white transition-all duration-300"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detalles Adicionales
                    </label>
                    <textarea
                      value={bookingData.message}
                      onChange={(e) => setBookingData((prev: BookingData) => ({ ...prev, message: e.target.value }))}
                      className="input-field h-24 resize-none"
                      placeholder="Cuéntanos más sobre tu evento: estilo musical preferido, duración deseada, necesidades especiales..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-pink-50 hover:border-pink-400 hover:text-pink-600 transition-all duration-300"
                    >
                      ← Anterior
                    </button>
                    <div className="flex sm:justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="spinner" />
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar Solicitud</span>
                            <Send className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Star className="w-10 h-10 text-green-500" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  ¡Solicitud Enviada!
                </h2>
                
                <p className="text-gray-600 text-lg">
                  Gracias por tu interés. Te contactaremos pronto con una propuesta personalizada.
                </p>

                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 text-left border border-pink-200">
                  <h3 className="font-semibold text-gray-800 mb-4">Resumen de tu Solicitud:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo de Evento:</span>
                      <span className="font-medium">{bookingData.eventType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">
                        {bookingData.date?.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hora:</span>
                      <span className="font-medium">{bookingData.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre del Evento:</span>
                      <span className="font-medium">{bookingData.eventName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invitados:</span>
                      <span className="font-medium">{bookingData.guests} personas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ubicación:</span>
                      <span className="font-medium">{bookingData.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contacto:</span>
                      <span className="font-medium">{bookingData.name}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setBookingData({
                      date: null,
                      time: '',
                      hour: 12,
                      minute: 0,
                      eventType: '',
                      eventName: '',
                      guests: 0,
                      location: '',
                      name: '',
                      email: '',
                      phone: '',
                      message: ''
                    });
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Nueva Solicitud
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Modal para mostrar reservas existentes */}
      {showBookingDisplay && selectedDateForBookings && (
        <BookingDisplay
          selectedDate={selectedDateForBookings}
          onClose={() => {
            setShowBookingDisplay(false);
            setSelectedDateForBookings(null);
          }}
        />
      )}
    </div>
  );
};

export default BookingForm;
