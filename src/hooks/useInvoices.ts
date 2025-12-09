import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Invoice } from '@/lib/supabase';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener facturas');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const addInvoice = async (
    description: string,
    method: string,
    amount: number,
    invoiceDate: string,
    invoiceNumber?: string,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          description,
          invoice_method: method,
          invoice_amount: amount,
          invoice_date: invoiceDate,
          invoice_number: invoiceNumber || null,
          invoice_notes: notes || null
        }])
        .select();

      if (error) throw error;
      await fetchInvoices();
      return data?.[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al añadir factura';
      setError(errorMessage);
      throw err;
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar factura');
      throw err;
    }
  };

  const removeInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar factura');
      throw err;
    }
  };

  return {
    invoices,
    loading,
    error,
    addInvoice,
    updateInvoice,
    removeInvoice,
    refetch: fetchInvoices
  };
};






