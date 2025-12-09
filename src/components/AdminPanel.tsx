'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Phone, Mail, MapPin, CheckCircle, XCircle, MessageSquare, Plus, Edit, LogOut, Lock, Eye, EyeOff, Download, DollarSign, Receipt, FileText } from 'lucide-react';
import { useBookings, useAvailability, useOccupiedSlots } from '@/hooks/useBookings';
import { useInvoices } from '@/hooks/useInvoices';
import { OccupiedSlot } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import TimePicker from './TimePicker';
import styles from './AdminPanel.module.css';

const AdminPanel = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability' | 'occupied' | 'invoicing'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [notes, setNotes] = useState('');
  
  // Estados para modales
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showOccupiedModal, setShowOccupiedModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<any>(null);
  const [editingOccupied, setEditingOccupied] = useState<any>(null);
  
  // Estados para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const { changePassword } = useAdminAuth();
  
  // Estados para formularios de disponibilidad
  const [availabilityForm, setAvailabilityForm] = useState({
    date: '',
    endDate: '', // Para rangos de días
    isRange: false, // Si es un rango de días o un solo día
    isTimeRange: false, // Si solo un rango de horas está no disponible
    notes: '',
    start_time: '',
    end_time: ''
  });
  
  const [occupiedForm, setOccupiedForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    event_name: '',
    notes: ''
  });
  
  // Estado para fecha seleccionada en calendario del modal de eventos
  const [selectedOccupiedDate, setSelectedOccupiedDate] = useState<Date | null>(null);

  // Estados para timepickers
  const [availabilityStartTime, setAvailabilityStartTime] = useState({ hour: 10, minute: 0 });
  const [availabilityEndTime, setAvailabilityEndTime] = useState({ hour: 12, minute: 0 });
  const [occupiedStartTime, setOccupiedStartTime] = useState({ hour: 18, minute: 0 });
  const [occupiedEndTime, setOccupiedEndTime] = useState({ hour: 22, minute: 0 });
  
  // Estados para selección de rango en calendario
  const [rangeStartDate, setRangeStartDate] = useState<Date | null>(null);
  const [rangeEndDate, setRangeEndDate] = useState<Date | null>(null);
  
  const { bookings, loading: bookingsLoading, updateBookingStatus, refetch: refetchBookings } = useBookings();
  const { availability, loading: availabilityLoading, updateAvailability, markUnavailable, markRangeUnavailable, removeUnavailable } = useAvailability();
  const { occupiedSlots, loading: occupiedLoading, addOccupiedSlot, removeOccupiedSlot, updateOccupiedSlot, markAsInvoiced, refetch: refetchOccupiedSlots } = useOccupiedSlots();
  const { invoices, loading: invoicesLoading, addInvoice, updateInvoice, removeInvoice, refetch: refetchInvoices } = useInvoices();
  
  // Estado para filtro de eventos (solo para eventos confirmados)
  const [eventFilter, setEventFilter] = useState<'upcoming' | 'past'>('upcoming');
  
  // Estados para modales de facturación
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddInvoicedModal, setShowAddInvoicedModal] = useState(false);
  const [showAddStandaloneInvoiceModal, setShowAddStandaloneInvoiceModal] = useState(false);
  const [selectedEventForInvoice, setSelectedEventForInvoice] = useState<OccupiedSlot | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    method: '',
    amount: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    notes: '',
    description: '',
    invoiceNumber: ''
  });
  
  // Estado para fecha de facturación en calendario
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState<Date | null>(new Date());

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    // Obtener la reserva antes de actualizar (para tener los datos)
    const booking = bookings.find(b => b.id === id);
    
    // Primero actualizar el estado de la reserva
    await updateBookingStatus(id, status, notes);
    
    // Si se aprueba, añadir a horarios ocupados
    if (status === 'approved' && booking) {
      try {
        // Validar que tenemos los datos necesarios
        if (!booking.event_date || !booking.event_time) {
          console.error('Faltan datos de fecha u hora en la reserva:', booking);
          alert('Error: La reserva no tiene fecha u hora válida. Por favor, verifica los datos.');
          return;
        }
        
        // Extraer hora inicio y fin del evento
        const eventTime = booking.event_time;
        // El formato puede ser HH:MM:SS o HH:MM
        const timeParts = eventTime.split(':');
        const hour = parseInt(timeParts[0]);
        const minute = timeParts.length > 1 ? parseInt(timeParts[1]) || 0 : 0;
        
        // Formatear tiempos en HH:MM:SS
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        // Asumimos duración de 2 horas por defecto, pero puedes ajustarlo según el tipo de evento
        const endHour = hour + 2;
        const endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        
        // Crear nombre del evento
        const eventName = booking.event_name || `Reserva de ${booking.client_name}`;
        
        // Crear notas con información de contacto
        const occupiedNotes = notes 
          ? `${notes}\n\nCliente: ${booking.client_name}\nTel: ${booking.client_phone}\nEmail: ${booking.client_email}`
          : `Reserva aprobada.\nCliente: ${booking.client_name}\nTel: ${booking.client_phone}\nEmail: ${booking.client_email}${booking.event_location ? `\nUbicación: ${booking.event_location}` : ''}`;
        
        console.log('Añadiendo evento ocupado:', {
          date: booking.event_date,
          startTime,
          endTime,
          eventName,
          notes: occupiedNotes
        });
        
        // Añadir a horarios ocupados
        await addOccupiedSlot(
          booking.event_date,
          startTime,
          endTime,
          eventName,
          occupiedNotes
        );
        
        console.log('Evento ocupado añadido, refrescando lista...');
        
        // Refrescar la lista de eventos ocupados
        await refetchOccupiedSlots();
        
        console.log('Lista de eventos ocupados refrescada');
      } catch (error) {
        console.error('Error añadiendo a horarios ocupados:', error);
        alert(`Error al añadir a eventos confirmados: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, verifica la consola para más detalles.`);
      }
    }
    
    // Refrescar la lista de reservas después de todo
    await refetchBookings();
    
    // Enviar email al cliente
    if (booking) {
      try {
        // Generar URL del calendario si está aprobado
        let calendarLink = '';
        if (status === 'approved') {
          const startDate = new Date(`${booking.event_date}T${booking.event_time}`);
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 2); // Asumimos 2 horas de duración
          
          const params = new URLSearchParams({
            title: booking.event_name,
            description: notes || `Reserva confirmada para ${booking.event_name}`,
            location: booking.event_location || '',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            organizerName: 'Frantana',
            organizerEmail: 'info@frantana.com',
          });
          
          // URL absoluta para el email
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://frantana.com');
          calendarLink = `\n\n📅 Añadir al calendario (iPhone, Google, etc.):\n${baseUrl}/api/calendar-event?${params.toString()}`;
        }
        
        await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: booking.client_email,
            subject: status === 'approved' 
              ? 'Reserva Aprobada - Frantana' 
              : 'Reserva Rechazada - Frantana',
            message: status === 'approved'
              ? `Hola ${booking.client_name},\n\n¡Buenas noticias! Tu reserva para "${booking.event_name}" ha sido aprobada.\n\nFecha: ${new Date(booking.event_date).toLocaleDateString('es-ES')}\nHora: ${booking.event_time}\n\n${notes ? `Notas: ${notes}\n\n` : ''}${calendarLink}\n\nEsperamos verte pronto.\n\nSaludos,\nEquipo Frantana`
              : `Hola ${booking.client_name},\n\nLamentamos informarte que tu reserva para "${booking.event_name}" no ha podido ser aprobada en esta ocasión.\n\n${notes ? `Notas: ${notes}\n\n` : ''}Si tienes alguna pregunta, no dudes en contactarnos.\n\nSaludos,\nEquipo Frantana`
          }),
        });
      } catch (error) {
        console.error('Error enviando email:', error);
        // No mostramos error al usuario si falla el email, solo lo logeamos
      }
    }
    
    setSelectedBooking(null);
    setNotes('');
  };

  // Funciones para disponibilidad (solo marcar NO disponibles)
  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!availabilityForm.date) {
      alert('Por favor, selecciona una fecha');
      return;
    }
    
    if (availabilityForm.isRange && !availabilityForm.endDate) {
      alert('Por favor, selecciona la fecha de fin del rango');
      return;
    }
    
    if (availabilityForm.isRange && availabilityForm.endDate < availabilityForm.date) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }
    
    try {
      const startTimeString = availabilityForm.isTimeRange
        ? `${availabilityStartTime.hour.toString().padStart(2, '0')}:${availabilityStartTime.minute.toString().padStart(2, '0')}:00`
        : null;
      const endTimeString = availabilityForm.isTimeRange
        ? `${availabilityEndTime.hour.toString().padStart(2, '0')}:${availabilityEndTime.minute.toString().padStart(2, '0')}:00`
        : null;
      
      // Validar que hora fin > hora inicio si se especifica rango horario
      if (availabilityForm.isTimeRange && startTimeString && endTimeString) {
        const startMinutes = availabilityStartTime.hour * 60 + availabilityStartTime.minute;
        const endMinutes = availabilityEndTime.hour * 60 + availabilityEndTime.minute;
        if (endMinutes <= startMinutes) {
          alert('La hora de fin debe ser posterior a la hora de inicio');
          return;
        }
      }
      
      if (availabilityForm.isRange) {
        // Marcar rango de días como no disponibles
        await markRangeUnavailable(
        availabilityForm.date, 
          availabilityForm.endDate,
        availabilityForm.notes, 
        startTimeString, 
        endTimeString
      );
      } else {
        // Marcar un solo día como no disponible
        await markUnavailable(
          availabilityForm.date,
          availabilityForm.notes,
          startTimeString,
          endTimeString
        );
      }
      
      setShowAvailabilityModal(false);
      setAvailabilityForm({ date: '', endDate: '', isRange: false, isTimeRange: false, notes: '', start_time: '', end_time: '' });
      setAvailabilityStartTime({ hour: 10, minute: 0 });
      setAvailabilityEndTime({ hour: 12, minute: 0 });
      setEditingAvailability(null);
    } catch (error) {
      console.error('Error guardando disponibilidad:', error);
      alert('Error al guardar la disponibilidad. Por favor, inténtalo de nuevo.');
    }
  };

  const openAvailabilityModal = (day?: any) => {
    if (day) {
      setEditingAvailability(day);
      const hasTimeRange = day.start_time && day.end_time;
      setAvailabilityForm({
        date: day.date,
        endDate: '',
        isRange: false,
        isTimeRange: hasTimeRange,
        notes: day.notes || '',
        start_time: day.start_time || '',
        end_time: day.end_time || ''
      });
      
      // Parsear horas si existen
      if (day.start_time) {
        const [startHour, startMinute] = day.start_time.split(':').map(Number);
        setAvailabilityStartTime({ hour: startHour, minute: startMinute });
      } else {
        setAvailabilityStartTime({ hour: 10, minute: 0 });
      }
      if (day.end_time) {
        const [endHour, endMinute] = day.end_time.split(':').map(Number);
        setAvailabilityEndTime({ hour: endHour, minute: endMinute });
      } else {
        setAvailabilityEndTime({ hour: 12, minute: 0 });
      }
      setRangeStartDate(null);
      setRangeEndDate(null);
    } else {
      setEditingAvailability(null);
      setAvailabilityForm({ date: '', endDate: '', isRange: false, isTimeRange: false, notes: '', start_time: '', end_time: '' });
      setAvailabilityStartTime({ hour: 10, minute: 0 });
      setAvailabilityEndTime({ hour: 12, minute: 0 });
      setRangeStartDate(null);
      setRangeEndDate(null);
    }
    setShowAvailabilityModal(true);
  };
  
  const handleDeleteUnavailable = async (date: string) => {
    if (confirm(`¿Estás seguro de que quieres hacer este día disponible de nuevo?`)) {
      try {
        await removeUnavailable(date);
      } catch (error) {
        console.error('Error eliminando día no disponible:', error);
        alert('Error al eliminar. Por favor, inténtalo de nuevo.');
      }
    }
  };

  // Funciones para horarios ocupados
  const handleOccupiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!occupiedForm.date || !occupiedForm.event_name) {
      alert('Por favor, completa la fecha y el nombre del evento');
      return;
    }
    
    // Validar que la hora de fin sea después de la hora de inicio
    const startMinutes = occupiedStartTime.hour * 60 + occupiedStartTime.minute;
    const endMinutes = occupiedEndTime.hour * 60 + occupiedEndTime.minute;
    
    if (endMinutes <= startMinutes) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }
    
    try {
      const startTimeString = `${occupiedStartTime.hour.toString().padStart(2, '0')}:${occupiedStartTime.minute.toString().padStart(2, '0')}:00`;
      const endTimeString = `${occupiedEndTime.hour.toString().padStart(2, '0')}:${occupiedEndTime.minute.toString().padStart(2, '0')}:00`;
      
      if (editingOccupied) {
        // Si estamos editando, eliminar el anterior y crear uno nuevo
        await removeOccupiedSlot(editingOccupied.id);
      }
      
      await addOccupiedSlot(
        occupiedForm.date,
        startTimeString,
        endTimeString,
        occupiedForm.event_name,
        occupiedForm.notes
      );
      
      // Refrescar la lista
      await refetchOccupiedSlots();
      
      setShowOccupiedModal(false);
      setOccupiedForm({ date: '', start_time: '', end_time: '', event_name: '', notes: '' });
      setOccupiedStartTime({ hour: 18, minute: 0 });
      setOccupiedEndTime({ hour: 22, minute: 0 });
      setEditingOccupied(null);
      setSelectedOccupiedDate(null);
    } catch (error) {
      console.error('Error guardando horario ocupado:', error);
      alert('Error al guardar el horario ocupado. Por favor, inténtalo de nuevo.');
    }
  };

  const openOccupiedModal = (slot?: any) => {
    if (slot) {
      setEditingOccupied(slot);
      setOccupiedForm({
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        event_name: slot.event_name,
        notes: slot.notes || ''
      });
      
      // Parsear fecha y horas
      if (slot.date) {
        setSelectedOccupiedDate(new Date(slot.date));
      }
      
      // Parsear horas (formato HH:MM:SS o HH:MM)
      if (slot.start_time) {
        const startParts = slot.start_time.split(':');
        const startHour = parseInt(startParts[0]);
        const startMinute = parseInt(startParts[1]) || 0;
        setOccupiedStartTime({ hour: startHour, minute: startMinute });
      }
      if (slot.end_time) {
        const endParts = slot.end_time.split(':');
        const endHour = parseInt(endParts[0]);
        const endMinute = parseInt(endParts[1]) || 0;
        setOccupiedEndTime({ hour: endHour, minute: endMinute });
      }
    } else {
      setEditingOccupied(null);
      setOccupiedForm({ date: '', start_time: '', end_time: '', event_name: '', notes: '' });
      setOccupiedStartTime({ hour: 18, minute: 0 });
      setOccupiedEndTime({ hour: 22, minute: 0 });
      setSelectedOccupiedDate(null);
    }
    setShowOccupiedModal(true);
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
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return 'Pendiente';
    }
  };

  // Función para cambiar contraseña
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Por favor, completa todos los campos');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      // Limpiar formulario y cerrar modal
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
      alert('Contraseña cambiada correctamente');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Prevenir scroll horizontal al montar
  useEffect(() => {
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.maxWidth = '100vw';
    document.body.style.maxWidth = '100vw';
    
    return () => {
      document.documentElement.style.overflowX = '';
      document.body.style.overflowX = '';
      document.documentElement.style.maxWidth = '';
      document.body.style.maxWidth = '';
    };
  }, []);

  // Filtrar eventos según el filtro seleccionado (solo para eventos confirmados, no facturados)
  const filteredEvents = occupiedSlots.filter((slot) => {
    if (slot.is_invoiced) return false; // Los facturados no aparecen aquí
    const eventDate = new Date(`${slot.date}T${slot.end_time || slot.start_time}`);
    const now = new Date();
    
    switch (eventFilter) {
      case 'upcoming':
        return eventDate >= now;
      case 'past':
        return eventDate < now;
      default:
        return true;
    }
  });
  
  // Eventos facturados (para la pestaña de facturación)
  const invoicedEvents = occupiedSlots.filter(slot => slot.is_invoiced === true);
  
  // Función para añadir factura independiente
  const handleAddStandaloneInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceForm.description || !invoiceForm.method || !invoiceForm.amount) {
      alert('Por favor, completa todos los campos requeridos');
      return;
    }
    
    const amount = parseFloat(invoiceForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, ingresa un monto válido');
      return;
    }
    
    try {
      await addInvoice(
        invoiceForm.description,
        invoiceForm.method,
        amount,
        invoiceForm.invoiceDate,
        invoiceForm.invoiceNumber || undefined,
        invoiceForm.notes || undefined
      );
      
      setShowAddStandaloneInvoiceModal(false);
      const today = new Date();
      setSelectedInvoiceDate(today);
      setInvoiceForm({
        method: '',
        amount: '',
        invoiceDate: today.toISOString().split('T')[0],
        notes: '',
        description: '',
        invoiceNumber: ''
      });
      
      alert('Factura añadida correctamente.');
    } catch (error) {
      console.error('Error añadiendo factura:', error);
      alert('Error al añadir la factura. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para abrir modal de facturación
  const openInvoiceModal = (slot: OccupiedSlot) => {
    setSelectedEventForInvoice(slot);
    if (slot.is_invoiced) {
      // Si ya está facturado, cargar los datos
      const invoiceDate = slot.invoice_date ? new Date(slot.invoice_date) : new Date();
      setSelectedInvoiceDate(invoiceDate);
      setInvoiceForm({
        method: slot.invoice_method || '',
        amount: slot.invoice_amount?.toString() || '',
        invoiceDate: slot.invoice_date || new Date().toISOString().split('T')[0],
        notes: slot.invoice_notes || '',
        description: '',
        invoiceNumber: ''
      });
    } else {
      // Si no está facturado, resetear el formulario
      const today = new Date();
      setSelectedInvoiceDate(today);
      setInvoiceForm({
        method: '',
        amount: '',
        invoiceDate: today.toISOString().split('T')[0],
        notes: '',
        description: '',
        invoiceNumber: ''
      });
    }
    setShowInvoiceModal(true);
  };

  // Función para manejar el guardado de facturación
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEventForInvoice) return;
    
    if (!invoiceForm.method || !invoiceForm.amount) {
      alert('Por favor, completa el método de facturación y el monto');
      return;
    }
    
    const amount = parseFloat(invoiceForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, ingresa un monto válido');
      return;
    }
    
    try {
      await markAsInvoiced(
        selectedEventForInvoice.id,
        invoiceForm.method,
        amount,
        invoiceForm.invoiceDate,
        invoiceForm.notes || undefined
      );
      
      setShowInvoiceModal(false);
      setSelectedEventForInvoice(null);
      const today = new Date();
      setSelectedInvoiceDate(today);
      setInvoiceForm({
        method: '',
        amount: '',
        invoiceDate: today.toISOString().split('T')[0],
        notes: '',
        description: '',
        invoiceNumber: ''
      });
    } catch (error) {
      console.error('Error guardando facturación:', error);
      alert('Error al guardar la facturación. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para añadir evento facturado manualmente
  const handleAddInvoicedEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!occupiedForm.date || !occupiedForm.event_name || !invoiceForm.method || !invoiceForm.amount) {
      alert('Por favor, completa todos los campos requeridos');
      return;
    }
    
    const amount = parseFloat(invoiceForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, ingresa un monto válido');
      return;
    }
    
    try {
      const startTimeString = `${occupiedStartTime.hour.toString().padStart(2, '0')}:${occupiedStartTime.minute.toString().padStart(2, '0')}:00`;
      const endTimeString = `${occupiedEndTime.hour.toString().padStart(2, '0')}:${occupiedEndTime.minute.toString().padStart(2, '0')}:00`;
      
      // Crear el evento directamente con datos de facturación
      await addOccupiedSlot(
        occupiedForm.date,
        startTimeString,
        endTimeString,
        occupiedForm.event_name,
        occupiedForm.notes,
        true, // isInvoiced
        {
          method: invoiceForm.method,
          amount: amount,
          invoiceDate: invoiceForm.invoiceDate,
          notes: invoiceForm.notes || undefined
        }
      );
      
      setShowAddInvoicedModal(false);
      setOccupiedForm({ date: '', start_time: '', end_time: '', event_name: '', notes: '' });
      setOccupiedStartTime({ hour: 18, minute: 0 });
      setOccupiedEndTime({ hour: 22, minute: 0 });
      setSelectedOccupiedDate(null);
      const today = new Date();
      setSelectedInvoiceDate(today);
      setInvoiceForm({
        method: '',
        amount: '',
        invoiceDate: today.toISOString().split('T')[0],
        notes: '',
        description: '',
        invoiceNumber: ''
      });
      
      alert('Evento facturado añadido correctamente.');
    } catch (error) {
      console.error('Error añadiendo evento facturado:', error);
      alert('Error al añadir el evento facturado. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className={`${styles.adminRoot} relative min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50 py-3 sm:py-8 overflow-x-hidden w-full`}>
      {/* Header - Fuera del contenedor con padding para que esté centrado */}
      <div className={`w-full ${styles.adminHeaderWrapper}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center mb-6 sm:mb-12 px-4 ${styles.adminHeaderContainer}`}
        >
          <h1 className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 mb-2 sm:mb-4 leading-tight ${styles.adminTitle}`}>
            Panel de Administración
          </h1>
          <p className="text-gray-700 text-sm sm:text-lg md:text-xl max-w-3xl sm:max-w-4xl mx-auto leading-relaxed font-light">
            Gestiona todas las reservas y disponibilidad de Frantana
          </p>
        </motion.div>
      </div>
      
      <div className={`w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 ${styles.adminContentWrapper} overflow-x-hidden`}>

        {/* Tabs */}
        <div className="flex justify-center mb-6 sm:mb-8 w-full">
          <div className="bg-white rounded-xl p-1 sm:p-2 shadow-lg w-full max-w-4xl">
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${styles.adminTabBtn} px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-xs sm:text-base text-center ${
                  activeTab === 'bookings'
                    ? styles.adminTabActive
                    : styles.adminTabInactive
                }`}
              >
                Reservas ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`${styles.adminTabBtn} px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-xs sm:text-base text-center ${
                  activeTab === 'availability'
                    ? styles.adminTabActive
                    : styles.adminTabInactive
                }`}
              >
                Disponibilidad ({availability.length})
              </button>
              <button
                onClick={() => setActiveTab('occupied')}
                className={`${styles.adminTabBtn} px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-xs sm:text-base text-center ${
                  activeTab === 'occupied'
                    ? styles.adminTabActive
                    : styles.adminTabInactive
                }`}
              >
                Eventos ({filteredEvents.length + occupiedSlots.filter(s => s.is_invoiced).length})
              </button>
              <button
                onClick={() => setActiveTab('invoicing')}
                className={`${styles.adminTabBtn} px-2 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-xs sm:text-base text-center ${
                  activeTab === 'invoicing'
                    ? styles.adminTabActive
                    : styles.adminTabInactive
                }`}
              >
                Facturación ({invoicedEvents.length + invoices.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8"
        >
          {activeTab === 'bookings' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">Gestión de Reservas</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-2 text-center sm:text-left">
                    Gestiona las solicitudes de reservas: aprueba o rechaza reservas pendientes y revisa el historial de todas las reservas procesadas.
                  </p>
                </div>
              </div>
              
              {/* Sub-pestañas de filtro */}
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                <button
                  onClick={() => setBookingFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                    bookingFilter === 'pending'
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  Pendientes ({bookings.filter(b => b.status === 'pending').length})
                </button>
                <button
                  onClick={() => setBookingFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                    bookingFilter === 'approved'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Aprobadas ({bookings.filter(b => b.status === 'approved').length})
                </button>
                <button
                  onClick={() => setBookingFilter('rejected')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                    bookingFilter === 'rejected'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Rechazadas ({bookings.filter(b => b.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setBookingFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                    bookingFilter === 'all'
                      ? 'bg-gray-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas ({bookings.length})
                </button>
              </div>
              
              {bookingsLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="login-spinner dark mx-auto"></div>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 w-full max-w-full overflow-x-hidden">
                  {bookings
                    .filter(booking => {
                      if (bookingFilter === 'all') return true;
                      return booking.status === bookingFilter;
                    })
                    .map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 ${styles.bookingCardContainer}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                            {booking.event_name}
                          </h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-pink-500 flex-shrink-0" />
                              <span className="text-gray-600">
                                {new Date(booking.event_date).toLocaleDateString('es-ES', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-pink-500 flex-shrink-0" />
                              <span className="text-gray-600">{booking.event_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-pink-500 flex-shrink-0" />
                              <span className="text-gray-600">{booking.client_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-pink-500 flex-shrink-0" />
                              <span className="text-gray-600">{booking.client_phone}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <Mail className="w-4 h-4 text-pink-500 flex-shrink-0" />
                              <span className="text-gray-600 break-all">{booking.client_email}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
                              <span className="text-gray-600">{booking.event_location}</span>
                            </div>
                          </div>
                          
                          {booking.special_requests && (
                            <div className="mt-3 p-2 sm:p-3 bg-gray-100 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>Solicitudes:</strong> {booking.special_requests}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-row gap-2 items-center justify-center mt-4 px-2 flex-wrap w-full max-w-full overflow-x-hidden">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-1.5 flex-shrink-0 whitespace-nowrap shadow-md hover:shadow-lg"
                              style={{ 
                                padding: '0.5rem 1rem',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>Aprobar/Rechazar</span>
                            </button>
                          )}
                          {booking.status === 'approved' && (
                            <button
                              onClick={async () => {
                                try {
                                  // Validar datos
                                  if (!booking.event_date || !booking.event_time) {
                                    alert('Error: La reserva no tiene fecha u hora válida.');
                                    return;
                                  }
                                  
                                  // Verificar si ya existe en eventos confirmados
                                  const timeParts = booking.event_time.split(':');
                                  const hour = parseInt(timeParts[0]);
                                  const minute = timeParts.length > 1 ? parseInt(timeParts[1]) || 0 : 0;
                                  const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                                  const endHour = hour + 2;
                                  const endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                                  
                                  console.log('Verificando si existe:', {
                                    date: booking.event_date,
                                    startTime,
                                    eventName: booking.event_name || `Reserva de ${booking.client_name}`
                                  });
                                  
                                  // Refrescar primero para tener la lista actualizada
                                  await refetchOccupiedSlots();
                                  
                                  const alreadyExists = occupiedSlots.some(slot => 
                                    slot.date === booking.event_date && 
                                    slot.start_time === startTime &&
                                    slot.event_name === (booking.event_name || `Reserva de ${booking.client_name}`)
                                  );
                                  
                                  if (alreadyExists) {
                                    alert('Este evento ya está en eventos confirmados.');
                                    return;
                                  }
                                  
                                  if (confirm(`¿Añadir esta reserva aprobada a eventos confirmados?\n\nFecha: ${booking.event_date}\nHora: ${startTime} - ${endTime}\nEvento: ${booking.event_name || `Reserva de ${booking.client_name}`}`)) {
                                    const eventName = booking.event_name || `Reserva de ${booking.client_name}`;
                                    const occupiedNotes = `Reserva aprobada.\nCliente: ${booking.client_name}\nTel: ${booking.client_phone}\nEmail: ${booking.client_email}${booking.event_location ? `\nUbicación: ${booking.event_location}` : ''}`;
                                    
                                    console.log('Intentando añadir:', {
                                      date: booking.event_date,
                                      startTime,
                                      endTime,
                                      eventName,
                                      notes: occupiedNotes
                                    });
                                    
                                    await addOccupiedSlot(
                                      booking.event_date,
                                      startTime,
                                      endTime,
                                      eventName,
                                      occupiedNotes
                                    );
                                    
                                    console.log('Esperando 500ms antes de refrescar...');
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    
                                    await refetchOccupiedSlots();
                                    
                                    console.log('Verificando después de refrescar, total:', occupiedSlots.length);
                                    
                                    alert('Reserva añadida a eventos confirmados. Verifica la pestaña "Eventos Confirmados".');
                                  }
                                } catch (error) {
                                  console.error('Error completo:', error);
                                  alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}\n\nRevisa la consola para más detalles.`);
                                }
                              }}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-1.5 flex-shrink-0 whitespace-nowrap shadow-md hover:shadow-lg"
                              style={{ 
                                padding: '0.5rem 1rem',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>Añadir a Eventos</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {bookings
                    .filter(booking => {
                      if (bookingFilter === 'all') return true;
                      return booking.status === bookingFilter;
                    }).length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg sm:text-xl">
                        {bookingFilter === 'pending' && 'No hay reservas pendientes'}
                        {bookingFilter === 'approved' && 'No hay reservas aprobadas'}
                        {bookingFilter === 'rejected' && 'No hay reservas rechazadas'}
                        {bookingFilter === 'all' && 'No hay reservas'}
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        {bookingFilter === 'pending' && 'Todas las reservas han sido procesadas'}
                        {bookingFilter === 'approved' && 'Aún no se han aprobado reservas'}
                        {bookingFilter === 'rejected' && 'Aún no se han rechazado reservas'}
                        {bookingFilter === 'all' && 'No hay reservas en el sistema'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">Días NO Disponibles</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-2 text-center sm:text-left">
                    Marca días o rangos de días como NO disponibles. Todos los demás días estarán disponibles por defecto. Puedes marcar todo el día o solo un rango de horas específico.
                  </p>
                </div>
                <button
                  onClick={() => openAvailabilityModal()}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Marcar NO Disponible</span>
                  <span className="sm:hidden">Nueva</span>
                </button>
              </div>
              
              {availabilityLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="login-spinner dark mx-auto"></div>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {availability.map((day) => (
                    <motion.div
                      key={day.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4 sm:p-5 border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-red-50 to-rose-50"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 flex-shrink-0 text-red-600" />
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                              {new Date(day.date).toLocaleDateString('es-ES', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </h3>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-semibold">
                                <XCircle className="w-4 h-4" />
                                No Disponible
                            </span>
                            {day.start_time && day.end_time ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold">
                                <Clock className="w-4 h-4" />
                                Solo {day.start_time.substring(0, 5)} - {day.end_time.substring(0, 5)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full text-sm font-semibold">
                                Todo el día
                              </span>
                            )}
                          </div>
                          
                          {day.notes && (
                            <div className="mt-3 p-3 bg-white/70 rounded-lg border border-gray-200 shadow-sm">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                <strong className="text-gray-900">Notas:</strong> {day.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-end w-full">
                          <button
                            onClick={() => openAvailabilityModal(day)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUnavailable(day.date)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                            title="Hacer disponible"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {availability.length === 0 && (
                    <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-gray-200">
                      <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg sm:text-xl font-medium mb-2">No hay días marcados como no disponibles</p>
                      <p className="text-gray-500 text-sm sm:text-base">Todos los días están disponibles. Haz clic en "Marcar NO Disponible" para bloquear días o rangos.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'occupied' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">
                    Eventos Confirmados
                    {eventFilter === 'upcoming' && ` (Futuros: ${filteredEvents.length})`}
                    {eventFilter === 'past' && ` (Pasados: ${filteredEvents.length})`}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-2 text-center sm:text-left">
                    {eventFilter === 'upcoming' && 'Eventos futuros confirmados. Se añaden automáticamente al aprobar reservas.'}
                    {eventFilter === 'past' && 'Eventos pasados que aún no han sido facturados.'}
                  </p>
                  {occupiedLoading && (
                    <p className="text-sm text-orange-600 mt-2">Cargando eventos...</p>
                  )}
                  {!occupiedLoading && occupiedSlots.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-yellow-800">
                        <strong>No hay eventos confirmados.</strong> Si tienes reservas aprobadas, usa el botón "Añadir a Eventos" en la pestaña de Reservas para añadirlas manualmente.
                      </p>
                      <p className="text-xs text-yellow-700 mt-2">
                        Revisa la consola del navegador (F12) para ver logs de depuración.
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openOccupiedModal()}
                  className={`px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm ${styles.adminNewBtn}`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Añadir Evento</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              </div>
              
              {/* Filtros de eventos */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={() => setEventFilter('upcoming')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                    eventFilter === 'upcoming'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  📅 Futuros ({occupiedSlots.filter(s => {
                    const eventDate = new Date(`${s.date}T${s.end_time || s.start_time}`);
                    return eventDate >= new Date() && !s.is_invoiced;
                  }).length})
                </button>
                <button
                  onClick={() => setEventFilter('past')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                    eventFilter === 'past'
                      ? 'bg-gray-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📋 Pasados ({occupiedSlots.filter(s => {
                    const eventDate = new Date(`${s.date}T${s.end_time || s.start_time}`);
                    return eventDate < new Date() && !s.is_invoiced;
                  }).length})
                </button>
              </div>
              
              {/* Cuadro explicativo de diferencias */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-2">¿Cuál es la diferencia?</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold">📅 Días NO Disponibles:</span>
                        <span>Bloquea días o rangos para que <strong>NO se puedan reservar</strong>. Útil para vacaciones, días de descanso, o bloquear rangos horarios específicos.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold">✅ Eventos Confirmados:</span>
                        <span>Eventos que <strong>YA están confirmados</strong>. Se añaden automáticamente al aprobar reservas, o puedes añadirlos manualmente para eventos privados, mantenimientos, etc.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {occupiedLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2 sm:mt-4 text-sm sm:text-base">Cargando eventos confirmados...</p>
                </div>
              ) : occupiedSlots.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg sm:text-xl mb-2">No hay eventos confirmados</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Los eventos confirmados aparecerán aquí cuando apruebes reservas o añadas eventos manualmente.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
                    <p className="text-sm text-blue-800 font-semibold mb-2">💡 Para añadir eventos:</p>
                    <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Ve a la pestaña "Reservas"</li>
                      <li>Encuentra una reserva aprobada</li>
                      <li>Haz clic en "Añadir a Eventos"</li>
                    </ol>
                  </div>
                  <button
                    onClick={async () => {
                      console.log('Refrescando manualmente...');
                      await refetchOccupiedSlots();
                      alert(`Eventos encontrados: ${occupiedSlots.length}\n\nRevisa la consola (F12) para ver los detalles.`);
                    }}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    🔄 Refrescar Lista
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 w-full max-w-full overflow-x-hidden">
                  {filteredEvents.map((slot) => {
                    const eventDate = new Date(`${slot.date}T${slot.end_time || slot.start_time}`);
                    const isPast = eventDate < new Date();
                    
                    return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-3 sm:p-4 border border-orange-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-orange-800 mb-2">
                            {slot.event_name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              <span className="text-orange-700">
                                {new Date(slot.date).toLocaleDateString('es-ES', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              <span className="text-orange-700 font-semibold">
                                {slot.start_time} - {slot.end_time}
                              </span>
                            </div>
                          </div>
                          {slot.notes && (
                            <div className="mt-3 p-2 sm:p-3 bg-orange-100 rounded-lg">
                              <p className="text-sm text-orange-800">
                                <strong>Notas:</strong> {slot.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              slot.is_invoiced 
                                ? 'text-purple-600 bg-purple-100' 
                                : isPast 
                                ? 'text-gray-600 bg-gray-100' 
                                : 'text-orange-600 bg-orange-100'
                            }`}>
                              {slot.is_invoiced ? '💰 Facturado' : isPast ? '📋 Pasado' : '✅ Confirmado'}
                            </span>
                            {slot.is_invoiced && (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold text-green-600 bg-green-100 whitespace-nowrap">
                                {slot.invoice_method} - €{slot.invoice_amount?.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                            <button
                              onClick={() => {
                                // Generar fecha de inicio y fin
                                const startDate = new Date(`${slot.date}T${slot.start_time}`);
                                const endDate = new Date(`${slot.date}T${slot.end_time}`);
                                
                                // Si la hora de fin es anterior a la de inicio, significa que cruza medianoche
                                if (endDate <= startDate) {
                                  endDate.setDate(endDate.getDate() + 1);
                                }
                                
                                // Crear URL para descargar el .ics
                                const params = new URLSearchParams({
                                  title: slot.event_name,
                                  description: slot.notes || `Evento confirmado: ${slot.event_name}`,
                                  location: '',
                                  startDate: startDate.toISOString(),
                                  endDate: endDate.toISOString(),
                                  organizerName: 'Frantana',
                                  organizerEmail: 'info@frantana.com',
                                });
                                
                                window.open(`/api/calendar-event?${params.toString()}`, '_blank');
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg font-semibold"
                              title="Añadir este evento a tu calendario (iPhone, Google Calendar, Outlook, etc.)"
                            >
                              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="text-sm sm:text-base">Añadir al Calendario</span>
                            </button>
                            {!slot.is_invoiced && isPast && (
                              <button
                                onClick={() => openInvoiceModal(slot)}
                                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                title="Marcar como facturado"
                              >
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs sm:text-sm font-semibold">Facturar</span>
                              </button>
                            )}
                            {slot.is_invoiced && (
                              <button
                                onClick={() => openInvoiceModal(slot)}
                                className="px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                title="Ver/Editar facturación"
                              >
                                <Receipt className="w-4 h-4" />
                                <span className="text-xs sm:text-sm font-semibold">Ver Factura</span>
                              </button>
                            )}
                            {!slot.is_invoiced && (
                              <>
                                <button
                                  onClick={() => openOccupiedModal(slot)}
                                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                  title="Editar evento"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span className="text-xs sm:text-sm font-semibold">Editar</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`¿Estás seguro de que quieres eliminar el evento confirmado "${slot.event_name}"? Esto liberará ese horario para nuevas reservas.`)) {
                                      try {
                                        await removeOccupiedSlot(slot.id);
                                      } catch (error) {
                                        console.error('Error eliminando evento confirmado:', error);
                                        alert('Error al eliminar el evento. Por favor, inténtalo de nuevo.');
                                      }
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                  title="Eliminar evento"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span className="text-xs sm:text-sm font-semibold">Eliminar</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {slot.is_invoiced && (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-semibold text-purple-800">Método:</span>{' '}
                              <span className="text-purple-700">{slot.invoice_method}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-purple-800">Monto:</span>{' '}
                              <span className="text-purple-700">€{slot.invoice_amount?.toFixed(2)}</span>
                            </div>
                            {slot.invoice_date && (
                              <div>
                                <span className="font-semibold text-purple-800">Fecha factura:</span>{' '}
                                <span className="text-purple-700">
                                  {new Date(slot.invoice_date).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                            )}
                            {slot.invoice_notes && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-purple-800">Notas:</span>{' '}
                                <span className="text-purple-700">{slot.invoice_notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                    );
                  })}
                  
                  {filteredEvents.length === 0 && occupiedSlots.length > 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg sm:text-xl font-medium mb-2">
                        {eventFilter === 'upcoming' && 'No hay eventos futuros'}
                        {eventFilter === 'past' && 'No hay eventos pasados sin facturar'}
                      </p>
                      <p className="text-gray-500 text-sm sm:text-base">
                        {eventFilter === 'upcoming' && 'Los eventos futuros aparecerán aquí cuando apruebes reservas o añadas eventos manualmente.'}
                        {eventFilter === 'past' && 'Los eventos pasados aparecerán aquí una vez que hayan ocurrido y aún no hayan sido facturados.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoicing' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">
                    Facturación ({invoicedEvents.length + invoices.length})
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-2 text-center sm:text-left">
                    Control de eventos facturados. Aquí puedes ver todos los eventos que han sido facturados y añadir eventos facturados manualmente.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-end w-full">
                  <button
                    onClick={() => setShowAddInvoicedModal(true)}
                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    <Receipt className="w-4 h-4" />
                    <span className="hidden sm:inline">Añadir Evento Facturado</span>
                    <span className="sm:hidden">Evento</span>
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      setSelectedInvoiceDate(today);
                      setInvoiceForm({
                        method: '',
                        amount: '',
                        invoiceDate: today.toISOString().split('T')[0],
                        notes: '',
                        description: '',
                        invoiceNumber: ''
                      });
                      setShowAddStandaloneInvoiceModal(true);
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Añadir Factura</span>
                    <span className="sm:hidden">Factura</span>
                  </button>
                </div>
              </div>
              
              {/* Cuadro informativo */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-purple-900 mb-2">Control de Facturación</h3>
                    <div className="space-y-2 text-sm text-purple-800">
                      <p>En esta sección puedes:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Ver todos los eventos facturados con sus detalles de facturación</li>
                        <li>Añadir eventos facturados manualmente (eventos facturados fuera del sistema)</li>
                        <li>Añadir facturas independientes (no asociadas a eventos)</li>
                        <li>Editar la información de facturación de eventos existentes</li>
                        <li>Llevar un control completo de tus ingresos por evento</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {occupiedLoading || invoicesLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2 sm:mt-4 text-sm sm:text-base">Cargando facturación...</p>
                </div>
              ) : invoicedEvents.length === 0 && invoices.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Receipt className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg sm:text-xl mb-2">No hay facturas</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Puedes añadir facturas de eventos o facturas independientes usando los botones de arriba.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Eventos Facturados */}
                  {invoicedEvents.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Eventos Facturados ({invoicedEvents.length})</h3>
                      <div className="grid gap-3 sm:gap-4 w-full max-w-full overflow-x-hidden">
                        {invoicedEvents.map((slot) => (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 border border-purple-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="flex-1">
                                <h3 className="text-lg sm:text-xl font-bold text-purple-800 mb-2">
                                  {slot.event_name}
                                </h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <span className="text-purple-700">
                                      {new Date(slot.date).toLocaleDateString('es-ES', { 
                                        weekday: 'short', 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <span className="text-purple-700 font-semibold">
                                      {slot.start_time} - {slot.end_time}
                                    </span>
                                  </div>
                                </div>
                                {slot.notes && (
                                  <div className="mt-3 p-2 sm:p-3 bg-purple-100 rounded-lg">
                                    <p className="text-sm text-purple-800">
                                      <strong>Notas del evento:</strong> {slot.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold text-purple-600 bg-purple-100 whitespace-nowrap">
                                  💰 Facturado
                                </span>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                                  <button
                                    onClick={() => openInvoiceModal(slot)}
                                    className="px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                    title="Ver/Editar facturación"
                                  >
                                    <Receipt className="w-4 h-4" />
                                    <span className="text-xs sm:text-sm font-semibold">Editar</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-semibold text-purple-800">Método:</span>{' '}
                                  <span className="text-purple-700">{slot.invoice_method}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-purple-800">Monto:</span>{' '}
                                  <span className="text-purple-700 font-bold text-lg">€{slot.invoice_amount?.toFixed(2)}</span>
                                </div>
                                {slot.invoice_date && (
                                  <div>
                                    <span className="font-semibold text-purple-800">Fecha factura:</span>{' '}
                                    <span className="text-purple-700">
                                      {new Date(slot.invoice_date).toLocaleDateString('es-ES')}
                                    </span>
                                  </div>
                                )}
                                {slot.invoice_notes && (
                                  <div className="sm:col-span-2">
                                    <span className="font-semibold text-purple-800">Notas:</span>{' '}
                                    <span className="text-purple-700">{slot.invoice_notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Facturas Independientes */}
                  {invoices.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Facturas Independientes ({invoices.length})</h3>
                      <div className="grid gap-3 sm:gap-4 w-full max-w-full overflow-x-hidden">
                        {invoices.map((invoice) => (
                          <motion.div
                            key={invoice.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-3 sm:p-4 border border-green-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="flex-1">
                                <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-2">
                                  {invoice.description}
                                </h3>
                                {invoice.invoice_number && (
                                  <div className="mb-2">
                                    <span className="text-sm text-green-700 font-semibold">Nº Factura: </span>
                                    <span className="text-sm text-green-800">{invoice.invoice_number}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold text-green-600 bg-green-100 whitespace-nowrap">
                                  💰 Factura Independiente
                                </span>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                                  <button
                                    onClick={async () => {
                                      if (confirm(`¿Estás seguro de que quieres eliminar esta factura?`)) {
                                        try {
                                          await removeInvoice(invoice.id);
                                        } catch (error) {
                                          console.error('Error eliminando factura:', error);
                                          alert('Error al eliminar la factura. Por favor, inténtalo de nuevo.');
                                        }
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                    title="Eliminar factura"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span className="text-xs sm:text-sm font-semibold">Eliminar</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-semibold text-green-800">Método:</span>{' '}
                                  <span className="text-green-700">{invoice.invoice_method}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-green-800">Monto:</span>{' '}
                                  <span className="text-green-700 font-bold text-lg">€{invoice.invoice_amount.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-green-800">Fecha:</span>{' '}
                                  <span className="text-green-700">
                                    {new Date(invoice.invoice_date).toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                                {invoice.invoice_notes && (
                                  <div className="sm:col-span-2">
                                    <span className="font-semibold text-green-800">Notas:</span>{' '}
                                    <span className="text-green-700">{invoice.invoice_notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Botones de Acción */}
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl"
          >
            <Lock className="w-5 h-5" />
            <span>Cambiar contraseña</span>
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>

        {/* Modal para notas */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-x-hidden" style={{ left: 0, right: 0, top: 0, bottom: 0, maxWidth: '100vw', width: '100vw' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${styles.notesModal} bg-white rounded-xl overflow-hidden p-4`}
            >
              <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3" style={{ marginBottom: '0.75rem' }}>Gestionar Reserva</h3>
              <p className="text-sm text-gray-600 mb-3">
                {selectedBooking?.status === 'pending' && (
                  <>Si apruebas, se añadirá automáticamente a Horarios Ocupados y se enviará un email al cliente.</>
                )}
                {selectedBooking?.status !== 'pending' && (
                  <>Se enviará un email automático al cliente con la decisión.</>
                )}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border border-gray-300 rounded-lg text-sm resize-none"
                style={{ 
                  width: '100%',
                  maxWidth: '100%',
                  padding: '0.5rem',
                  marginBottom: '0.75rem',
                  boxSizing: 'border-box',
                  fontSize: '0.875rem'
                }}
                rows={3}
                placeholder="Añade notas sobre esta reserva..."
              />
              <div className="flex gap-2 mb-2" style={{ width: '100%', gap: '0.5rem', boxSizing: 'border-box', marginBottom: '0.5rem' }}>
                <button
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'approved')}
                  className="flex-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                  style={{ 
                    padding: '0.5rem 0.25rem',
                    boxSizing: 'border-box',
                    fontSize: '0.75rem'
                  }}
                >
                  Aprobar
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'rejected')}
                  className="flex-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                  style={{ 
                    padding: '0.5rem 0.25rem',
                    boxSizing: 'border-box',
                    fontSize: '0.75rem'
                  }}
                >
                  Rechazar
                </button>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ 
                  width: '100%',
                  padding: '0.5rem 0.25rem',
                  boxSizing: 'border-box',
                  fontSize: '0.75rem'
                }}
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}

        {/* Modal para disponibilidad */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-4 overflow-x-hidden" style={{ left: 0, right: 0, top: 0, bottom: 0, maxWidth: '100vw', width: '100vw' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-1 sm:mx-4"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingAvailability ? 'Editar Día NO Disponible' : 'Marcar Día(s) NO Disponible(s)'}
              </h3>
              <form onSubmit={handleAvailabilitySubmit} className="space-y-4 sm:space-y-6">
                {/* Toggle entre fecha única y rango */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className={`text-sm font-medium ${!availabilityForm.isRange ? 'text-gray-700' : 'text-gray-400'}`}>
                    Fecha Única
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newIsRange = !availabilityForm.isRange;
                      setAvailabilityForm({ 
                        ...availabilityForm, 
                        isRange: newIsRange,
                        endDate: newIsRange && availabilityForm.endDate ? availabilityForm.endDate : '',
                        isTimeRange: newIsRange ? false : availabilityForm.isTimeRange // Solo permitir rango horario en fecha única
                      });
                      // Limpiar selección de rango cuando cambia el modo
                      setRangeStartDate(null);
                      setRangeEndDate(null);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                      availabilityForm.isRange ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        availabilityForm.isRange ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${availabilityForm.isRange ? 'text-gray-700' : 'text-gray-400'}`}>
                    Rango de Fechas
                  </span>
                  </div>

                {/* Calendario de selección */}
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {availabilityForm.isRange ? 'Selecciona el rango de fechas' : 'Selecciona la fecha'}
                      </label>
                  
                  {/* Fechas seleccionadas */}
                  {(availabilityForm.date || (rangeStartDate && rangeEndDate)) && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            {availabilityForm.isRange ? 'Rango seleccionado:' : 'Fecha seleccionada:'}
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {availabilityForm.isRange && rangeStartDate && rangeEndDate
                              ? `${rangeStartDate.toLocaleDateString('es-ES')} - ${rangeEndDate.toLocaleDateString('es-ES')}`
                              : availabilityForm.date
                                ? new Date(availabilityForm.date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                : 'Aún no has seleccionado una fecha'
                            }
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calendario */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-7 gap-3 mb-4">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                          {day}
                        </div>
                      ))}
                      {(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentYear = today.getFullYear();
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                        // Convertir domingo (0) a 7 para que lunes sea el primer día
                        const firstDayAdjusted = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
                        // Calcular días del mes anterior a mostrar (lunes = 1, necesita 0 días anteriores)
                        const daysToShowFromPreviousMonth = firstDayAdjusted - 1;
                        const days = [];
                        
                        // Días del mes anterior
                        for (let i = daysToShowFromPreviousMonth - 1; i >= 0; i--) {
                          const day = new Date(currentYear, currentMonth, -i);
                          days.push({ date: day, isCurrentMonth: false, isDisabled: true });
                        }
                        
                        // Días del mes actual
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(currentYear, currentMonth, day);
                          const dateString = date.toISOString().split('T')[0] || '';
                          const isPast = date < today;
                          const isSelected = !availabilityForm.isRange 
                            ? availabilityForm.date === dateString
                            : rangeStartDate && rangeEndDate && date >= rangeStartDate && date <= rangeEndDate;
                          const isStart = rangeStartDate && date.toDateString() === rangeStartDate.toDateString();
                          const isEnd = rangeEndDate && date.toDateString() === rangeEndDate.toDateString();
                          const isInRange = rangeStartDate && rangeEndDate && date > rangeStartDate && date < rangeEndDate;
                          
                          days.push({ 
                            date, 
                            isCurrentMonth: true, 
                            isDisabled: isPast,
                            isSelected,
                            isStart,
                            isEnd,
                            isInRange,
                            dateString
                          });
                        }
                        
                        return days.map((day, index) => {
                          const handleDateClick = () => {
                            if (day.isDisabled || !day.dateString) return;
                            
                            if (!availabilityForm.isRange) {
                              // Fecha única
                              setAvailabilityForm({ ...availabilityForm, date: day.dateString });
                            } else {
                              // Modo rango
                              if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
                                // Iniciar nuevo rango
                                setRangeStartDate(day.date);
                                setRangeEndDate(null);
                                setAvailabilityForm({ ...availabilityForm, date: day.dateString, endDate: '' });
                              } else if (rangeStartDate && !rangeEndDate) {
                                // Completar rango
                                if (day.date < rangeStartDate) {
                                  // Si la fecha seleccionada es anterior, intercambiar
                                  const oldStart = rangeStartDate;
                                  setRangeEndDate(oldStart);
                                  setRangeStartDate(day.date);
                                  setAvailabilityForm({ 
                                    ...availabilityForm, 
                                    date: day.dateString, 
                                    endDate: oldStart.toISOString().split('T')[0] || ''
                                  });
                                } else {
                                  setRangeEndDate(day.date);
                                  setAvailabilityForm({ 
                                    ...availabilityForm, 
                                    endDate: day.dateString
                                  });
                                }
                              }
                            }
                          };
                          
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={handleDateClick}
                              disabled={day.isDisabled}
                              className={`py-3 text-sm rounded-lg transition-all duration-300 relative ${
                                day.isDisabled
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : day.isCurrentMonth
                                  ? 'text-gray-700 hover:bg-red-100 hover:scale-105'
                                  : 'text-gray-300'
                              } ${
                                day.isSelected || day.isStart || day.isEnd
                                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white scale-110 shadow-lg'
                                  : day.isInRange
                                  ? 'bg-red-200 text-red-800'
                                  : ''
                              }`}
                            >
                              {day.date.getDate()}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Opción de rango horario - Solo para fecha única */}
                {!availabilityForm.isRange && (
                  <>
                    <div>
                      <label className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={availabilityForm.isTimeRange}
                          onChange={(e) => setAvailabilityForm({ ...availabilityForm, isTimeRange: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Solo un rango de horas está no disponible (el resto del día estará disponible)</span>
                      </label>
                </div>

                    {availabilityForm.isTimeRange && (
                  <div className="space-y-4 sm:space-y-6">
                        <h4 className="text-lg font-semibold text-gray-700">Rango de Horas NO Disponible</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <h5 className="text-md font-medium text-gray-600 mb-3">Hora de Inicio</h5>
                        <TimePicker
                          initialHour={availabilityStartTime.hour}
                          initialMinute={availabilityStartTime.minute}
                          onTimeChange={(hour, minute) => setAvailabilityStartTime({ hour, minute })}
                        />
                      </div>
                      <div>
                        <h5 className="text-md font-medium text-gray-600 mb-3">Hora de Fin</h5>
                        <TimePicker
                          initialHour={availabilityEndTime.hour}
                          initialMinute={availabilityEndTime.minute}
                          onTimeChange={(hour, minute) => setAvailabilityEndTime({ hour, minute })}
                        />
                      </div>
                    </div>
                  </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                  <textarea
                    value={availabilityForm.notes}
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, notes: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Añade notas sobre esta fecha..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {editingAvailability ? 'Actualizar' : 'Marcar NO Disponible'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAvailabilityModal(false);
                      setEditingAvailability(null);
                      setAvailabilityForm({ date: '', endDate: '', isRange: false, isTimeRange: false, notes: '', start_time: '', end_time: '' });
                      setAvailabilityStartTime({ hour: 10, minute: 0 });
                      setAvailabilityEndTime({ hour: 12, minute: 0 });
                      setRangeStartDate(null);
                      setRangeEndDate(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal para horarios ocupados */}
        {showOccupiedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-4 overflow-x-hidden" style={{ left: 0, right: 0, top: 0, bottom: 0, maxWidth: '100vw', width: '100vw' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-1 sm:mx-4"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingOccupied ? 'Editar Evento Confirmado' : 'Añadir Evento Confirmado'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Añade un evento confirmado (como un mantenimiento, evento privado, etc.) que bloqueará ese horario para nuevas reservas.
              </p>
              <form onSubmit={handleOccupiedSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Evento</label>
                    <input
                      type="text"
                      value={occupiedForm.event_name}
                      onChange={(e) => setOccupiedForm({ ...occupiedForm, event_name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Ej: Boda de María y Juan"
                      required
                    />
                  </div>
                </div>
                
                {/* Calendario de selección de fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Fecha del Evento</label>
                  
                  {/* Fecha seleccionada */}
                  {selectedOccupiedDate && (
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Fecha seleccionada:</p>
                          <p className="text-lg font-bold text-gray-800">
                            {selectedOccupiedDate.toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calendario */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-7 gap-3 mb-4">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                          {day}
                        </div>
                      ))}
                      {(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentYear = today.getFullYear();
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                        // Convertir domingo (0) a 7 para que lunes sea el primer día
                        const firstDayAdjusted = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
                        // Calcular días del mes anterior a mostrar (lunes = 1, necesita 0 días anteriores)
                        const daysToShowFromPreviousMonth = firstDayAdjusted - 1;
                        const days = [];
                        
                        // Días del mes anterior
                        for (let i = daysToShowFromPreviousMonth - 1; i >= 0; i--) {
                          const day = new Date(currentYear, currentMonth, -i);
                          days.push({ date: day, isCurrentMonth: false, isDisabled: true });
                        }
                        
                        // Días del mes actual
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(currentYear, currentMonth, day);
                          const dateString = date.toISOString().split('T')[0] || '';
                          const isPast = date < today;
                          const isSelected = selectedOccupiedDate && date.toDateString() === selectedOccupiedDate.toDateString();
                          
                          days.push({ 
                            date, 
                            isCurrentMonth: true, 
                            isDisabled: isPast,
                            isSelected,
                            dateString
                          });
                        }
                        
                        return days.map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!day.isDisabled && day.dateString) {
                                setSelectedOccupiedDate(day.date);
                                setOccupiedForm({ ...occupiedForm, date: day.dateString });
                              }
                            }}
                            disabled={day.isDisabled}
                            className={`py-3 text-sm rounded-lg transition-all duration-300 relative ${
                              day.isDisabled
                                ? 'text-gray-200 cursor-not-allowed'
                                : day.isCurrentMonth
                                ? 'text-gray-700 hover:bg-orange-100 hover:scale-105'
                                : 'text-gray-300'
                            } ${
                              day.isSelected
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white scale-110 shadow-lg'
                                : ''
                            }`}
                          >
                            {day.date.getDate()}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <h4 className="text-lg font-semibold text-gray-700">Horarios del Evento</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h5 className="text-md font-medium text-gray-600 mb-3">Hora de Inicio</h5>
                      <TimePicker
                        initialHour={occupiedStartTime.hour}
                        initialMinute={occupiedStartTime.minute}
                        onTimeChange={(hour, minute) => setOccupiedStartTime({ hour, minute })}
                      />
                    </div>
                    <div>
                      <h5 className="text-md font-medium text-gray-600 mb-3">Hora de Fin</h5>
                      <TimePicker
                        initialHour={occupiedEndTime.hour}
                        initialMinute={occupiedEndTime.minute}
                        onTimeChange={(hour, minute) => setOccupiedEndTime({ hour, minute })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                  <textarea
                    value={occupiedForm.notes}
                    onChange={(e) => setOccupiedForm({ ...occupiedForm, notes: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                    placeholder="Añade notas sobre este evento..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                  >
                    {editingOccupied ? 'Actualizar Evento' : 'Añadir Evento'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOccupiedModal(false);
                      setEditingOccupied(null);
                      setOccupiedForm({ date: '', start_time: '', end_time: '', event_name: '', notes: '' });
                      setOccupiedStartTime({ hour: 18, minute: 0 });
                      setOccupiedEndTime({ hour: 22, minute: 0 });
                      setSelectedOccupiedDate(null);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal para facturación */}
        {showInvoiceModal && selectedEventForInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-x-hidden" style={{ left: 0, right: 0, top: 0, bottom: 0, maxWidth: '100vw', width: '100vw' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                {selectedEventForInvoice.is_invoiced ? 'Ver/Editar Facturación' : 'Marcar como Facturado'}
              </h3>
              <form onSubmit={handleInvoiceSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Facturación *
                  </label>
                  <select
                    value={invoiceForm.method}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, method: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un método</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Bizum">Bizum</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Fecha de Facturación</label>
                  
                  {/* Fecha seleccionada */}
                  {selectedInvoiceDate && (
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Fecha seleccionada:</p>
                          <p className="text-lg font-bold text-gray-800">
                            {selectedInvoiceDate.toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calendario */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-7 gap-3 mb-4">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                          {day}
                        </div>
                      ))}
                      {(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentYear = today.getFullYear();
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                        const firstDayAdjusted = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
                        const daysToShowFromPreviousMonth = firstDayAdjusted - 1;
                        const days = [];
                        
                        for (let i = daysToShowFromPreviousMonth - 1; i >= 0; i--) {
                          const day = new Date(currentYear, currentMonth, -i);
                          days.push({ date: day, isCurrentMonth: false, isDisabled: true });
                        }
                        
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(currentYear, currentMonth, day);
                          const dateString = date.toISOString().split('T')[0] || '';
                          const isSelected = selectedInvoiceDate && date.toDateString() === selectedInvoiceDate.toDateString();
                          
                          days.push({ 
                            date, 
                            isCurrentMonth: true, 
                            isDisabled: false,
                            isSelected,
                            dateString
                          });
                        }
                        
                        return days.map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!day.isDisabled && day.dateString) {
                                setSelectedInvoiceDate(day.date);
                                setInvoiceForm({ ...invoiceForm, invoiceDate: day.dateString });
                              }
                            }}
                            disabled={day.isDisabled}
                            className={`py-3 text-sm rounded-lg transition-all duration-300 relative ${
                              day.isDisabled
                                ? 'text-gray-200 cursor-not-allowed'
                                : day.isCurrentMonth
                                ? 'text-gray-700 hover:bg-purple-100 hover:scale-105'
                                : 'text-gray-300'
                            } ${
                              day.isSelected
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white scale-110 shadow-lg'
                                : ''
                            }`}
                          >
                            {day.date.getDate()}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Notas adicionales sobre la facturación..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                  >
                    {selectedEventForInvoice.is_invoiced ? 'Actualizar Facturación' : 'Marcar como Facturado'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setSelectedEventForInvoice(null);
                      const today = new Date();
                      setSelectedInvoiceDate(today);
                      setInvoiceForm({
                        method: '',
                        amount: '',
                        invoiceDate: today.toISOString().split('T')[0],
                        notes: '',
                        description: '',
                        invoiceNumber: ''
                      });
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal para añadir evento facturado manualmente */}
        {showAddInvoicedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-4 overflow-x-hidden" style={{ left: 0, right: 0, top: 0, bottom: 0, maxWidth: '100vw', width: '100vw' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-1 sm:mx-4"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Añadir Evento Facturado
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Añade un evento que ya fue facturado pero no estaba en el sistema. Útil para eventos que facturaste fuera de la plataforma.
              </p>
              <form onSubmit={handleAddInvoicedEvent} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Evento *</label>
                    <input
                      type="text"
                      value={occupiedForm.event_name}
                      onChange={(e) => setOccupiedForm({ ...occupiedForm, event_name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: Boda de María y Juan"
                      required
                    />
                  </div>
                </div>
                
                {/* Calendario de selección de fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Fecha del Evento *</label>
                  
                  {selectedOccupiedDate && (
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Fecha seleccionada:</p>
                          <p className="text-lg font-bold text-gray-800">
                            {selectedOccupiedDate.toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calendario */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-7 gap-3 mb-4">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                          {day}
                        </div>
                      ))}
                      {(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentYear = today.getFullYear();
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                        const firstDayAdjusted = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
                        const daysToShowFromPreviousMonth = firstDayAdjusted - 1;
                        const days = [];
                        
                        for (let i = daysToShowFromPreviousMonth - 1; i >= 0; i--) {
                          const day = new Date(currentYear, currentMonth, -i);
                          days.push({ date: day, isCurrentMonth: false, isDisabled: true });
                        }
                        
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(currentYear, currentMonth, day);
                          const dateString = date.toISOString().split('T')[0] || '';
                          const isSelected = selectedOccupiedDate && date.toDateString() === selectedOccupiedDate.toDateString();
                          
                          days.push({ 
                            date, 
                            isCurrentMonth: true, 
                            isDisabled: false,
                            isSelected,
                            dateString
                          });
                        }
                        
                        return days.map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!day.isDisabled && day.dateString) {
                                setSelectedOccupiedDate(day.date);
                                setOccupiedForm({ ...occupiedForm, date: day.dateString });
                              }
                            }}
                            disabled={day.isDisabled}
                            className={`py-3 text-sm rounded-lg transition-all duration-300 relative ${
                              day.isDisabled
                                ? 'text-gray-200 cursor-not-allowed'
                                : day.isCurrentMonth
                                ? 'text-gray-700 hover:bg-purple-100 hover:scale-105'
                                : 'text-gray-300'
                            } ${
                              day.isSelected
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white scale-110 shadow-lg'
                                : ''
                            }`}
                          >
                            {day.date.getDate()}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <h4 className="text-lg font-semibold text-gray-700">Horarios del Evento</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Inicio</label>
                      <TimePicker
                        initialHour={occupiedStartTime.hour}
                        initialMinute={occupiedStartTime.minute}
                        onTimeChange={(hour, minute) => setOccupiedStartTime({ hour, minute })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Fin</label>
                      <TimePicker
                        initialHour={occupiedEndTime.hour}
                        initialMinute={occupiedEndTime.minute}
                        onTimeChange={(hour, minute) => setOccupiedEndTime({ hour, minute })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                  <textarea
                    value={occupiedForm.notes}
                    onChange={(e) => setOccupiedForm({ ...occupiedForm, notes: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Notas sobre el evento..."
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Información de Facturación *</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Facturación *
                      </label>
                      <select
                        value={invoiceForm.method}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, method: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="">Selecciona un método</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia Bancaria</option>
                        <option value="Bizum">Bizum</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceForm.amount}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Fecha de Facturación</label>
                      
                      {/* Fecha seleccionada */}
                      {selectedInvoiceDate && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Fecha seleccionada:</p>
                              <p className="text-lg font-bold text-gray-800">
                                {selectedInvoiceDate.toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Calendario */}
                      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="grid grid-cols-7 gap-3 mb-4">
                          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                            <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                              {day}
                            </div>
                          ))}
                          {(() => {
                            const today = new Date();
                            const currentMonth = today.getMonth();
                            const currentYear = today.getFullYear();
                            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                            const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                            const firstDayAdjusted = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
                            const daysToShowFromPreviousMonth = firstDayAdjusted - 1;
                            const days = [];
                            
                            for (let i = daysToShowFromPreviousMonth - 1; i >= 0; i--) {
                              const day = new Date(currentYear, currentMonth, -i);
                              days.push({ date: day, isCurrentMonth: false, isDisabled: true });
                            }
                            
                            for (let day = 1; day <= daysInMonth; day++) {
                              const date = new Date(currentYear, currentMonth, day);
                              const dateString = date.toISOString().split('T')[0] || '';
                              const isSelected = selectedInvoiceDate && date.toDateString() === selectedInvoiceDate.toDateString();
                              
                              days.push({ 
                                date, 
                                isCurrentMonth: true, 
                                isDisabled: false,
                                isSelected,
                                dateString
                              });
                            }
                            
                            return days.map((day, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  if (!day.isDisabled && day.dateString) {
                                    setSelectedInvoiceDate(day.date);
                                    setInvoiceForm({ ...invoiceForm, invoiceDate: day.dateString });
                                  }
                                }}
                                disabled={day.isDisabled}
                                className={`py-3 text-sm rounded-lg transition-all duration-300 relative ${
                                  day.isDisabled
                                    ? 'text-gray-200 cursor-not-allowed'
                                    : day.isCurrentMonth
                                    ? 'text-gray-700 hover:bg-purple-100 hover:scale-105'
                                    : 'text-gray-300'
                                } ${
                                  day.isSelected
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white scale-110 shadow-lg'
                                    : ''
                                }`}
                              >
                                {day.date.getDate()}
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas de Facturación
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                  >
                    Añadir Evento Facturado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddInvoicedModal(false);
                      setOccupiedForm({ date: '', start_time: '', end_time: '', event_name: '', notes: '' });
                      setOccupiedStartTime({ hour: 18, minute: 0 });
                      setOccupiedEndTime({ hour: 22, minute: 0 });
                      setSelectedOccupiedDate(null);
                      const today = new Date();
                      setSelectedInvoiceDate(today);
                      setInvoiceForm({
                        method: '',
                        amount: '',
                        invoiceDate: today.toISOString().split('T')[0],
                        notes: '',
                        description: '',
                        invoiceNumber: ''
                      });
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal para añadir factura independiente */}
        {showAddStandaloneInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-x-hidden" style={{ left: 0, right: 0, top: 0, bottom: 0, maxWidth: '100vw', width: '100vw' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Añadir Factura Independiente
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Añade una factura que no está asociada a ningún evento del sistema.
              </p>
              <form onSubmit={handleAddStandaloneInvoice} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Venta de material, Servicio de consultoría, etc."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Factura (opcional)
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: FACT-2024-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Facturación *
                  </label>
                  <select
                    value={invoiceForm.method}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, method: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un método</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Bizum">Bizum</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Fecha de Facturación</label>
                  
                  {/* Fecha seleccionada */}
                  {selectedInvoiceDate && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Fecha seleccionada:</p>
                          <p className="text-lg font-bold text-gray-800">
                            {selectedInvoiceDate.toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calendario */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-7 gap-3 mb-4">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center text-sm font-bold text-gray-700 py-2">
                          {day}
                        </div>
                      ))}
                      {(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentYear = today.getFullYear();
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                        const firstDayAdjusted = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
                        const daysToShowFromPreviousMonth = firstDayAdjusted - 1;
                        const days = [];
                        
                        for (let i = daysToShowFromPreviousMonth - 1; i >= 0; i--) {
                          const day = new Date(currentYear, currentMonth, -i);
                          days.push({ date: day, isCurrentMonth: false, isDisabled: true });
                        }
                        
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(currentYear, currentMonth, day);
                          const dateString = date.toISOString().split('T')[0] || '';
                          const isSelected = selectedInvoiceDate && date.toDateString() === selectedInvoiceDate.toDateString();
                          
                          days.push({ 
                            date, 
                            isCurrentMonth: true, 
                            isDisabled: false,
                            isSelected,
                            dateString
                          });
                        }
                        
                        return days.map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!day.isDisabled && day.dateString) {
                                setSelectedInvoiceDate(day.date);
                                setInvoiceForm({ ...invoiceForm, invoiceDate: day.dateString });
                              }
                            }}
                            disabled={day.isDisabled}
                            className={`py-3 text-sm rounded-lg transition-all duration-300 relative ${
                              day.isDisabled
                                ? 'text-gray-200 cursor-not-allowed'
                                : day.isCurrentMonth
                                ? 'text-gray-700 hover:bg-green-100 hover:scale-105'
                                : 'text-gray-300'
                            } ${
                              day.isSelected
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white scale-110 shadow-lg'
                                : ''
                            }`}
                          >
                            {day.date.getDate()}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Notas adicionales sobre la facturación..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                  >
                    Añadir Factura
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStandaloneInvoiceModal(false);
                      const today = new Date();
                      setSelectedInvoiceDate(today);
                      setInvoiceForm({
                        method: '',
                        amount: '',
                        invoiceDate: today.toISOString().split('T')[0],
                        notes: '',
                        description: '',
                        invoiceNumber: ''
                      });
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal para cambiar contraseña */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-x-hidden" style={{ left: 0, right: 0, top: 0, bottom: 0, maxWidth: '100vw', width: '100vw' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Cambiar Contraseña
              </h3>
              <form onSubmit={handlePasswordChange} className="space-y-5">
                {/* Contraseña actual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ingresa tu contraseña actual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Nueva contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ingresa tu nueva contraseña (mín. 6 caracteres)"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar nueva contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full pl-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirma tu nueva contraseña"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Error message */}
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <p className="text-red-600 text-sm font-medium">{passwordError}</p>
                  </motion.div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
