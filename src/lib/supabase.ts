import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface Booking {
  id: string
  created_at: string
  client_name: string
  client_email: string
  client_phone: string
  event_date: string
  event_time: string
  event_type: string
  event_name: string
  event_location: string
  guests: number
  special_requests: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string
}

export interface Availability {
  id: string
  date: string
  is_available: boolean
  notes: string
  start_time?: string
  end_time?: string
  event_name?: string
}

export interface OccupiedSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  event_name: string
  notes?: string
  created_at: string
  is_invoiced?: boolean
  invoice_method?: string
  invoice_amount?: number
  invoice_date?: string
  invoice_notes?: string
}

export interface Invoice {
  id: string
  invoice_number?: string
  description: string
  invoice_method: string
  invoice_amount: number
  invoice_date: string
  invoice_notes?: string
  created_at: string
  updated_at: string
}
