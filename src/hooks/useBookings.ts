import { useState, useEffect } from 'react';
import { supabase, Booking, Availability, OccupiedSlot } from '@/lib/supabase';

export const useOccupiedSlots = () => {
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOccupiedSlots();
  }, []);

  const fetchOccupiedSlots = async () => {
    try {
      setLoading(true);
      // Quitar el filtro de fecha para mostrar todos los eventos (incluidos pasados)
      console.log('Fetching occupied slots (sin filtro de fecha)...');
      
      const { data, error } = await supabase
        .from('occupied_slots')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching occupied slots:', error);
        console.error('Detalles del error:', JSON.stringify(error, null, 2));
        setOccupiedSlots([]);
      } else {
        console.log('Occupied slots obtenidos:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('Primeros eventos:', data.slice(0, 3));
        } else {
          console.warn('No se encontraron eventos ocupados. Verifica que la tabla exista y tenga datos.');
        }
        setOccupiedSlots(data || []);
      }
    } catch (err) {
      console.error('Error fetching occupied slots:', err);
      setOccupiedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const addOccupiedSlot = async (date: string, startTime: string, endTime: string, eventName: string, notes?: string, isInvoiced?: boolean, invoiceData?: any) => {
    try {
      console.log('Insertando en occupied_slots:', { date, startTime, endTime, eventName, notes, isInvoiced, invoiceData });
      
      const insertData: any = {
        date,
        start_time: startTime,
        end_time: endTime,
        event_name: eventName,
        notes
      };
      
      // Si viene con datos de facturación, añadirlos
      if (isInvoiced && invoiceData) {
        insertData.is_invoiced = true;
        insertData.invoice_method = invoiceData.method;
        insertData.invoice_amount = invoiceData.amount;
        insertData.invoice_date = invoiceData.invoiceDate || new Date().toISOString().split('T')[0];
        if (invoiceData.notes) {
          insertData.invoice_notes = invoiceData.notes;
        }
      }
      
      const { data, error } = await supabase
        .from('occupied_slots')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Error de Supabase al insertar:', error);
        throw error;
      }
      
      console.log('Insertado correctamente:', data);
      await fetchOccupiedSlots();
      return data?.[0]; // Devolver el evento creado
    } catch (err) {
      console.error('Error completo en addOccupiedSlot:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al añadir';
      setError(errorMessage);
      throw err; // Re-lanzar el error para que se maneje arriba
    }
  };

  const removeOccupiedSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('occupied_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchOccupiedSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const updateOccupiedSlot = async (id: string, updates: Partial<OccupiedSlot>) => {
    try {
      const { error } = await supabase
        .from('occupied_slots')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchOccupiedSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      throw err;
    }
  };

  const markAsInvoiced = async (id: string, method: string, amount: number, invoiceDate?: string, invoiceNotes?: string) => {
    try {
      const updates: any = {
        is_invoiced: true,
        invoice_method: method,
        invoice_amount: amount,
        invoice_date: invoiceDate || new Date().toISOString().split('T')[0]
      };
      
      if (invoiceNotes) {
        updates.invoice_notes = invoiceNotes;
      }
      
      await updateOccupiedSlot(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como facturado');
      throw err;
    }
  };

  return { 
    occupiedSlots, 
    loading, 
    error, 
    addOccupiedSlot, 
    removeOccupiedSlot, 
    updateOccupiedSlot,
    markAsInvoiced,
    refetch: fetchOccupiedSlots 
  };
};

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, notes })
        .eq('id', id);

      if (error) throw error;
      await fetchBookings(); // Refrescar la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  return { bookings, loading, error, updateBookingStatus, refetch: fetchBookings };
};

export const useAvailability = () => {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      // Solo obtener días NO disponibles (is_available = false)
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('is_available', false)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Marcar un día como NO disponible (todo el día o solo un rango de horas)
  const markUnavailable = async (
    date: string, 
    notes?: string, 
    startTime?: string | null, 
    endTime?: string | null
  ) => {
    try {
      const updateData: any = { 
        date, 
        is_available: false, // Siempre false porque solo marcamos no disponibles
        notes: notes || null
      };
      
      // Si se proporcionan tiempos, solo ese rango está no disponible
      if (startTime && endTime) {
        updateData.start_time = startTime;
        updateData.end_time = endTime;
      } else {
        // Si no hay tiempos, todo el día está no disponible
        updateData.start_time = null;
        updateData.end_time = null;
      }

      const { error } = await supabase
        .from('availability')
        .upsert(updateData, { onConflict: 'date' });

      if (error) throw error;
      await fetchAvailability(); // Refrescar la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como no disponible');
      throw err;
    }
  };

  // Marcar un rango de días como NO disponibles
  const markRangeUnavailable = async (
    startDate: string,
    endDate: string,
    notes?: string,
    startTime?: string | null,
    endTime?: string | null
  ) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates: string[] = [];
      
      // Generar todas las fechas del rango
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      // Insertar todas las fechas
      const insertData = dates.map(date => ({
        date,
        is_available: false,
        notes: notes || null,
        start_time: startTime || null,
        end_time: endTime || null
      }));

      const { error } = await supabase
        .from('availability')
        .upsert(insertData, { onConflict: 'date' });

      if (error) throw error;
      await fetchAvailability(); // Refrescar la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar rango como no disponible');
      throw err;
    }
  };

  // Eliminar marca de no disponible (hacer el día disponible de nuevo)
  const removeUnavailable = async (date: string) => {
    try {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('date', date)
        .eq('is_available', false);

      if (error) throw error;
      await fetchAvailability(); // Refrescar la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar marca de no disponible');
      throw err;
    }
  };

  // Función de compatibilidad con el código anterior (ahora solo marca no disponibles)
  const updateAvailability = async (
    date: string, 
    isAvailable: boolean, 
    notes?: string, 
    startTime?: string | null, 
    endTime?: string | null
  ) => {
    if (isAvailable) {
      // Si se marca como disponible, eliminar de la tabla
      await removeUnavailable(date);
    } else {
      // Si se marca como no disponible, añadir
      await markUnavailable(date, notes, startTime, endTime);
    }
  };

  return { 
    availability, 
    loading, 
    error, 
    updateAvailability, 
    markUnavailable,
    markRangeUnavailable,
    removeUnavailable,
    refetch: fetchAvailability 
  };
};
