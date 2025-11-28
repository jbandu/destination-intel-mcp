/**
 * Database connection and query utilities
 */

import pg from 'pg';
import config from '../config/config.js';

const { Pool } = pg;

// PostgreSQL connection pool
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a database query
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (config.app.logLevel === 'debug') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Database connected successfully:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}

// Type definitions for common database models
export interface Destination {
  destination_id: string;
  city: string;
  country: string;
  airport_code?: string;
  region?: string;
  continent?: string;
  destination_type?: string[];
  best_time_to_visit?: any;
  average_temp_celsius?: any;
  languages_spoken?: string[];
  currency?: string;
  timezone?: string;
  visa_requirements?: any;
  safety_rating?: number;
  tourist_infrastructure_rating?: number;
  budget_level?: string;
  average_daily_cost_usd?: number;
  popular_activities?: string[];
  famous_attractions?: string[];
  local_cuisine_highlights?: string[];
  cultural_considerations?: string;
  hero_image_url?: string;
  gallery_images?: string[];
  short_description?: string;
  long_description?: string;
  ai_generated_content?: boolean;
  content_last_updated?: Date;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface DestinationGuide {
  guide_id: string;
  destination_id: string;
  guide_type: string;
  title: string;
  content: string;
  highlights?: any;
  tips?: string[];
  insider_recommendations?: string[];
  estimated_read_time_minutes?: number;
  last_updated?: Date;
  author?: string;
  images?: string[];
  view_count?: number;
  helpful_count?: number;
  is_published?: boolean;
  created_at?: Date;
}

export interface POI {
  poi_id: string;
  destination_id: string;
  poi_name: string;
  poi_type: string;
  category?: string[];
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  tripadvisor_id?: string;
  rating?: number;
  review_count?: number;
  price_level?: string;
  opening_hours?: any;
  contact_info?: any;
  images?: string[];
  visit_duration_minutes?: number;
  best_time_to_visit?: string;
  tags?: string[];
  is_must_see?: boolean;
  accessibility_info?: any;
  last_verified?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface ItineraryTemplate {
  template_id: string;
  destination_id: string;
  template_name: string;
  duration_days: number;
  trip_style: string;
  target_audience: string;
  daily_schedule: any;
  estimated_cost_usd?: number;
  difficulty_level?: string;
  must_do_activities?: string[];
  optional_activities?: string[];
  dining_recommendations?: any;
  transportation_tips?: any;
  packing_list?: string[];
  budget_breakdown?: any;
  usage_count?: number;
  average_rating?: number;
  is_featured?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserTravelPreferences {
  preference_id: string;
  passenger_id: string;
  travel_style?: string;
  preferred_activities?: string[];
  avoided_activities?: string[];
  dietary_restrictions?: string[];
  preferred_destinations?: string[];
  bucket_list_destinations?: string[];
  typical_trip_duration_days?: number;
  travel_companions?: string;
  budget_preference?: string;
  accommodation_preferences?: any;
  interests?: string[];
  preferred_climate?: string;
  pace_preference?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface SeasonalEvent {
  event_id: string;
  destination_id: string;
  event_name: string;
  event_type: string;
  start_date: Date;
  end_date: Date;
  description?: string;
  location?: string;
  expected_crowd_level?: string;
  ticket_required?: boolean;
  typical_ticket_price?: number;
  booking_url?: string;
  relevance_score?: number;
  images?: string[];
  is_recurring?: boolean;
  recurrence_pattern?: string;
  created_at?: Date;
  updated_at?: Date;
}
