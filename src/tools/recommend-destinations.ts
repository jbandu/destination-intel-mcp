/**
 * MCP Tool: recommend-destinations
 * Recommend destinations based on passenger preferences and behavior
 */

import { query, Destination, UserTravelPreferences } from '../database/db.js';
import { personalizeRecommendations } from '../services/openai.js';

export interface RecommendDestinationsInput {
  passenger_id?: string;
  context?: {
    travel_month?: string;
    budget_range?: {
      min: number;
      max: number;
    };
    interests?: string[];
    previous_destinations?: string[];
  };
  constraints?: {
    max_flight_hours?: number;
    climate_preference?: string;
    language_preference?: string[];
  };
  recommendation_count?: number;
}

export interface DestinationRecommendation {
  rank: number;
  destination: string;
  country: string;
  match_score: number;
  match_reasons: string[];
  destination_highlights: string[];
  estimated_budget: number;
  best_time_to_visit: string;
  flight_duration?: string;
  why_now: string;
  hero_image: string;
  call_to_action: string;
}

export interface RecommendationsResponse {
  recommendations: DestinationRecommendation[];
  inspiration_themes: Array<{
    theme: string;
    destinations: string[];
  }>;
}

export async function recommendDestinations(
  input: RecommendDestinationsInput
): Promise<RecommendationsResponse> {
  const { passenger_id, context = {}, recommendation_count = 5 } = input;

  // Get user preferences if passenger_id provided
  let userPreferences: UserTravelPreferences | null = null;
  if (passenger_id) {
    const prefResult = await query<UserTravelPreferences>(
      `SELECT * FROM user_travel_preferences WHERE passenger_id = $1`,
      [passenger_id]
    );
    if (prefResult.rows.length > 0) {
      userPreferences = prefResult.rows[0];
    }
  }

  // Build query to get candidate destinations
  let queryText = `
    SELECT
      d.*,
      COALESCE(COUNT(DISTINCT trl.log_id), 0) as popularity_score
    FROM destinations d
    LEFT JOIN travel_recommendations_log trl
      ON d.city = ANY(SELECT jsonb_array_elements_text(trl.recommendations_shown))
    WHERE d.is_active = true
  `;

  const queryParams: any[] = [];
  let paramIndex = 1;

  // Apply budget filter
  if (context.budget_range) {
    queryText += ` AND d.average_daily_cost_usd BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    queryParams.push(context.budget_range.min, context.budget_range.max);
    paramIndex += 2;
  }

  // Apply interest/activity filters
  if (context.interests && context.interests.length > 0) {
    queryText += ` AND d.destination_type && $${paramIndex}`;
    queryParams.push(context.interests);
    paramIndex += 1;
  }

  // Exclude previous destinations
  if (context.previous_destinations && context.previous_destinations.length > 0) {
    queryText += ` AND d.city NOT IN (${context.previous_destinations.map((_, i) => `$${paramIndex + i}`).join(',')})`;
    queryParams.push(...context.previous_destinations);
    paramIndex += context.previous_destinations.length;
  }

  queryText += `
    GROUP BY d.destination_id
    ORDER BY popularity_score DESC, d.tourist_infrastructure_rating DESC
    LIMIT ${recommendation_count * 2}
  `;

  const destinationsResult = await query<Destination & { popularity_score: number }>(queryText, queryParams);

  if (destinationsResult.rows.length === 0) {
    return {
      recommendations: [],
      inspiration_themes: [],
    };
  }

  // Calculate match scores
  const candidateDestinations = destinationsResult.rows.map((dest) => {
    let matchScore = 50; // Base score

    // Boost score based on user preferences
    if (userPreferences) {
      // Interest matching
      const destTypes = dest.destination_type || [];
      const userInterests = userPreferences.interests || [];
      const interestMatch = destTypes.filter((type) =>
        userInterests.some((interest) => interest.toUpperCase().includes(type))
      ).length;
      matchScore += interestMatch * 10;

      // Budget matching
      if (dest.budget_level === userPreferences.budget_preference) {
        matchScore += 15;
      }

      // Bucket list matching
      if (userPreferences.bucket_list_destinations?.includes(dest.city)) {
        matchScore += 25;
      }
    }

    // Context-based scoring
    if (context.interests) {
      const destTypes = dest.destination_type || [];
      const contextMatch = destTypes.filter((type) =>
        context.interests!.some((interest) => interest.toUpperCase() === type)
      ).length;
      matchScore += contextMatch * 15;
    }

    // Seasonal scoring
    if (context.travel_month) {
      const bestMonths = dest.best_time_to_visit?.months || [];
      if (bestMonths.includes(context.travel_month)) {
        matchScore += 20;
      }
    }

    // Popularity boost
    matchScore += Math.min(dest.popularity_score * 2, 10);

    // Infrastructure quality
    if (dest.tourist_infrastructure_rating) {
      matchScore += dest.tourist_infrastructure_rating * 2;
    }

    return {
      ...dest,
      match_score: Math.min(matchScore, 100),
    };
  });

  // Sort by match score
  candidateDestinations.sort((a, b) => b.match_score - a.match_score);

  // Take top recommendations
  const topDestinations = candidateDestinations.slice(0, recommendation_count);

  // Use AI to personalize if we have user preferences
  let personalizedDestinations = topDestinations;
  if (userPreferences || context.interests) {
    try {
      personalizedDestinations = await personalizeRecommendations({
        userPreferences: {
          ...userPreferences,
          context_interests: context.interests,
          context_month: context.travel_month,
        },
        candidateDestinations: topDestinations,
      });
    } catch (error) {
      console.error('AI personalization failed, using basic recommendations:', error);
    }
  }

  // Format recommendations
  const recommendations: DestinationRecommendation[] = personalizedDestinations.map((dest, index) => {
    const matchReasons: string[] = [];

    if (context.travel_month && dest.best_time_to_visit?.months?.includes(context.travel_month)) {
      matchReasons.push(`Perfect weather in ${context.travel_month}`);
    }

    if (context.interests) {
      const matching = dest.destination_type?.filter((type) =>
        context.interests!.includes(type.toLowerCase())
      );
      if (matching && matching.length > 0) {
        matchReasons.push(`Matches your interest in ${matching[0].toLowerCase()}`);
      }
    }

    if (dest.safety_rating && dest.safety_rating >= 4.0) {
      matchReasons.push('High safety rating');
    }

    if (dest.tourist_infrastructure_rating && dest.tourist_infrastructure_rating >= 4.5) {
      matchReasons.push('Excellent tourist infrastructure');
    }

    if (matchReasons.length === 0) {
      matchReasons.push('Popular destination');
      matchReasons.push('Great for first-time visitors');
    }

    return {
      rank: index + 1,
      destination: dest.city,
      country: dest.country,
      match_score: dest.match_score,
      match_reasons: matchReasons.slice(0, 3),
      destination_highlights: dest.famous_attractions?.slice(0, 4) || [],
      estimated_budget: dest.average_daily_cost_usd || 100,
      best_time_to_visit: dest.best_time_to_visit?.months?.join(', ') || 'Year-round',
      why_now: dest.best_time_to_visit?.weather || 'Great time to visit',
      hero_image: dest.hero_image_url || '',
      call_to_action: `Explore ${dest.city} packages from $${Math.round((dest.average_daily_cost_usd || 100) * 3)}`,
    };
  });

  // Generate inspiration themes
  const themes = new Map<string, string[]>();
  destinationsResult.rows.forEach((dest) => {
    dest.destination_type?.forEach((type) => {
      if (!themes.has(type)) {
        themes.set(type, []);
      }
      const cities = themes.get(type)!;
      if (cities.length < 5) {
        cities.push(dest.city);
      }
    });
  });

  const inspiration_themes = Array.from(themes.entries()).map(([theme, destinations]) => ({
    theme: theme.charAt(0) + theme.slice(1).toLowerCase(),
    destinations,
  }));

  // Log recommendation for analytics
  if (passenger_id) {
    try {
      await query(
        `INSERT INTO travel_recommendations_log (
          passenger_id, session_id, recommendations_shown, timestamp
        ) VALUES ($1, $2, $3, NOW())`,
        [
          passenger_id,
          `session_${Date.now()}`,
          JSON.stringify(recommendations.map((r) => ({ destination: r.destination, score: r.match_score }))),
        ]
      );
    } catch (error) {
      console.error('Failed to log recommendation:', error);
    }
  }

  return {
    recommendations,
    inspiration_themes: inspiration_themes.slice(0, 3),
  };
}
