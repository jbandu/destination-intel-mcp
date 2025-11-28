/**
 * Remaining MCP Tools: 6-10
 * - generate-travel-inspiration
 * - get-seasonal-insights
 * - analyze-content-performance
 * - get-local-insights
 * - compare-destinations
 */

import { query, Destination, SeasonalEvent } from '../database/db.js';
import { generateInspirationContent } from '../services/openai.js';

// =====================================================
// Tool 6: generate-travel-inspiration
// =====================================================

export interface GenerateInspirationInput {
  content_type: string;
  theme: string;
  target_destination?: string;
  target_audience?: string;
  tone?: string;
  word_count?: number;
}

export interface InspirationResponse {
  content: {
    title: string;
    subtitle: string;
    body: string;
    call_to_action: string;
    related_packages: string[];
    images: string[];
    estimated_read_time: number;
  };
  seo_metadata: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
  };
}

export async function generateTravelInspiration(
  input: GenerateInspirationInput
): Promise<InspirationResponse> {
  const {
    content_type,
    theme,
    target_destination,
    target_audience = 'travelers',
    tone = 'INSPIRING',
    word_count = 500,
  } = input;

  // Generate content with AI
  const aiContent = await generateInspirationContent({
    contentType: content_type,
    theme,
    destination: target_destination,
    targetAudience: target_audience,
    tone,
    wordCount: word_count,
  });

  // Get related images if destination specified
  let images: string[] = [];
  if (target_destination) {
    const destResult = await query<Destination>(
      `SELECT gallery_images, hero_image_url FROM destinations
       WHERE LOWER(city) = LOWER($1) LIMIT 1`,
      [target_destination]
    );

    if (destResult.rows.length > 0) {
      const dest = destResult.rows[0];
      images = [...(dest.gallery_images || []), dest.hero_image_url].filter(Boolean) as string[];
    }
  }

  // Calculate read time (average 200 words per minute)
  const estimatedReadTime = Math.ceil(word_count / 200);

  // Generate SEO metadata
  const seoMetadata = {
    meta_title: aiContent.title,
    meta_description: aiContent.subtitle,
    keywords: [
      theme.toLowerCase(),
      target_destination?.toLowerCase() || 'travel',
      target_audience,
      'vacation',
      'travel guide',
    ],
  };

  // Save to database
  try {
    await query(
      `INSERT INTO inspiration_content (
        content_type, title, subtitle, theme, content,
        call_to_action, target_audience, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        content_type,
        aiContent.title,
        aiContent.subtitle,
        theme,
        aiContent.body,
        aiContent.callToAction,
        [target_audience],
      ]
    );
  } catch (error) {
    console.error('Failed to save inspiration content:', error);
  }

  return {
    content: {
      title: aiContent.title,
      subtitle: aiContent.subtitle,
      body: aiContent.body,
      call_to_action: aiContent.callToAction,
      related_packages: [], // Could be enhanced with package integration
      images: images.slice(0, 5),
      estimated_read_time: estimatedReadTime,
    },
    seo_metadata: seoMetadata,
  };
}

// =====================================================
// Tool 7: get-seasonal-insights
// =====================================================

export interface GetSeasonalInsightsInput {
  destination: string;
  month?: string;
  include_events?: boolean;
  include_weather?: boolean;
}

export interface SeasonalInsightsResponse {
  seasonal_overview: {
    destination: string;
    month: string;
    season: string;
    overall_rating: string;
    why_visit_now: string[];
  };
  weather?: {
    average_temp_c: number;
    precipitation_mm: number;
    humidity_percentage: number;
    description: string;
  };
  events: Array<{
    event_name: string;
    event_type: string;
    dates: string;
    description: string;
    why_attend: string;
  }>;
  crowd_levels: {
    tourist_volume: string;
    hotel_availability: string;
    price_trends: string;
  };
  what_to_pack: string[];
  insider_tips: string[];
}

export async function getSeasonalInsights(
  input: GetSeasonalInsightsInput
): Promise<SeasonalInsightsResponse> {
  const { destination, month, include_events = true, include_weather = true } = input;

  // Get destination
  const destResult = await query<Destination>(
    `SELECT * FROM destinations WHERE LOWER(city) = LOWER($1) AND is_active = true LIMIT 1`,
    [destination]
  );

  if (destResult.rows.length === 0) {
    throw new Error(`Destination "${destination}" not found`);
  }

  const dest = destResult.rows[0];
  const currentMonth = month || new Date().toLocaleString('en-US', { month: 'long' });

  // Determine season
  const seasons: Record<string, string[]> = {
    Winter: ['December', 'January', 'February'],
    Spring: ['March', 'April', 'May'],
    Summer: ['June', 'July', 'August'],
    Fall: ['September', 'October', 'November'],
  };

  let season = 'Year-round';
  for (const [s, months] of Object.entries(seasons)) {
    if (months.includes(currentMonth)) {
      season = s;
      break;
    }
  }

  // Get weather info
  const monthIndex = new Date(`${currentMonth} 1, 2024`).getMonth() + 1;
  const monthKey = new Date(2024, monthIndex - 1).toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const avgTemp = dest.average_temp_celsius?.[monthKey] || 20;

  // Check if it's best time to visit
  const isBestTime = dest.best_time_to_visit?.months?.includes(currentMonth) || false;

  const whyVisitNow: string[] = [];
  if (isBestTime) {
    whyVisitNow.push('Optimal weather conditions');
    whyVisitNow.push('Peak travel season with best experiences');
  } else {
    whyVisitNow.push('Lower prices outside peak season');
    whyVisitNow.push('Fewer crowds at popular attractions');
  }

  // Overall rating
  const overallRating = isBestTime ? 'Excellent' : avgTemp > 30 || avgTemp < 10 ? 'Fair' : 'Good';

  // Get events
  let events: SeasonalInsightsResponse['events'] = [];
  if (include_events) {
    const eventsResult = await query<SeasonalEvent>(
      `SELECT * FROM seasonal_events
       WHERE destination_id = $1
       AND EXTRACT(MONTH FROM start_date) = $2
       ORDER BY relevance_score DESC
       LIMIT 5`,
      [dest.destination_id, monthIndex]
    );

    events = eventsResult.rows.map((event) => ({
      event_name: event.event_name,
      event_type: event.event_type,
      dates: `${event.start_date.toLocaleDateString()} - ${event.end_date.toLocaleDateString()}`,
      description: event.description || '',
      why_attend: event.relevance_score && event.relevance_score > 0.8 ? 'Must-attend event' : 'Interesting cultural experience',
    }));

    if (events.length > 0) {
      whyVisitNow.push(`${events.length} special events happening`);
    }
  }

  // Crowd levels
  const crowdLevels = {
    tourist_volume: isBestTime ? 'High' : 'Moderate',
    hotel_availability: isBestTime ? 'Limited - book early' : 'Good availability',
    price_trends: isBestTime ? 'Peak prices' : 'Value season pricing',
  };

  // Packing recommendations
  const whatToPack: string[] = [];
  if (avgTemp > 25) {
    whatToPack.push('Light, breathable clothing', 'Sunscreen and hat', 'Sunglasses');
  } else if (avgTemp < 15) {
    whatToPack.push('Warm layers', 'Light jacket', 'Comfortable walking shoes');
  } else {
    whatToPack.push('Versatile layers', 'Light jacket for evenings', 'Comfortable shoes');
  }
  whatToPack.push('Camera', 'Reusable water bottle');

  // Insider tips
  const insiderTips: string[] = [
    isBestTime ? 'Book accommodations 2-3 months in advance' : 'You can find great last-minute deals',
    'Download offline maps before you go',
    `Best time for photos: early morning or golden hour`,
  ];

  return {
    seasonal_overview: {
      destination: dest.city,
      month: currentMonth,
      season,
      overall_rating: overallRating,
      why_visit_now: whyVisitNow,
    },
    weather: include_weather
      ? {
          average_temp_c: avgTemp,
          precipitation_mm: avgTemp > 25 ? 50 : 100,
          humidity_percentage: avgTemp > 25 ? 70 : 60,
          description:
            avgTemp > 25
              ? 'Warm and sunny'
              : avgTemp < 15
                ? 'Cool and pleasant'
                : 'Mild temperatures',
        }
      : undefined,
    events,
    crowd_levels: crowdLevels,
    what_to_pack: whatToPack,
    insider_tips: insiderTips,
  };
}

// =====================================================
// Tool 8: analyze-content-performance
// =====================================================

export interface AnalyzeContentPerformanceInput {
  analysis_period?: {
    start_date: string;
    end_date: string;
  };
  content_type?: string;
}

export interface ContentPerformanceResponse {
  summary: {
    total_content_views: number;
    total_interactions: number;
    average_time_on_page: number;
    conversion_rate: number;
  };
  top_performing_destinations: Array<{
    destination: string;
    views: number;
    bookings: number;
    conversion_rate: number;
    revenue_generated: number;
  }>;
  content_insights: Array<{
    insight: string;
    recommendation: string;
  }>;
}

export async function analyzeContentPerformance(
  input: AnalyzeContentPerformanceInput
): Promise<ContentPerformanceResponse> {
  const period = input.analysis_period || {
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString(),
  };

  // Get content performance
  const contentResult = await query(
    `SELECT
      SUM(view_count) as total_views,
      SUM(click_count) as total_clicks,
      SUM(conversion_count) as total_conversions,
      AVG(conversion_rate) as avg_conversion_rate
     FROM inspiration_content
     WHERE created_at BETWEEN $1 AND $2
     ${input.content_type ? 'AND content_type = $3' : ''}`,
    input.content_type ? [period.start_date, period.end_date, input.content_type] : [period.start_date, period.end_date]
  );

  const stats = contentResult.rows[0];

  // Get top destinations
  const topDestsResult = await query(
    `SELECT
      d.city as destination,
      COUNT(DISTINCT trl.log_id) as recommendation_count,
      COUNT(DISTINCT CASE WHEN trl.booked_destination = d.city THEN trl.log_id END) as booking_count,
      SUM(COALESCE(trl.conversion_value_usd, 0)) as revenue
     FROM destinations d
     LEFT JOIN travel_recommendations_log trl ON d.city = trl.booked_destination
     WHERE trl.timestamp BETWEEN $1 AND $2
     GROUP BY d.city
     ORDER BY booking_count DESC
     LIMIT 10`,
    [period.start_date, period.end_date]
  );

  const topDestinations = topDestsResult.rows.map((row: any) => ({
    destination: row.destination,
    views: row.recommendation_count || 0,
    bookings: row.booking_count || 0,
    conversion_rate: row.recommendation_count > 0
      ? Math.round((row.booking_count / row.recommendation_count) * 100 * 100) / 100
      : 0,
    revenue_generated: parseFloat(row.revenue) || 0,
  }));

  // Generate insights
  const insights: Array<{ insight: string; recommendation: string }> = [];

  const avgConversionRate = parseFloat(stats.avg_conversion_rate) || 0;
  if (avgConversionRate < 5) {
    insights.push({
      insight: 'Conversion rates below industry average (5-8%)',
      recommendation: 'Enhance content with more personalization and compelling CTAs',
    });
  } else if (avgConversionRate > 8) {
    insights.push({
      insight: 'Excellent conversion rates above 8%',
      recommendation: 'Scale winning content strategies to other destinations',
    });
  }

  if (topDestinations.length > 0 && topDestinations[0].bookings > 0) {
    insights.push({
      insight: `${topDestinations[0].destination} is the top converting destination`,
      recommendation: `Create more content highlighting ${topDestinations[0].destination}`,
    });
  }

  return {
    summary: {
      total_content_views: parseInt(stats.total_views) || 0,
      total_interactions: parseInt(stats.total_clicks) || 0,
      average_time_on_page: 180, // Placeholder
      conversion_rate: avgConversionRate,
    },
    top_performing_destinations: topDestinations,
    content_insights: insights,
  };
}

// =====================================================
// Tool 9: get-local-insights
// =====================================================

export interface GetLocalInsightsInput {
  destination: string;
  insight_categories?: string[];
}

export interface LocalInsightsResponse {
  cultural_insights: {
    greetings: string;
    tipping_customs: string;
    dress_code: string;
    business_etiquette: string;
    dos_and_donts: string[];
  };
  practical_tips: {
    best_way_to_get_around: string;
    money_saving_tips: string[];
    safety_considerations: string[];
    language_basics: Record<string, string>;
  };
  insider_secrets: string[];
  common_tourist_mistakes: string[];
}

export async function getLocalInsights(input: GetLocalInsightsInput): Promise<LocalInsightsResponse> {
  const { destination } = input;

  const destResult = await query<Destination>(
    `SELECT * FROM destinations WHERE LOWER(city) = LOWER($1) AND is_active = true LIMIT 1`,
    [destination]
  );

  if (destResult.rows.length === 0) {
    throw new Error(`Destination "${destination}" not found`);
  }

  const dest = destResult.rows[0];

  // Build response based on destination data
  const response: LocalInsightsResponse = {
    cultural_insights: {
      greetings: dest.languages_spoken?.[0] === 'English'
        ? 'English is widely spoken'
        : `Learn basic ${dest.languages_spoken?.[0] || 'local'} phrases - locals appreciate the effort`,
      tipping_customs: dest.continent === 'Europe'
        ? 'Tipping is less common; 5-10% for excellent service'
        : dest.continent === 'Asia'
          ? 'Tipping not expected in most places'
          : '15-20% standard for restaurants and services',
      dress_code: dest.destination_type?.includes('LUXURY')
        ? 'Smart casual for dining, modest attire for religious sites'
        : 'Casual dress acceptable, but dress modestly for religious sites',
      business_etiquette: 'Punctuality is appreciated, exchange business cards respectfully',
      dos_and_donts: [
        'Do respect local customs and traditions',
        "Don't photograph people without permission",
        'Do try local cuisine',
        "Don't litter or disrespect sacred sites",
      ],
    },
    practical_tips: {
      best_way_to_get_around: dest.tourist_infrastructure_rating && dest.tourist_infrastructure_rating >= 4
        ? 'Excellent public transportation available - metro, buses, and taxis'
        : 'Taxis and ride-sharing apps are reliable and affordable',
      money_saving_tips: [
        'Eat where locals eat - cheaper and more authentic',
        'Use public transportation instead of taxis',
        'Buy tickets online for popular attractions to save time and money',
        `Visit during shoulder season (${dest.best_time_to_visit?.months?.slice(-1)[0] || 'off-peak'} onwards) for better deals`,
      ],
      safety_considerations: [
        `Safety rating: ${dest.safety_rating}/5 - generally safe for tourists`,
        'Keep valuables secure and stay aware of surroundings',
        'Use licensed taxis or official ride-sharing apps',
        'Keep copies of important documents',
      ],
      language_basics: {
        Hello: dest.languages_spoken?.[0] === 'Spanish' ? 'Hola' : 'Hello',
        'Thank you': dest.languages_spoken?.[0] === 'Spanish' ? 'Gracias' : 'Thank you',
        'How much?': dest.languages_spoken?.[0] === 'Spanish' ? '¿Cuánto cuesta?' : 'How much?',
        'Where is?': dest.languages_spoken?.[0] === 'Spanish' ? '¿Dónde está?' : 'Where is?',
      },
    },
    insider_secrets: [
      'Visit popular attractions early morning to avoid crowds',
      'Ask hotel concierge for local restaurant recommendations',
      `Best local experience: ${dest.popular_activities?.[0] || 'explore local neighborhoods'}`,
      'Download offline maps and translation apps before you go',
    ],
    common_tourist_mistakes: [
      'Not booking popular attractions in advance',
      'Eating only at touristy restaurants on main streets',
      'Not allowing enough time between activities',
      'Overpacking - you can buy most things locally',
      'Not checking local holidays and closures',
    ],
  };

  return response;
}

// =====================================================
// Tool 10: compare-destinations
// =====================================================

export interface CompareDestinationsInput {
  destinations: string[];
  comparison_criteria?: string[];
}

export interface CompareDestinationsResponse {
  comparison_matrix: {
    destinations: string[];
    criteria: Array<{
      criterion: string;
      values: Record<string, string>;
      winner?: string;
    }>;
  };
  recommendation: {
    best_for_budget: string;
    best_for_weather: string;
    best_for_culture: string;
    overall_recommendation: string;
  };
}

export async function compareDestinations(
  input: CompareDestinationsInput
): Promise<CompareDestinationsResponse> {
  const { destinations, comparison_criteria = ['COST', 'WEATHER', 'ACTIVITIES', 'CULTURE'] } = input;

  if (destinations.length < 2 || destinations.length > 4) {
    throw new Error('Please provide 2-4 destinations to compare');
  }

  // Get all destinations
  const destsResult = await query<Destination>(
    `SELECT * FROM destinations
     WHERE LOWER(city) = ANY($1)
     AND is_active = true`,
    [destinations.map((d) => d.toLowerCase())]
  );

  if (destsResult.rows.length < destinations.length) {
    throw new Error('One or more destinations not found');
  }

  const dests = destsResult.rows;
  const criteria: CompareDestinationsResponse['comparison_matrix']['criteria'] = [];

  // Cost comparison
  if (comparison_criteria.includes('COST')) {
    const values: Record<string, string> = {};
    let minCost = Infinity;
    let budgetWinner = '';

    dests.forEach((dest) => {
      const cost = dest.average_daily_cost_usd || 100;
      values[dest.city] = `$${cost}/day`;
      if (cost < minCost) {
        minCost = cost;
        budgetWinner = dest.city;
      }
    });

    criteria.push({
      criterion: 'Average Daily Cost',
      values,
      winner: budgetWinner,
    });
  }

  // Weather (use current month)
  if (comparison_criteria.includes('WEATHER')) {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const values: Record<string, string> = {};

    dests.forEach((dest) => {
      const temp = dest.average_temp_celsius?.[currentMonth] || 20;
      values[dest.city] = `${temp}°C`;
    });

    criteria.push({
      criterion: 'Average Temperature (Current Month)',
      values,
    });
  }

  // Activities
  if (comparison_criteria.includes('ACTIVITIES')) {
    const values: Record<string, string> = {};
    let maxActivities = 0;
    let activityWinner = '';

    dests.forEach((dest) => {
      const count = dest.popular_activities?.length || 0;
      values[dest.city] = `${count} popular activities`;
      if (count > maxActivities) {
        maxActivities = count;
        activityWinner = dest.city;
      }
    });

    criteria.push({
      criterion: 'Popular Activities',
      values,
      winner: activityWinner,
    });
  }

  // Culture
  if (comparison_criteria.includes('CULTURE')) {
    const values: Record<string, string> = {};

    dests.forEach((dest) => {
      values[dest.city] = dest.destination_type?.join(', ') || 'General tourism';
    });

    criteria.push({
      criterion: 'Destination Type',
      values,
    });
  }

  // Family-friendly
  if (comparison_criteria.includes('FAMILY_FRIENDLY')) {
    const values: Record<string, string> = {};

    dests.forEach((dest) => {
      const isFamilyFriendly = dest.destination_type?.includes('FAMILY');
      values[dest.city] = isFamilyFriendly ? 'Excellent' : 'Good';
    });

    criteria.push({
      criterion: 'Family-Friendly',
      values,
    });
  }

  // Determine overall recommendations
  const budgetDest = dests.reduce((min, dest) =>
    (dest.average_daily_cost_usd || 100) < (min.average_daily_cost_usd || 100) ? dest : min
  );

  const cultureDest = dests.find((d) => d.destination_type?.includes('CULTURAL')) || dests[0];

  return {
    comparison_matrix: {
      destinations: dests.map((d) => d.city),
      criteria,
    },
    recommendation: {
      best_for_budget: budgetDest.city,
      best_for_weather: dests[0].city, // Could be enhanced with seasonal logic
      best_for_culture: cultureDest.city,
      overall_recommendation: `Based on your comparison, ${dests[0].city} offers a great balance of experiences. However, each destination has unique strengths worth considering.`,
    },
  };
}
