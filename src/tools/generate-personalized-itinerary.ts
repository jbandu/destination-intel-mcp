/**
 * MCP Tool: generate-personalized-itinerary
 * Generate personalized travel itinerary based on preferences and trip details
 */

import { query, Destination, ItineraryTemplate } from '../database/db.js';
import { generateItinerary } from '../services/openai.js';

export interface GenerateItineraryInput {
  destination: string;
  duration_days: number;
  traveler_profile?: {
    traveler_type?: string;
    interests?: string[];
    pace_preference?: string;
    budget_level?: string;
    must_see_attractions?: string[];
  };
  travel_dates?: {
    arrival_date?: string;
    departure_date?: string;
  };
}

export interface ItineraryResponse {
  itinerary: {
    destination: string;
    total_days: number;
    travel_style: string;
    overview: string;
  };
  daily_schedule: Array<{
    day: number;
    date?: string;
    theme: string;
    morning: {
      activity: string;
      location: string;
      duration: string;
      why_this: string;
      tips: string[];
    };
    afternoon: {
      activity: string;
      location: string;
      duration: string;
      why_this: string;
      tips: string[];
    };
    evening: {
      activity: string;
      location: string;
      duration: string;
      why_this: string;
      tips: string[];
    };
    meals: {
      breakfast: string;
      lunch: string;
      dinner: string;
    };
    estimated_cost: number;
    walking_distance_km: number;
  }>;
  alternative_options: Array<{
    day: number;
    original_activity: string;
    alternative: string;
    reason: string;
  }>;
  packing_list: string[];
  budget_breakdown: {
    meals: number;
    activities: number;
    transportation: number;
    total_per_day: number;
  };
}

export async function generatePersonalizedItinerary(
  input: GenerateItineraryInput
): Promise<ItineraryResponse> {
  const { destination, duration_days, traveler_profile = {} } = input;

  // Validate inputs
  if (duration_days < 1 || duration_days > 30) {
    throw new Error('Duration must be between 1 and 30 days');
  }

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

  // Check if we have a matching template
  const templateResult = await query<ItineraryTemplate>(
    `SELECT * FROM itinerary_templates
     WHERE destination_id = $1
     AND duration_days = $2
     ${traveler_profile.traveler_type ? 'AND LOWER(target_audience) = LOWER($3)' : ''}
     AND is_featured = true
     ORDER BY usage_count DESC, average_rating DESC NULLS LAST
     LIMIT 1`,
    traveler_profile.traveler_type
      ? [dest.destination_id, duration_days, traveler_profile.traveler_type]
      : [dest.destination_id, duration_days]
  );

  // If we have a template, use it as a base
  if (templateResult.rows.length > 0) {
    const template = templateResult.rows[0];

    // Update usage count
    await query(
      `UPDATE itinerary_templates
       SET usage_count = usage_count + 1
       WHERE template_id = $1`,
      [template.template_id]
    );

    // Convert template to response format
    const response: ItineraryResponse = {
      itinerary: {
        destination: dest.city,
        total_days: duration_days,
        travel_style: template.trip_style,
        overview: `Experience the best of ${dest.city} in ${duration_days} days with this ${template.trip_style.toLowerCase()} itinerary.`,
      },
      daily_schedule: template.daily_schedule || [],
      alternative_options: [],
      packing_list: template.packing_list || [],
      budget_breakdown: template.budget_breakdown || {
        meals: Math.round((dest.average_daily_cost_usd || 100) * 0.4),
        activities: Math.round((dest.average_daily_cost_usd || 100) * 0.4),
        transportation: Math.round((dest.average_daily_cost_usd || 100) * 0.2),
        total_per_day: dest.average_daily_cost_usd || 100,
      },
    };

    return response;
  }

  // No template found - generate with AI
  console.log('No template found, generating itinerary with AI...');

  try {
    const aiItinerary = await generateItinerary({
      destination: dest.city,
      country: dest.country,
      durationDays: duration_days,
      travelerProfile: {
        ...traveler_profile,
        budget: dest.average_daily_cost_usd,
        destination_type: dest.destination_type,
        popular_activities: dest.popular_activities,
      },
      mustSeeAttractions: traveler_profile.must_see_attractions || dest.famous_attractions?.slice(0, 5),
    });

    // Enhance AI response with destination data
    const response: ItineraryResponse = {
      ...aiItinerary,
      itinerary: {
        ...aiItinerary.itinerary,
        destination: dest.city,
      },
      alternative_options: aiItinerary.alternative_options || [],
      packing_list: aiItinerary.packing_list || [
        'Comfortable walking shoes',
        'Weather-appropriate clothing',
        'Camera',
        'Power adapter',
        'Reusable water bottle',
      ],
      budget_breakdown: aiItinerary.budget_breakdown || {
        meals: Math.round((dest.average_daily_cost_usd || 100) * 0.4),
        activities: Math.round((dest.average_daily_cost_usd || 100) * 0.4),
        transportation: Math.round((dest.average_daily_cost_usd || 100) * 0.2),
        total_per_day: dest.average_daily_cost_usd || 100,
      },
    };

    // Save generated itinerary as a template for future use
    try {
      await query(
        `INSERT INTO itinerary_templates (
          destination_id, template_name, duration_days, trip_style,
          target_audience, daily_schedule, estimated_cost_usd,
          packing_list, budget_breakdown, usage_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)`,
        [
          dest.destination_id,
          `AI-Generated ${duration_days}-Day ${traveler_profile.traveler_type || 'General'} Itinerary`,
          duration_days,
          traveler_profile.pace_preference || 'BALANCED',
          traveler_profile.traveler_type || 'GENERAL',
          JSON.stringify(response.daily_schedule),
          response.budget_breakdown.total_per_day * duration_days,
          JSON.stringify(response.packing_list),
          JSON.stringify(response.budget_breakdown),
        ]
      );
    } catch (error) {
      console.error('Failed to save generated itinerary as template:', error);
    }

    return response;
  } catch (error) {
    console.error('Failed to generate itinerary with AI:', error);

    // Fallback to basic itinerary
    return {
      itinerary: {
        destination: dest.city,
        total_days: duration_days,
        travel_style: 'BALANCED',
        overview: `Explore ${dest.city} at your own pace. This ${duration_days}-day itinerary covers the highlights.`,
      },
      daily_schedule: Array.from({ length: duration_days }, (_, i) => ({
        day: i + 1,
        theme: i === 0 ? 'Arrival & City Introduction' : `Day ${i + 1} Exploration`,
        morning: {
          activity: dest.famous_attractions?.[i * 2] || 'Explore local area',
          location: dest.city,
          duration: '2-3 hours',
          why_this: 'Popular attraction',
          tips: ['Arrive early', 'Book tickets in advance'],
        },
        afternoon: {
          activity: dest.famous_attractions?.[i * 2 + 1] || 'Local cuisine exploration',
          location: dest.city,
          duration: '3-4 hours',
          why_this: 'Must-see experience',
          tips: ['Take your time', 'Enjoy the experience'],
        },
        evening: {
          activity: 'Dinner and local nightlife',
          location: dest.city,
          duration: '2-3 hours',
          why_this: 'Experience local culture',
          tips: ['Try local specialties', 'Ask locals for recommendations'],
        },
        meals: {
          breakfast: 'Hotel or local café',
          lunch: 'Local restaurant',
          dinner: 'Traditional cuisine',
        },
        estimated_cost: dest.average_daily_cost_usd || 100,
        walking_distance_km: 5,
      })),
      alternative_options: [],
      packing_list: [
        'Comfortable walking shoes',
        'Weather-appropriate clothing',
        'Camera',
        'Travel documents',
      ],
      budget_breakdown: {
        meals: Math.round((dest.average_daily_cost_usd || 100) * 0.4),
        activities: Math.round((dest.average_daily_cost_usd || 100) * 0.4),
        transportation: Math.round((dest.average_daily_cost_usd || 100) * 0.2),
        total_per_day: dest.average_daily_cost_usd || 100,
      },
    };
  }
}
