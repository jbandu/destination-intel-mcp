/**
 * MCP Tool: get-destination-guide
 * Get comprehensive destination guide with activities, dining, culture, and tips
 */

import { query, Destination, DestinationGuide, POI } from '../database/db.js';
import { generateDestinationGuide } from '../services/openai.js';

export interface GetDestinationGuideInput {
  destination: string;
  guide_sections?: string[];
  traveler_type?: string;
  duration_days?: number;
}

export interface DestinationGuideResponse {
  destination: {
    name: string;
    country: string;
    description: string;
    best_known_for: string[];
    best_time_to_visit: string;
    average_trip_duration: string;
  };
  overview?: {
    introduction: string;
    why_visit: string[];
    quick_facts: Record<string, any>;
    local_culture: string;
  };
  things_to_do?: {
    must_see_attractions: Array<{
      name: string;
      description: string;
      why_special: string;
      estimated_time: string;
      best_time_to_visit: string;
      insider_tip: string;
      images: string[];
    }>;
    recommended_activities: string[];
    hidden_gems: string[];
    day_trips: string[];
  };
  dining?: {
    must_try_dishes: string[];
    recommended_restaurants: Array<{
      name: string;
      cuisine: string;
      price_level: string;
      signature_dish: string;
      atmosphere: string;
    }>;
    food_neighborhoods: string[];
    dining_tips: string[];
  };
  practical_info?: {
    getting_around: string;
    language_tips: string[];
    safety_tips: string[];
    money_matters: string;
    what_to_pack: string[];
  };
  insider_tips: string[];
  seasonal_highlights: Record<string, any>;
}

export async function getDestinationGuide(
  input: GetDestinationGuideInput
): Promise<DestinationGuideResponse> {
  const { destination, guide_sections = ['OVERVIEW', 'THINGS_TO_DO', 'DINING'], traveler_type, duration_days } = input;

  // Get destination from database
  const destResult = await query<Destination>(
    `SELECT * FROM destinations
     WHERE LOWER(city) = LOWER($1)
     AND is_active = true
     LIMIT 1`,
    [destination]
  );

  if (destResult.rows.length === 0) {
    throw new Error(`Destination "${destination}" not found`);
  }

  const dest = destResult.rows[0];

  // Build response object
  const response: DestinationGuideResponse = {
    destination: {
      name: dest.city,
      country: dest.country,
      description: dest.short_description || '',
      best_known_for: dest.famous_attractions || [],
      best_time_to_visit: dest.best_time_to_visit?.months?.join(', ') || 'Year-round',
      average_trip_duration: `${duration_days || 3}-${(duration_days || 3) + 2} days`,
    },
    insider_tips: [],
    seasonal_highlights: dest.best_time_to_visit || {},
  };

  // Get existing guides from database
  const guidesResult = await query<DestinationGuide>(
    `SELECT * FROM destination_guides
     WHERE destination_id = $1
     AND is_published = true
     ORDER BY last_updated DESC`,
    [dest.destination_id]
  );

  const existingGuides = guidesResult.rows;

  // OVERVIEW section
  if (guide_sections.includes('OVERVIEW')) {
    const overviewGuide = existingGuides.find((g) => g.guide_type === 'OVERVIEW');

    response.overview = {
      introduction: dest.long_description || dest.short_description || '',
      why_visit: dest.destination_type || [],
      quick_facts: {
        language: dest.languages_spoken?.join(', ') || '',
        currency: dest.currency || '',
        timezone: dest.timezone || '',
        safety_rating: dest.safety_rating ? `${dest.safety_rating}/5` : 'N/A',
        budget_level: dest.budget_level || 'Moderate',
        average_daily_cost: dest.average_daily_cost_usd ? `$${dest.average_daily_cost_usd}` : 'N/A',
      },
      local_culture: dest.cultural_considerations || overviewGuide?.content || '',
    };

    // Add tips from guide
    if (overviewGuide) {
      response.insider_tips.push(...(overviewGuide.tips || []));
    }
  }

  // THINGS_TO_DO section
  if (guide_sections.includes('THINGS_TO_DO')) {
    // Get POIs (attractions)
    const poisResult = await query<POI>(
      `SELECT * FROM poi_database
       WHERE destination_id = $1
       AND poi_type = 'ATTRACTION'
       ORDER BY is_must_see DESC, rating DESC NULLS LAST
       LIMIT 10`,
      [dest.destination_id]
    );

    const attractions = poisResult.rows.map((poi) => ({
      name: poi.poi_name,
      description: poi.description || '',
      why_special: poi.tags?.join(', ') || 'Popular attraction',
      estimated_time: poi.visit_duration_minutes ? `${poi.visit_duration_minutes} minutes` : '1-2 hours',
      best_time_to_visit: poi.best_time_to_visit || 'Morning to avoid crowds',
      insider_tip: poi.is_must_see ? 'Book tickets online in advance' : 'Worth visiting if you have time',
      images: poi.images || [],
    }));

    response.things_to_do = {
      must_see_attractions: attractions.filter((_, i) => i < 5),
      recommended_activities: dest.popular_activities || [],
      hidden_gems: attractions.filter((_, i) => i >= 5).map((a) => a.name),
      day_trips: [], // Could be enhanced with nearby destinations
    };
  }

  // DINING section
  if (guide_sections.includes('DINING')) {
    // Get restaurants
    const restaurantsResult = await query<POI>(
      `SELECT * FROM poi_database
       WHERE destination_id = $1
       AND poi_type = 'RESTAURANT'
       ORDER BY rating DESC NULLS LAST
       LIMIT 8`,
      [dest.destination_id]
    );

    const restaurants = restaurantsResult.rows.map((poi) => ({
      name: poi.poi_name,
      cuisine: poi.category?.join(', ') || 'Local cuisine',
      price_level: poi.price_level || '$$',
      signature_dish: poi.description || '',
      atmosphere: poi.tags?.includes('FINE_DINING') ? 'Upscale' : 'Casual',
    }));

    const diningGuide = existingGuides.find((g) => g.guide_type === 'WHERE_TO_EAT');

    response.dining = {
      must_try_dishes: dest.local_cuisine_highlights || [],
      recommended_restaurants: restaurants,
      food_neighborhoods: [],
      dining_tips: diningGuide?.tips || [
        'Try local specialties at traditional restaurants',
        'Ask locals for recommendations',
        'Check restaurant hours - many close between lunch and dinner',
      ],
    };
  }

  // PRACTICAL_INFO section
  if (guide_sections.includes('PRACTICAL_INFO')) {
    const practicalGuide = existingGuides.find((g) => g.guide_type === 'PRACTICAL_INFO');

    response.practical_info = {
      getting_around: practicalGuide?.content || 'Public transportation and taxis available',
      language_tips: dest.languages_spoken?.map((lang) => `${lang} is spoken here`) || [],
      safety_tips: [
        `Safety rating: ${dest.safety_rating}/5`,
        'Keep valuables secure',
        'Stay aware of surroundings',
      ],
      money_matters: `Local currency: ${dest.currency}. Credit cards widely accepted.`,
      what_to_pack: ['Comfortable walking shoes', 'Weather-appropriate clothing', 'Power adapter'],
    };
  }

  // If we don't have enough content, generate with AI
  if (
    (!response.overview?.introduction || response.overview.introduction.length < 100) &&
    guide_sections.includes('OVERVIEW')
  ) {
    try {
      const aiContent = await generateDestinationGuide({
        destination: dest.city,
        country: dest.country,
        guideType: 'OVERVIEW',
        travelerType: traveler_type,
        duration: duration_days,
      });

      if (response.overview) {
        response.overview.introduction = aiContent;
      }
    } catch (error) {
      console.error('Failed to generate AI content:', error);
    }
  }

  return response;
}
