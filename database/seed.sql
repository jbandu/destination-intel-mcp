-- =====================================================
-- SEED DATA FOR DESTINATION INTELLIGENCE MCP
-- Sample data for testing and demonstration
-- =====================================================

-- Insert sample destinations
INSERT INTO destinations (
  city, country, airport_code, region, continent, destination_type,
  best_time_to_visit, average_temp_celsius, languages_spoken, currency,
  timezone, safety_rating, tourist_infrastructure_rating, budget_level,
  average_daily_cost_usd, popular_activities, famous_attractions,
  local_cuisine_highlights, short_description, long_description,
  hero_image_url, is_active
) VALUES
(
  'Barcelona', 'Spain', 'BCN', 'Catalonia', 'Europe',
  ARRAY['CULTURAL', 'BEACH', 'FAMILY'],
  '{"months": ["April", "May", "June", "September", "October"], "weather": "Mild and sunny", "events": ["La Mercè Festival", "Primavera Sound"]}'::jsonb,
  '{"jan": 13, "feb": 14, "mar": 16, "apr": 18, "may": 21, "jun": 25, "jul": 28, "aug": 28, "sep": 25, "oct": 21, "nov": 16, "dec": 14}'::jsonb,
  ARRAY['Spanish', 'Catalan', 'English'],
  'EUR', 'Europe/Madrid', 4.2, 4.8, 'MODERATE', 120.00,
  ARRAY['Beach', 'Architecture', 'Museums', 'Food Tours', 'Shopping'],
  ARRAY['Sagrada Familia', 'Park Güell', 'Las Ramblas', 'Gothic Quarter', 'Casa Batlló'],
  ARRAY['Paella', 'Tapas', 'Crema Catalana', 'Pan con Tomate'],
  'Vibrant Mediterranean city known for Gaudí architecture, beaches, and incredible food scene',
  'Barcelona combines stunning architecture, Mediterranean beaches, world-class museums, and a thriving culinary scene. From the whimsical designs of Antoni Gaudí to the medieval streets of the Gothic Quarter, Barcelona offers endless discoveries.',
  'https://images.unsplash.com/photo-1583422409516-2895a77efded',
  true
),
(
  'Tokyo', 'Japan', 'NRT', 'Kanto', 'Asia',
  ARRAY['CULTURAL', 'LUXURY', 'FAMILY'],
  '{"months": ["March", "April", "May", "October", "November"], "weather": "Pleasant temperatures", "events": ["Cherry Blossom Season", "Autumn Foliage"]}'::jsonb,
  '{"jan": 6, "feb": 7, "mar": 11, "apr": 16, "may": 20, "jun": 23, "jul": 27, "aug": 28, "sep": 24, "oct": 18, "nov": 13, "dec": 8}'::jsonb,
  ARRAY['Japanese', 'English'],
  'JPY', 'Asia/Tokyo', 4.9, 5.0, 'MODERATE', 150.00,
  ARRAY['Temples', 'Shopping', 'Food Tours', 'Technology', 'Anime'],
  ARRAY['Senso-ji Temple', 'Tokyo Skytree', 'Shibuya Crossing', 'Meiji Shrine', 'Tsukiji Market'],
  ARRAY['Sushi', 'Ramen', 'Tempura', 'Wagyu Beef', 'Matcha Desserts'],
  'Ultra-modern metropolis blending ancient traditions with cutting-edge technology',
  'Tokyo is a fascinating blend of ancient tradition and modern innovation. Explore serene temples alongside neon-lit skyscrapers, savor world-renowned cuisine, and experience the incredible efficiency and politeness of Japanese culture.',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
  true
),
(
  'Dubai', 'United Arab Emirates', 'DXB', 'Dubai Emirate', 'Asia',
  ARRAY['LUXURY', 'SHOPPING', 'BEACH', 'FAMILY'],
  '{"months": ["November", "December", "January", "February", "March"], "weather": "Warm and dry", "events": ["Dubai Shopping Festival", "Dubai Food Festival"]}'::jsonb,
  '{"jan": 20, "feb": 21, "mar": 24, "apr": 28, "may": 32, "jun": 35, "jul": 37, "aug": 38, "sep": 35, "oct": 31, "nov": 26, "dec": 22}'::jsonb,
  ARRAY['Arabic', 'English', 'Hindi', 'Urdu'],
  'AED', 'Asia/Dubai', 4.6, 5.0, 'LUXURY', 200.00,
  ARRAY['Shopping', 'Desert Safari', 'Beach', 'Skyscrapers', 'Fine Dining'],
  ARRAY['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Dubai Marina', 'Gold Souk'],
  ARRAY['Shawarma', 'Hummus', 'Arabic Coffee', 'Kunafa', 'Mixed Grill'],
  'Futuristic city of superlatives with luxury shopping, modern architecture, and desert adventures',
  'Dubai is a city of world records and architectural marvels. Experience the tallest building, largest mall, and most luxurious hotels. Combine urban luxury with desert safaris and pristine beaches for an unforgettable experience.',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
  true
),
(
  'Panama City', 'Panama', 'PTY', 'Panama Province', 'Central America',
  ARRAY['CULTURAL', 'BEACH', 'ADVENTURE'],
  '{"months": ["December", "January", "February", "March", "April"], "weather": "Dry season", "events": ["Carnival", "Jazz Festival"]}'::jsonb,
  '{"jan": 27, "feb": 27, "mar": 28, "apr": 28, "may": 27, "jun": 27, "jul": 27, "aug": 27, "sep": 27, "oct": 26, "nov": 26, "dec": 27}'::jsonb,
  ARRAY['Spanish', 'English'],
  'USD', 'America/Panama', 4.0, 4.3, 'MODERATE', 100.00,
  ARRAY['Canal Tour', 'Old Town', 'Island Hopping', 'Rainforest', 'Beaches'],
  ARRAY['Panama Canal', 'Casco Viejo', 'Biomuseo', 'Miraflores Locks', 'Metropolitan Natural Park'],
  ARRAY['Ceviche', 'Sancocho', 'Ropa Vieja', 'Hojaldras', 'Raspao'],
  'Cosmopolitan hub connecting two oceans with rich history and modern skyline',
  'Panama City offers a unique blend of old and new. Explore the historic Casco Viejo, marvel at the engineering wonder of the Panama Canal, and enjoy a cosmopolitan city with excellent dining and nightlife.',
  'https://images.unsplash.com/photo-1582737989364-2eef72a4f88b',
  true
),
(
  'Cartagena', 'Colombia', 'CTG', 'Bolivar', 'South America',
  ARRAY['CULTURAL', 'BEACH', 'ROMANTIC'],
  '{"months": ["December", "January", "February", "March"], "weather": "Dry and warm", "events": ["Cartagena Film Festival", "Independence Day"]}'::jsonb,
  '{"jan": 27, "feb": 27, "mar": 28, "apr": 28, "may": 28, "jun": 28, "jul": 28, "aug": 28, "sep": 28, "oct": 27, "nov": 27, "dec": 27}'::jsonb,
  ARRAY['Spanish', 'English'],
  'COP', 'America/Bogota', 3.8, 4.0, 'MODERATE', 80.00,
  ARRAY['Historic Sites', 'Beach', 'Food Tours', 'Salsa Dancing', 'Island Hopping'],
  ARRAY['Walled City', 'Castillo San Felipe', 'Rosario Islands', 'Getsemani', 'Las Bovedas'],
  ARRAY['Arepas', 'Bandeja Paisa', 'Ceviche', 'Empanadas', 'Tropical Fruits'],
  'Colonial gem with colorful streets, Caribbean beaches, and vibrant culture',
  'Cartagena enchants visitors with its perfectly preserved colonial architecture, vibrant street life, and Caribbean charm. Wander colorful streets, relax on nearby beaches, and immerse yourself in Colombian culture and cuisine.',
  'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d',
  true
);

-- Insert sample POIs for Barcelona
INSERT INTO poi_database (
  destination_id, poi_name, poi_type, category, description,
  latitude, longitude, rating, review_count, price_level,
  visit_duration_minutes, is_must_see, tags
) VALUES
(
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'Sagrada Familia', 'ATTRACTION', ARRAY['ARCHITECTURE', 'RELIGIOUS', 'LANDMARK'],
  'Antoni Gaudí''s unfinished masterpiece, a UNESCO World Heritage Site and Barcelona''s most iconic landmark',
  41.4036, 2.1744, 4.7, 125000, '$$',
  120, true, ARRAY['Gaudi', 'Architecture', 'Must-See', 'UNESCO']
),
(
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'Park Güell', 'ATTRACTION', ARRAY['PARK', 'ARCHITECTURE', 'VIEWPOINT'],
  'Whimsical public park with colorful mosaics and stunning city views',
  41.4145, 2.1527, 4.6, 98000, '$$',
  90, true, ARRAY['Gaudi', 'Park', 'Photography', 'Views']
),
(
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'La Boqueria Market', 'ATTRACTION', ARRAY['MARKET', 'FOOD'],
  'Famous food market on Las Ramblas offering fresh produce, seafood, and tapas',
  41.3818, 2.1713, 4.5, 75000, '$$',
  60, true, ARRAY['Food', 'Market', 'Local Culture']
),
(
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'Tickets Bar', 'RESTAURANT', ARRAY['TAPAS', 'FINE DINING'],
  'Innovative tapas restaurant by renowned chef Albert Adrià',
  41.3789, 2.1500, 4.8, 12000, '$$$$',
  120, false, ARRAY['Fine Dining', 'Tapas', 'Michelin']
);

-- Insert sample itinerary template
INSERT INTO itinerary_templates (
  destination_id, template_name, duration_days, trip_style, target_audience,
  daily_schedule, estimated_cost_usd, difficulty_level, must_do_activities,
  is_featured
) VALUES
(
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'Barcelona Highlights: Culture & Beach',
  3,
  'BALANCED',
  'COUPLES',
  '[
    {
      "day": 1,
      "theme": "Gaudí & Gothic Quarter",
      "morning": {
        "activity": "Visit Sagrada Familia",
        "duration": "2 hours",
        "tips": "Book tickets online in advance"
      },
      "afternoon": {
        "activity": "Explore Gothic Quarter",
        "duration": "3 hours",
        "tips": "Get lost in the medieval streets"
      },
      "evening": {
        "activity": "Tapas dinner in El Born",
        "duration": "2 hours",
        "tips": "Try multiple small plates"
      }
    },
    {
      "day": 2,
      "theme": "Modernist Architecture & Beach",
      "morning": {
        "activity": "Park Güell visit",
        "duration": "2 hours",
        "tips": "Arrive early for best photos"
      },
      "afternoon": {
        "activity": "Barceloneta Beach & lunch",
        "duration": "4 hours",
        "tips": "Try fresh seafood by the beach"
      },
      "evening": {
        "activity": "Magic Fountain show at Montjuïc",
        "duration": "1.5 hours",
        "tips": "Free show on select evenings"
      }
    },
    {
      "day": 3,
      "theme": "Markets & Modernism",
      "morning": {
        "activity": "La Boqueria Market",
        "duration": "1.5 hours",
        "tips": "Perfect for breakfast and shopping"
      },
      "afternoon": {
        "activity": "Casa Batlló & Passeig de Gràcia shopping",
        "duration": "3 hours",
        "tips": "Audio guide highly recommended"
      },
      "evening": {
        "activity": "Farewell dinner with city views",
        "duration": "2 hours",
        "tips": "Book rooftop restaurant in advance"
      }
    }
  ]'::jsonb,
  900.00,
  'EASY',
  ARRAY['Sagrada Familia', 'Park Güell', 'Gothic Quarter', 'Beach Time'],
  true
);

-- Insert sample destination guide
INSERT INTO destination_guides (
  destination_id, guide_type, title, content, highlights, tips, author
) VALUES
(
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'THINGS_TO_DO',
  'Top 10 Experiences in Barcelona',
  '# Must-Do Experiences in Barcelona

Barcelona offers an incredible variety of experiences that blend culture, cuisine, and coastal beauty. Here are the absolute must-do activities:

## 1. Marvel at Sagrada Familia
Gaudí''s masterpiece has been under construction since 1882 and remains breathtaking. The interior is like a forest of stone columns with light streaming through stunning stained glass.

## 2. Wander Park Güell
This whimsical park showcases Gaudí''s unique vision with colorful mosaics and organic architecture.

## 3. Explore Gothic Quarter
Get lost in the labyrinth of medieval streets, discovering hidden plazas, ancient Roman walls, and charming boutiques.

## 4. Relax at Barceloneta Beach
Enjoy 4.5km of sandy beaches right in the city, perfect for swimming, sunbathing, and beachside dining.

## 5. Experience La Boqueria Market
This famous market is a feast for the senses with vibrant produce, fresh seafood, and delicious tapas.
',
  '["Gaudí architecture", "Beach life", "Gothic history", "Culinary excellence", "Vibrant nightlife"]'::jsonb,
  ARRAY[
    'Purchase skip-the-line tickets for major attractions',
    'Use the metro - it''s efficient and affordable',
    'Avoid eating on Las Ramblas - touristy and overpriced',
    'Learn a few Spanish phrases - locals appreciate it',
    'Restaurants open late - dinner starts around 9 PM'
  ],
  'AI'
);

-- Insert seasonal events
INSERT INTO seasonal_events (
  destination_id, event_name, event_type, start_date, end_date,
  description, expected_crowd_level, relevance_score
) VALUES
(
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'La Mercè Festival',
  'FESTIVAL',
  '2025-09-24',
  '2025-09-27',
  'Barcelona''s biggest street festival celebrating the city''s patron saint with concerts, parades, and fireworks',
  'VERY_HIGH',
  0.95
),
(
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'Primavera Sound',
  'CONCERT',
  '2025-05-28',
  '2025-06-01',
  'One of Europe''s premier music festivals featuring international artists across multiple genres',
  'HIGH',
  0.85
);

-- Insert inspiration content
INSERT INTO inspiration_content (
  content_type, title, subtitle, destination_id, theme, content,
  call_to_action, target_package_types, is_featured, published_at
) VALUES
(
  'ARTICLE',
  '48 Hours in Barcelona: The Perfect Weekend Getaway',
  'Discover Gaudí''s masterpieces, savor world-class tapas, and soak up the Mediterranean sun',
  (SELECT destination_id FROM destinations WHERE city = 'Barcelona'),
  'CULTURAL',
  'Barcelona is the perfect destination for a quick European escape. With its unique blend of architectural wonders, beachside charm, and incredible food scene, you can pack an unforgettable experience into just one weekend.

Start your Saturday morning at the iconic Sagrada Familia, arriving early to beat the crowds and witness the morning light illuminating the stunning interior. From there, take a leisurely stroll through the Eixample district to admire more Modernist architecture, stopping for coffee and churros along the way.

The afternoon is perfect for exploring the Gothic Quarter, where narrow medieval streets open onto charming plazas. Stop for lunch at a traditional tapas bar and try local favorites like pan con tomate and patatas bravas.

As evening approaches, head to the beach for sunset, then enjoy dinner in the trendy El Born neighborhood. End your night with cocktails at a rooftop bar overlooking the city.

Sunday morning calls for a visit to Park Güell, where Gaudí''s whimsical creations offer incredible photo opportunities and panoramic city views. Spend your afternoon at La Boqueria market, sampling local delicacies and picking up some jamón ibérico to take home.

Before heading to the airport, squeeze in one last beach moment or visit Casa Batlló. Barcelona will leave you planning your return before you even depart.',
  'Book your Barcelona weekend escape today - packages from $799',
  ARRAY['CITY_BREAK', 'WEEKEND', 'CULTURAL'],
  true,
  NOW()
);

-- Insert sample travel preferences
INSERT INTO user_travel_preferences (
  passenger_id, travel_style, preferred_activities, interests,
  travel_companions, budget_preference, typical_trip_duration_days,
  pace_preference, accommodation_preferences
) VALUES
(
  gen_random_uuid(),
  'CULTURAL',
  ARRAY['Museums', 'Food Tours', 'Walking Tours', 'Photography'],
  ARRAY['HISTORY', 'FOOD', 'ARCHITECTURE', 'PHOTOGRAPHY'],
  'COUPLE',
  'MODERATE',
  7,
  'BALANCED',
  '{"type": "BOUTIQUE_HOTEL", "amenities": ["WiFi", "Breakfast"], "star_rating": 4}'::jsonb
);

COMMENT ON TABLE destinations IS 'Sample data includes 5 diverse destinations: Barcelona, Tokyo, Dubai, Panama City, and Cartagena';
