import { createClient } from '@supabase/supabase-js'
import { createDemoClient } from './demoClient'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sin credenciales la app arranca en modo demo, con datos de ejemplo en memoria.
export const isDemo = !(url && key)

export const supabase = isDemo ? createDemoClient() : createClient(url, key)

export const BUCKET = 'manga-images'
