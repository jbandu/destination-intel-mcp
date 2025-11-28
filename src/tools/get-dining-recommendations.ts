/**
 * MCP Tool: get-dining-recommendations
 * Get personalized restaurant and dining recommendations
 */

import { query, Destination, POI } from '../database/db.js';

export interface GetDiningRecommendationsInput {
  destination: string;
  cuisine_preferences?: string[];
  dietary_restrictions?: string[];
  price_level?: string;
  occasion?: string;
  meal_type?: string;
}

export interface RestaurantRecommendation {
  restaurant_name: string;
  cuisine: string;
  description: string;
  price_level: string;
  rating: number;
  signature_dishes: string[];
  atmosphere: string;
  best_for: string;
  reservation_required: boolean;
  dress_code: string;
  location: string;
  insider_tip: string;
  images: string[];
}

export interface FoodExperience {
  experience_name: string;
  description: string;
  price: number;
}

export interface DiningRecommendationsResponse {
  recommendations: RestaurantRecommendation[];
  food_experiences: FoodExperience[];
  local_specialties: string[];
}

export async function getDiningRecommendations(
  input: GetDiningRecommendationsInput
): Promise<DiningRecommendationsResponse> {
  const {
    destination,
    cuisine_preferences = [],
    price_level,
    occasion,
  } = input;

  // Get destination
  const destResult = await query<Destination>(
    `SELECT * FROM destinations WHERE LOWER(city) = LOWER($1) AND is_active = true LIMIT 1`,
    [destination]
  );

  if (destResult.rows.length === 0) {
    throw new Error(`Destination "${destination}" not found`);
  }

  const dest = destResult.rows[0];

  // Build restaurant query
  let restaurantQuery = `
    SELECT * FROM poi_database
    WHERE destination_id = $1
    AND poi_type = 'RESTAURANT'
  `;
  const queryParams: any[] = [dest.destination_id];
  let paramIndex = 2;

  // Filter by price level
  if (price_level) {
    restaurantQuery += ` AND price_level = $${paramIndex}`;
    queryParams.push(price_level);
    paramIndex++;
  }

  // Filter by cuisine if specified
  if (cuisine_preferences.length > 0) {
    restaurantQuery += ` AND category && $${paramIndex}`;
    queryParams.push(cuisine_preferences.map((c) => c.toUpperCase()));
    paramIndex++;
  }

  restaurantQuery += ` ORDER BY rating DESC NULLS LAST, review_count DESC LIMIT 15`;

  const restaurantsResult = await query<POI>(restaurantQuery, queryParams);

  // Convert to recommendations
  const recommendations: RestaurantRecommendation[] = restaurantsResult.rows.map((poi) => {
    const cuisineType = poi.category?.[0] || 'International';

    // Determine best_for based on occasion and tags
    let bestFor = 'Casual dining';
    if (occasion === 'ROMANTIC') {
      bestFor = 'Romantic dinners';
    } else if (occasion === 'FAMILY') {
      bestFor = 'Family gatherings';
    } else if (occasion === 'BUSINESS') {
      bestFor = 'Business lunches';
    } else if (occasion === 'CELEBRATION') {
      bestFor = 'Special celebrations';
    } else if (poi.price_level === '$$$$') {
      bestFor = 'Fine dining experiences';
    }

    // Determine atmosphere
    let atmosphere = 'Casual and relaxed';
    if (poi.price_level === '$$$$') {
      atmosphere = 'Upscale and elegant';
    } else if (poi.price_level === '$$$') {
      atmosphere = 'Modern and stylish';
    } else if (poi.tags?.includes('TRADITIONAL')) {
      atmosphere = 'Traditional and authentic';
    }

    // Determine dress code
    const dressCode =
      poi.price_level === '$$$$'
        ? 'Smart casual or formal'
        : poi.price_level === '$$$'
          ? 'Smart casual'
          : 'Casual';

    return {
      restaurant_name: poi.poi_name,
      cuisine: cuisineType,
      description: poi.description || `Excellent ${cuisineType.toLowerCase()} restaurant`,
      price_level: poi.price_level || '$$',
      rating: poi.rating || 4.0,
      signature_dishes: dest.local_cuisine_highlights?.slice(0, 3) || [],
      atmosphere,
      best_for: bestFor,
      reservation_required: poi.price_level === '$$$$' || poi.price_level === '$$$',
      dress_code: dressCode,
      location: poi.address || `${destination} city center`,
      insider_tip:
        poi.rating && poi.rating >= 4.5
          ? 'Book well in advance - very popular!'
          : 'Ask for the chef\'s special',
      images: poi.images || [],
    };
  });

  // Create food experiences
  const foodExperiences: FoodExperience[] = [
    {
      experience_name: `${destination} Food Tour`,
      description: `Explore the culinary delights of ${destination} with a guided food tour featuring local specialties`,
      price: 75,
    },
    {
      experience_name: 'Cooking Class',
      description: `Learn to cook traditional ${dest.country} dishes with a local chef`,
      price: 85,
    },
    {
      experience_name: 'Market Visit & Tasting',
      description: 'Visit local markets and sample fresh produce and street food',
      price: 45,
    },
  ];

  return {
    recommendations,
    food_experiences: foodExperiences,
    local_specialties: dest.local_cuisine_highlights || [],
  };
}
