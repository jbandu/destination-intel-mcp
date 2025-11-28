/**
 * MCP Tool: get-things-to-do
 * Get curated activity recommendations for a destination
 */

import { query, Destination, POI } from '../database/db.js';

export interface GetThingsToDoInput {
  destination: string;
  activity_types?: string[];
  traveler_type?: string;
  date_range?: {
    start_date?: string;
    end_date?: string;
  };
  budget_per_person?: number;
}

export interface Activity {
  activity_id: string;
  activity_name: string;
  category: string;
  description: string;
  duration: string;
  price_per_person: number;
  rating: number;
  review_count: number;
  highlights: string[];
  what_to_expect: string;
  included: string[];
  meeting_point: string;
  cancellation_policy: string;
  availability: {
    next_available: string;
    slots_remaining: number;
  };
  images: string[];
  why_recommended: string;
}

export interface ThingsToDoResponse {
  recommendations: Activity[];
  curated_collections: Array<{
    collection_name: string;
    activities: string[];
  }>;
}

export async function getThingsToDo(input: GetThingsToDoInput): Promise<ThingsToDoResponse> {
  const { destination, activity_types = [], traveler_type, budget_per_person } = input;

  // Get destination
  const destResult = await query<Destination>(
    `SELECT * FROM destinations WHERE LOWER(city) = LOWER($1) AND is_active = true LIMIT 1`,
    [destination]
  );

  if (destResult.rows.length === 0) {
    throw new Error(`Destination "${destination}" not found`);
  }

  const dest = destResult.rows[0];

  // Build POI query
  let poiQuery = `
    SELECT * FROM poi_database
    WHERE destination_id = $1
  `;
  const queryParams: any[] = [dest.destination_id];
  let paramIndex = 2;

  // Filter by activity types
  if (activity_types.length > 0) {
    const typeConditions = activity_types.map(() => `poi_type = $${paramIndex++}`).join(' OR ');
    poiQuery += ` AND (${typeConditions})`;
    queryParams.push(...activity_types.map((t) => t.toUpperCase()));
  }

  // Filter by budget
  if (budget_per_person) {
    // Map price levels to approximate costs
    const priceLevels: string[] = [];
    if (budget_per_person >= 100) priceLevels.push('$$$$');
    if (budget_per_person >= 50) priceLevels.push('$$$');
    if (budget_per_person >= 20) priceLevels.push('$$');
    if (budget_per_person >= 0) priceLevels.push('$', 'FREE');

    if (priceLevels.length > 0) {
      poiQuery += ` AND price_level = ANY($${paramIndex})`;
      queryParams.push(priceLevels);
      paramIndex++;
    }
  }

  poiQuery += ` ORDER BY is_must_see DESC, rating DESC NULLS LAST LIMIT 20`;

  const poisResult = await query<POI>(poiQuery, queryParams);

  // Convert POIs to activities
  const recommendations: Activity[] = poisResult.rows.map((poi) => {
    // Estimate price based on price level
    const priceMap: Record<string, number> = {
      FREE: 0,
      $: 15,
      $$: 35,
      $$$: 75,
      $$$$: 150,
    };

    const price = priceMap[poi.price_level || '$$'] || 35;

    return {
      activity_id: poi.poi_id,
      activity_name: poi.poi_name,
      category: poi.poi_type,
      description: poi.description || `Experience ${poi.poi_name} in ${destination}`,
      duration: poi.visit_duration_minutes ? `${poi.visit_duration_minutes} minutes` : '2-3 hours',
      price_per_person: price,
      rating: poi.rating || 4.0,
      review_count: poi.review_count || 100,
      highlights: poi.tags || [],
      what_to_expect: poi.description || 'A memorable experience',
      included: poi.category || [],
      meeting_point: poi.address || 'Location details provided after booking',
      cancellation_policy: 'Free cancellation up to 24 hours before',
      availability: {
        next_available: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        slots_remaining: Math.floor(Math.random() * 20) + 5,
      },
      images: poi.images || [],
      why_recommended:
        poi.is_must_see ? 'Must-see attraction - highly recommended' : 'Popular with visitors',
    };
  });

  // Create curated collections
  const collections: Array<{ collection_name: string; activities: string[] }> = [];

  // Top 10 must-do
  const mustDo = recommendations.filter((a) => a.why_recommended.includes('Must-see')).slice(0, 10);
  if (mustDo.length > 0) {
    collections.push({
      collection_name: 'Top 10 Must-Do Experiences',
      activities: mustDo.map((a) => a.activity_name),
    });
  }

  // Budget-friendly
  const budgetFriendly = recommendations.filter((a) => a.price_per_person <= 20).slice(0, 8);
  if (budgetFriendly.length > 0) {
    collections.push({
      collection_name: 'Budget-Friendly Activities',
      activities: budgetFriendly.map((a) => a.activity_name),
    });
  }

  // Family-friendly
  if (traveler_type === 'FAMILY' || traveler_type === 'FAMILIES') {
    const familyActivities = recommendations
      .filter((a) => a.category !== 'NIGHTLIFE')
      .slice(0, 8);
    collections.push({
      collection_name: 'Perfect for Families',
      activities: familyActivities.map((a) => a.activity_name),
    });
  }

  // Romantic
  if (traveler_type === 'COUPLE' || traveler_type === 'COUPLES') {
    const romanticActivities = recommendations
      .filter((a) => a.highlights.some((h) => /romantic|sunset|dinner|wine/i.test(h)))
      .slice(0, 6);
    if (romanticActivities.length > 0) {
      collections.push({
        collection_name: 'Romantic Experiences',
        activities: romanticActivities.map((a) => a.activity_name),
      });
    }
  }

  // Food & drink
  const foodActivities = recommendations.filter((a) => a.category === 'RESTAURANT').slice(0, 8);
  if (foodActivities.length > 0) {
    collections.push({
      collection_name: 'Food & Culinary Experiences',
      activities: foodActivities.map((a) => a.activity_name),
    });
  }

  return {
    recommendations,
    curated_collections: collections,
  };
}
