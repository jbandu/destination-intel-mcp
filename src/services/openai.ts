/**
 * OpenAI integration for AI-powered content generation
 */

import OpenAI from 'openai';
import config from '../config/config.js';

let openai: OpenAI | null = null;

/**
 * Initialize OpenAI client
 */
export function initOpenAI(): OpenAI {
  if (!config.apis.openai.apiKey) {
    console.warn('⚠️  OpenAI API key not configured - AI features will be limited');
    return null as any;
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: config.apis.openai.apiKey,
    });
    console.log('✅ OpenAI client initialized');
  }

  return openai;
}

/**
 * Generate destination guide content
 */
export async function generateDestinationGuide(params: {
  destination: string;
  country: string;
  guideType: string;
  travelerType?: string;
  duration?: number;
}): Promise<string> {
  const client = initOpenAI();
  if (!client) {
    return 'AI content generation is not available. Please configure OpenAI API key.';
  }

  const prompt = `Create a comprehensive ${params.guideType} guide for ${params.destination}, ${params.country}.
${params.travelerType ? `Target audience: ${params.travelerType} travelers` : ''}
${params.duration ? `Trip duration: ${params.duration} days` : ''}

Requirements:
- Write in an engaging, informative style
- Include specific recommendations with details
- Provide insider tips and local insights
- Use markdown formatting for better readability
- Be concise but thorough (aim for 500-800 words)
- Focus on practical, actionable information

Guide type: ${params.guideType}`;

  try {
    const completion = await client.chat.completions.create({
      model: config.apis.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel writer and destination specialist. Create engaging, accurate, and helpful travel content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate content';
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
    throw new Error('Failed to generate AI content');
  }
}

/**
 * Generate personalized itinerary
 */
export async function generateItinerary(params: {
  destination: string;
  country: string;
  durationDays: number;
  travelerProfile: any;
  mustSeeAttractions?: string[];
}): Promise<any> {
  const client = initOpenAI();
  if (!client) {
    throw new Error('OpenAI not configured');
  }

  const prompt = `Create a detailed ${params.durationDays}-day itinerary for ${params.destination}, ${params.country}.

Traveler Profile:
${JSON.stringify(params.travelerProfile, null, 2)}

${params.mustSeeAttractions?.length ? `Must-see attractions: ${params.mustSeeAttractions.join(', ')}` : ''}

Create a JSON response with the following structure:
{
  "itinerary": {
    "destination": "${params.destination}",
    "total_days": ${params.durationDays},
    "travel_style": "...",
    "overview": "Brief overview of the itinerary"
  },
  "daily_schedule": [
    {
      "day": 1,
      "theme": "Day theme",
      "morning": {
        "activity": "Activity name",
        "location": "Location",
        "duration": "Duration",
        "why_this": "Why this activity",
        "tips": ["Tip 1", "Tip 2"]
      },
      "afternoon": { /* same structure */ },
      "evening": { /* same structure */ },
      "meals": {
        "breakfast": "Recommendation",
        "lunch": "Recommendation",
        "dinner": "Recommendation"
      },
      "estimated_cost": 150,
      "walking_distance_km": 5
    }
  ],
  "packing_list": ["Item 1", "Item 2"],
  "budget_breakdown": {
    "meals": 200,
    "activities": 300,
    "transportation": 100,
    "total_per_day": 600
  }
}

Respond ONLY with valid JSON, no additional text.`;

  try {
    const completion = await client.chat.completions.create({
      model: config.apis.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner. Create detailed, personalized itineraries. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw new Error('Failed to generate itinerary');
  }
}

/**
 * Generate travel inspiration content
 */
export async function generateInspirationContent(params: {
  contentType: string;
  theme: string;
  destination?: string;
  targetAudience?: string;
  tone?: string;
  wordCount?: number;
}): Promise<{ title: string; subtitle: string; body: string; callToAction: string }> {
  const client = initOpenAI();
  if (!client) {
    throw new Error('OpenAI not configured');
  }

  const prompt = `Create ${params.contentType} content about ${params.destination || 'travel destinations'}.

Theme: ${params.theme}
Target Audience: ${params.targetAudience || 'General travelers'}
Tone: ${params.tone || 'Inspiring'}
Word Count: ${params.wordCount || 500} words

Create compelling travel content that:
- Inspires readers to travel
- Includes specific details and examples
- Paints a vivid picture of the destination
- Ends with a clear call-to-action
- Uses engaging storytelling

Return JSON with this structure:
{
  "title": "Compelling title",
  "subtitle": "Engaging subtitle",
  "body": "Main content in markdown",
  "call_to_action": "Clear CTA"
}

Respond ONLY with valid JSON.`;

  try {
    const completion = await client.chat.completions.create({
      model: config.apis.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel content creator who writes inspiring, engaging content that motivates people to travel.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating inspiration content:', error);
    throw new Error('Failed to generate inspiration content');
  }
}

/**
 * Analyze and personalize recommendations
 */
export async function personalizeRecommendations(params: {
  userPreferences: any;
  candidateDestinations: any[];
}): Promise<any[]> {
  const client = initOpenAI();
  if (!client) {
    // Return destinations as-is without AI personalization
    return params.candidateDestinations;
  }

  const prompt = `Given the user's travel preferences and candidate destinations, rank and personalize recommendations.

User Preferences:
${JSON.stringify(params.userPreferences, null, 2)}

Candidate Destinations:
${JSON.stringify(params.candidateDestinations, null, 2)}

For each destination, provide:
1. Match score (0-100)
2. Specific match reasons
3. Personalized highlights
4. Why they should visit NOW

Return JSON array of recommendations sorted by match score.`;

  try {
    const completion = await client.chat.completions.create({
      model: config.apis.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI travel recommendation expert who understands traveler preferences and matches them with perfect destinations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return params.candidateDestinations;
    }

    const result = JSON.parse(content);
    return result.recommendations || params.candidateDestinations;
  } catch (error) {
    console.error('Error personalizing recommendations:', error);
    return params.candidateDestinations;
  }
}

export default {
  initOpenAI,
  generateDestinationGuide,
  generateItinerary,
  generateInspirationContent,
  personalizeRecommendations,
};
