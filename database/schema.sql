-- =====================================================
-- DESTINATION INTELLIGENCE & CONTENT MCP SERVER
-- Database Schema - PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- =====================================================
-- TABLE 1: destinations
-- Core destination information and metadata
-- =====================================================
CREATE TABLE destinations (
  destination_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  airport_code VARCHAR(3),
  region VARCHAR(100),
  continent VARCHAR(50),
  destination_type TEXT[], -- ['BEACH', 'CULTURAL', 'ADVENTURE', 'LUXURY', 'FAMILY']
  best_time_to_visit JSONB, -- {months: [], weather: {}, events: []}
  average_temp_celsius JSONB, -- By month {jan: 25, feb: 26, ...}
  languages_spoken TEXT[],
  currency VARCHAR(3),
  timezone VARCHAR(50),
  visa_requirements JSONB, -- {required: boolean, type: string, processing_days: number}
  safety_rating DECIMAL(2,1) CHECK (safety_rating >= 0 AND safety_rating <= 5),
  tourist_infrastructure_rating DECIMAL(2,1) CHECK (tourist_infrastructure_rating >= 0 AND tourist_infrastructure_rating <= 5),
  budget_level VARCHAR(50) CHECK (budget_level IN ('BUDGET', 'MODERATE', 'UPSCALE', 'LUXURY')),
  average_daily_cost_usd DECIMAL(8,2),
  popular_activities TEXT[],
  famous_attractions TEXT[],
  local_cuisine_highlights TEXT[],
  cultural_considerations TEXT,
  hero_image_url TEXT,
  gallery_images TEXT[],
  short_description TEXT,
  long_description TEXT,
  ai_generated_content BOOLEAN DEFAULT false,
  content_last_updated TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_destinations_city ON destinations(city);
CREATE INDEX idx_destinations_country ON destinations(country);
CREATE INDEX idx_destinations_airport ON destinations(airport_code);
CREATE INDEX idx_destinations_type ON destinations USING GIN(destination_type);
CREATE INDEX idx_destinations_active ON destinations(is_active);

-- =====================================================
-- TABLE 2: destination_guides
-- Comprehensive destination guides and content
-- =====================================================
CREATE TABLE destination_guides (
  guide_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES destinations(destination_id) ON DELETE CASCADE,
  guide_type VARCHAR(50) CHECK (guide_type IN ('OVERVIEW', 'THINGS_TO_DO', 'WHERE_TO_EAT', 'NIGHTLIFE', 'SHOPPING', 'DAY_TRIPS', 'CULTURE', 'PRACTICAL_INFO')),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL, -- Rich markdown content
  highlights JSONB, -- Key points array
  tips TEXT[], -- Travel tips
  insider_recommendations TEXT[],
  estimated_read_time_minutes INTEGER,
  last_updated TIMESTAMP DEFAULT NOW(),
  author VARCHAR(100), -- 'AI' or human author
  images TEXT[],
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_guides_destination ON destination_guides(destination_id);
CREATE INDEX idx_guides_type ON destination_guides(guide_type);
CREATE INDEX idx_guides_published ON destination_guides(is_published);

-- =====================================================
-- TABLE 3: itinerary_templates
-- Pre-built and AI-generated itinerary templates
-- =====================================================
CREATE TABLE itinerary_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES destinations(destination_id) ON DELETE CASCADE,
  template_name VARCHAR(200) NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0 AND duration_days <= 30),
  trip_style VARCHAR(50) CHECK (trip_style IN ('RELAXED', 'BALANCED', 'PACKED', 'ADVENTURE', 'CULTURAL')),
  target_audience VARCHAR(50) CHECK (target_audience IN ('COUPLES', 'FAMILIES', 'SOLO', 'GROUPS', 'BUSINESS')),
  daily_schedule JSONB NOT NULL, -- Array of {day, morning, afternoon, evening, activities}
  estimated_cost_usd DECIMAL(10,2),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('EASY', 'MODERATE', 'CHALLENGING')),
  must_do_activities TEXT[],
  optional_activities TEXT[],
  dining_recommendations JSONB,
  transportation_tips JSONB,
  packing_list TEXT[],
  budget_breakdown JSONB,
  usage_count INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_itinerary_destination ON itinerary_templates(destination_id);
CREATE INDEX idx_itinerary_duration ON itinerary_templates(duration_days);
CREATE INDEX idx_itinerary_audience ON itinerary_templates(target_audience);
CREATE INDEX idx_itinerary_featured ON itinerary_templates(is_featured);

-- =====================================================
-- TABLE 4: poi_database (Points of Interest)
-- Comprehensive POI data for all destinations
-- =====================================================
CREATE TABLE poi_database (
  poi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES destinations(destination_id) ON DELETE CASCADE,
  poi_name VARCHAR(200) NOT NULL,
  poi_type VARCHAR(50) CHECK (poi_type IN ('ATTRACTION', 'RESTAURANT', 'NIGHTLIFE', 'SHOPPING', 'ACTIVITY', 'HOTEL', 'TRANSPORT')),
  category TEXT[], -- ['MUSEUM', 'BEACH', 'PARK', 'MONUMENT']
  description TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  google_place_id VARCHAR(200),
  tripadvisor_id VARCHAR(100),
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  price_level VARCHAR(20) CHECK (price_level IN ('FREE', '$', '$$', '$$$', '$$$$')),
  opening_hours JSONB, -- {monday: {open: "09:00", close: "18:00"}, ...}
  contact_info JSONB, -- {phone: "", website: "", email: ""}
  images TEXT[],
  visit_duration_minutes INTEGER,
  best_time_to_visit VARCHAR(100),
  tags TEXT[],
  is_must_see BOOLEAN DEFAULT false,
  accessibility_info JSONB,
  last_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_poi_destination ON poi_database(destination_id);
CREATE INDEX idx_poi_type ON poi_database(poi_type);
CREATE INDEX idx_poi_rating ON poi_database(rating DESC);
CREATE INDEX idx_poi_must_see ON poi_database(is_must_see);
CREATE INDEX idx_poi_location ON poi_database(latitude, longitude);
CREATE INDEX idx_poi_tags ON poi_database USING GIN(tags);

-- =====================================================
-- TABLE 5: user_travel_preferences
-- Passenger preferences for personalization
-- =====================================================
CREATE TABLE user_travel_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL,
  travel_style VARCHAR(50) CHECK (travel_style IN ('ADVENTURE', 'RELAXATION', 'CULTURAL', 'LUXURY', 'BUDGET', 'FAMILY', 'ROMANTIC')),
  preferred_activities TEXT[],
  avoided_activities TEXT[],
  dietary_restrictions TEXT[],
  preferred_destinations TEXT[],
  bucket_list_destinations TEXT[],
  typical_trip_duration_days INTEGER,
  travel_companions VARCHAR(50) CHECK (travel_companions IN ('SOLO', 'COUPLE', 'FAMILY', 'FRIENDS', 'BUSINESS')),
  budget_preference VARCHAR(50) CHECK (budget_preference IN ('BUDGET', 'MODERATE', 'UPSCALE', 'LUXURY')),
  accommodation_preferences JSONB, -- {type: "HOTEL", amenities: [], star_rating: 4}
  interests TEXT[], -- ['HISTORY', 'FOOD', 'NATURE', 'PHOTOGRAPHY', 'SPORTS']
  preferred_climate VARCHAR(50),
  pace_preference VARCHAR(20) CHECK (pace_preference IN ('RELAXED', 'MODERATE', 'PACKED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(passenger_id)
);

CREATE INDEX idx_preferences_passenger ON user_travel_preferences(passenger_id);
CREATE INDEX idx_preferences_style ON user_travel_preferences(travel_style);
CREATE INDEX idx_preferences_interests ON user_travel_preferences USING GIN(interests);

-- =====================================================
-- TABLE 6: inspiration_content
-- Marketing content for inspiration and conversion
-- =====================================================
CREATE TABLE inspiration_content (
  content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) CHECK (content_type IN ('ARTICLE', 'VIDEO', 'GALLERY', 'ITINERARY', 'GUIDE', 'EMAIL', 'SOCIAL_POST')),
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300),
  destination_id UUID REFERENCES destinations(destination_id) ON DELETE SET NULL,
  theme VARCHAR(50) CHECK (theme IN ('ADVENTURE', 'ROMANCE', 'FAMILY', 'LUXURY', 'BUDGET', 'CULTURAL', 'BEACH')),
  content TEXT NOT NULL,
  media_urls TEXT[],
  call_to_action TEXT,
  target_package_types TEXT[],
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  published_at TIMESTAMP,
  is_featured BOOLEAN DEFAULT false,
  seo_metadata JSONB, -- {meta_title: "", meta_description: "", keywords: []}
  target_audience TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inspiration_destination ON inspiration_content(destination_id);
CREATE INDEX idx_inspiration_theme ON inspiration_content(theme);
CREATE INDEX idx_inspiration_featured ON inspiration_content(is_featured);
CREATE INDEX idx_inspiration_published ON inspiration_content(published_at DESC);

-- =====================================================
-- TABLE 7: seasonal_events
-- Events, festivals, and seasonal highlights
-- =====================================================
CREATE TABLE seasonal_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES destinations(destination_id) ON DELETE CASCADE,
  event_name VARCHAR(200) NOT NULL,
  event_type VARCHAR(50) CHECK (event_type IN ('FESTIVAL', 'HOLIDAY', 'SPORTS', 'CONCERT', 'EXHIBITION', 'CULTURAL', 'FOOD', 'SEASONAL')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  location TEXT,
  expected_crowd_level VARCHAR(20) CHECK (expected_crowd_level IN ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH')),
  ticket_required BOOLEAN DEFAULT false,
  typical_ticket_price DECIMAL(10,2),
  booking_url TEXT,
  relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1), -- How important to mention
  images TEXT[],
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'ANNUAL', 'MONTHLY', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_destination ON seasonal_events(destination_id);
CREATE INDEX idx_events_dates ON seasonal_events(start_date, end_date);
CREATE INDEX idx_events_type ON seasonal_events(event_type);
CREATE INDEX idx_events_relevance ON seasonal_events(relevance_score DESC);

-- =====================================================
-- TABLE 8: travel_recommendations_log
-- Analytics and learning data for recommendations
-- =====================================================
CREATE TABLE travel_recommendations_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID,
  session_id VARCHAR(100),
  recommendations_shown JSONB NOT NULL, -- Array of recommended destinations/packages with scores
  clicked_recommendations TEXT[],
  booked_destination VARCHAR(100),
  booked_package_id UUID,
  recommendation_quality_score DECIMAL(3,2), -- User feedback or implicit signals
  context_data JSONB, -- {search_query: "", filters: {}, user_agent: ""}
  conversion_value_usd DECIMAL(10,2),
  feedback_provided TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reclog_passenger ON travel_recommendations_log(passenger_id);
CREATE INDEX idx_reclog_session ON travel_recommendations_log(session_id);
CREATE INDEX idx_reclog_timestamp ON travel_recommendations_log(timestamp DESC);
CREATE INDEX idx_reclog_conversion ON travel_recommendations_log(booked_destination) WHERE booked_destination IS NOT NULL;

-- =====================================================
-- ADDITIONAL TABLES FOR ENHANCED FUNCTIONALITY
-- =====================================================

-- Content performance metrics
CREATE TABLE content_analytics (
  analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50),
  content_id UUID,
  metric_name VARCHAR(50),
  metric_value DECIMAL(12,2),
  dimension JSONB, -- {date: "", destination: "", user_segment: ""}
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_content ON content_analytics(content_id, content_type);
CREATE INDEX idx_analytics_recorded ON content_analytics(recorded_at DESC);

-- Weather data cache
CREATE TABLE weather_cache (
  cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES destinations(destination_id),
  month INTEGER CHECK (month >= 1 AND month <= 12),
  weather_data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(destination_id, month)
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Top destinations view
CREATE VIEW top_destinations AS
SELECT
  d.destination_id,
  d.city,
  d.country,
  d.hero_image_url,
  d.short_description,
  COUNT(DISTINCT trl.log_id) as recommendation_count,
  COUNT(DISTINCT CASE WHEN trl.booked_destination = d.city THEN trl.log_id END) as booking_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN trl.booked_destination = d.city THEN trl.log_id END)::numeric /
    NULLIF(COUNT(DISTINCT trl.log_id), 0) * 100,
    2
  ) as conversion_rate
FROM destinations d
LEFT JOIN travel_recommendations_log trl ON d.city = ANY(ARRAY(SELECT jsonb_array_elements_text(trl.recommendations_shown)))
WHERE d.is_active = true
GROUP BY d.destination_id
ORDER BY booking_count DESC;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_updated_at BEFORE UPDATE ON itinerary_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poi_updated_at BEFORE UPDATE ON poi_database
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_travel_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate conversion rate automatically
CREATE OR REPLACE FUNCTION calculate_conversion_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.view_count > 0 THEN
        NEW.conversion_rate = ROUND((NEW.conversion_count::numeric / NEW.view_count * 100), 2);
    ELSE
        NEW.conversion_rate = 0;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inspiration_conversion_rate BEFORE INSERT OR UPDATE ON inspiration_content
  FOR EACH ROW EXECUTE FUNCTION calculate_conversion_rate();

-- =====================================================
-- INITIAL DATA CONSTRAINTS
-- =====================================================

-- Ensure data quality
ALTER TABLE destinations ADD CONSTRAINT check_destination_name_length
  CHECK (LENGTH(city) >= 2 AND LENGTH(country) >= 2);

ALTER TABLE poi_database ADD CONSTRAINT check_valid_coordinates
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  );

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE destinations IS 'Core destination information including geography, characteristics, and travel metadata';
COMMENT ON TABLE destination_guides IS 'Rich content guides for destinations covering various topics';
COMMENT ON TABLE itinerary_templates IS 'Pre-built and AI-generated travel itineraries';
COMMENT ON TABLE poi_database IS 'Points of Interest including attractions, restaurants, activities';
COMMENT ON TABLE user_travel_preferences IS 'Passenger travel preferences for personalization';
COMMENT ON TABLE inspiration_content IS 'Marketing content designed to inspire travel bookings';
COMMENT ON TABLE seasonal_events IS 'Events, festivals, and seasonal highlights for destinations';
COMMENT ON TABLE travel_recommendations_log IS 'Analytics data for recommendation quality and conversion tracking';

COMMENT ON COLUMN destinations.destination_type IS 'Array of destination characteristics for filtering';
COMMENT ON COLUMN destinations.best_time_to_visit IS 'JSON object with optimal travel months and reasoning';
COMMENT ON COLUMN poi_database.is_must_see IS 'Flag for top-tier attractions that should always be recommended';
COMMENT ON COLUMN seasonal_events.relevance_score IS 'Score 0-1 indicating how important this event is for the destination';
