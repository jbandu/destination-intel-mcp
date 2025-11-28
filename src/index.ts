#!/usr/bin/env node

/**
 * Destination Intelligence & Content MCP Server
 * AI-powered travel content and recommendations for airline vacation packages
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import config from './config/config.js';
import { testConnection, closeConnection } from './database/db.js';
import { initOpenAI } from './services/openai.js';

// Import all tools
import { getDestinationGuide } from './tools/get-destination-guide.js';
import { generatePersonalizedItinerary } from './tools/generate-personalized-itinerary.js';
import { recommendDestinations } from './tools/recommend-destinations.js';
import { getThingsToDo } from './tools/get-things-to-do.js';
import { getDiningRecommendations } from './tools/get-dining-recommendations.js';
import {
  generateTravelInspiration,
  getSeasonalInsights,
  analyzeContentPerformance,
  getLocalInsights,
  compareDestinations,
} from './tools/remaining-tools.js';

// Define all MCP tools
const TOOLS: Tool[] = [
  {
    name: 'get-destination-guide',
    description: 'Get comprehensive destination guide with activities, dining, culture, and tips',
    inputSchema: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'City or destination name',
        },
        guide_sections: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['OVERVIEW', 'THINGS_TO_DO', 'DINING', 'NIGHTLIFE', 'SHOPPING', 'CULTURE', 'PRACTICAL_INFO'],
          },
          description: 'Sections to include in the guide',
        },
        traveler_type: {
          type: 'string',
          enum: ['FAMILY', 'COUPLE', 'SOLO', 'BUSINESS', 'GROUP'],
          description: 'Customize content for traveler type',
        },
        duration_days: {
          type: 'integer',
          description: 'Trip duration for contextual recommendations',
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'generate-personalized-itinerary',
    description: 'Generate personalized travel itinerary based on preferences and trip details',
    inputSchema: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Destination city name' },
        duration_days: { type: 'integer', description: 'Number of days for the trip' },
        traveler_profile: {
          type: 'object',
          properties: {
            traveler_type: { type: 'string', description: 'Type of traveler (e.g., FAMILY, COUPLE)' },
            interests: { type: 'array', items: { type: 'string' }, description: 'Traveler interests' },
            pace_preference: {
              type: 'string',
              enum: ['RELAXED', 'MODERATE', 'PACKED'],
              description: 'Preferred pace of activities',
            },
            budget_level: { type: 'string', description: 'Budget preference' },
            must_see_attractions: { type: 'array', items: { type: 'string' } },
          },
        },
        travel_dates: {
          type: 'object',
          properties: {
            arrival_date: { type: 'string', description: 'Arrival date (YYYY-MM-DD)' },
            departure_date: { type: 'string', description: 'Departure date (YYYY-MM-DD)' },
          },
        },
      },
      required: ['destination', 'duration_days'],
    },
  },
  {
    name: 'recommend-destinations',
    description: 'Recommend destinations based on passenger preferences and behavior',
    inputSchema: {
      type: 'object',
      properties: {
        passenger_id: { type: 'string', description: 'Passenger ID for personalization' },
        context: {
          type: 'object',
          properties: {
            travel_month: { type: 'string', description: 'Preferred travel month' },
            budget_range: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
              },
            },
            interests: { type: 'array', items: { type: 'string' } },
            previous_destinations: { type: 'array', items: { type: 'string' } },
          },
        },
        constraints: {
          type: 'object',
          properties: {
            max_flight_hours: { type: 'number' },
            climate_preference: { type: 'string' },
            language_preference: { type: 'array', items: { type: 'string' } },
          },
        },
        recommendation_count: {
          type: 'integer',
          default: 5,
          maximum: 10,
        },
      },
    },
  },
  {
    name: 'get-things-to-do',
    description: 'Get curated activity recommendations for a destination',
    inputSchema: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Destination city' },
        activity_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['ATTRACTIONS', 'TOURS', 'FOOD_DRINK', 'OUTDOOR', 'CULTURAL', 'NIGHTLIFE', 'SHOPPING'],
          },
        },
        traveler_type: { type: 'string' },
        date_range: {
          type: 'object',
          properties: {
            start_date: { type: 'string' },
            end_date: { type: 'string' },
          },
        },
        budget_per_person: { type: 'number' },
      },
      required: ['destination'],
    },
  },
  {
    name: 'get-dining-recommendations',
    description: 'Get personalized restaurant and dining recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        destination: { type: 'string' },
        cuisine_preferences: { type: 'array', items: { type: 'string' } },
        dietary_restrictions: { type: 'array', items: { type: 'string' } },
        price_level: {
          type: 'string',
          enum: ['BUDGET', 'MODERATE', 'UPSCALE', 'FINE_DINING'],
        },
        occasion: {
          type: 'string',
          enum: ['CASUAL', 'ROMANTIC', 'FAMILY', 'BUSINESS', 'CELEBRATION'],
        },
        meal_type: {
          type: 'string',
          enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'BRUNCH'],
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'generate-travel-inspiration',
    description: 'Generate inspiring travel content to drive package bookings',
    inputSchema: {
      type: 'object',
      properties: {
        content_type: {
          type: 'string',
          enum: ['ARTICLE', 'EMAIL', 'SOCIAL_POST', 'ITINERARY_PREVIEW'],
        },
        theme: {
          type: 'string',
          enum: ['ADVENTURE', 'LUXURY', 'FAMILY', 'ROMANTIC', 'CULTURAL', 'BEACH'],
        },
        target_destination: { type: 'string' },
        target_audience: { type: 'string' },
        tone: {
          type: 'string',
          enum: ['INSPIRING', 'INFORMATIVE', 'EXCITING', 'LUXURIOUS'],
          default: 'INSPIRING',
        },
        word_count: { type: 'integer' },
      },
      required: ['content_type', 'theme'],
    },
  },
  {
    name: 'get-seasonal-insights',
    description: 'Get seasonal insights, events, and best time to visit information',
    inputSchema: {
      type: 'object',
      properties: {
        destination: { type: 'string' },
        month: { type: 'string', description: 'Month name (e.g., "January")' },
        include_events: { type: 'boolean', default: true },
        include_weather: { type: 'boolean', default: true },
      },
      required: ['destination'],
    },
  },
  {
    name: 'analyze-content-performance',
    description: 'Analyze performance of destination content and recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        analysis_period: {
          type: 'object',
          properties: {
            start_date: { type: 'string' },
            end_date: { type: 'string' },
          },
        },
        content_type: { type: 'string' },
      },
    },
  },
  {
    name: 'get-local-insights',
    description: 'Get insider tips, local customs, and cultural information',
    inputSchema: {
      type: 'object',
      properties: {
        destination: { type: 'string' },
        insight_categories: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['CUSTOMS', 'ETIQUETTE', 'MONEY', 'SAFETY', 'LANGUAGE', 'TRANSPORTATION'],
          },
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'compare-destinations',
    description: 'Compare multiple destinations side-by-side',
    inputSchema: {
      type: 'object',
      properties: {
        destinations: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 4,
        },
        comparison_criteria: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['COST', 'WEATHER', 'ACTIVITIES', 'CULTURE', 'FOOD', 'FAMILY_FRIENDLY'],
          },
        },
      },
      required: ['destinations'],
    },
  },
];

/**
 * Main server implementation
 */
class DestinationIntelligenceServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'destination-intelligence-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        console.error(`[MCP] Tool called: ${name}`);

        switch (name) {
          case 'get-destination-guide':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await getDestinationGuide(args as any), null, 2),
                },
              ],
            };

          case 'generate-personalized-itinerary':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await generatePersonalizedItinerary(args as any), null, 2),
                },
              ],
            };

          case 'recommend-destinations':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await recommendDestinations(args as any), null, 2),
                },
              ],
            };

          case 'get-things-to-do':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await getThingsToDo(args as any), null, 2),
                },
              ],
            };

          case 'get-dining-recommendations':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await getDiningRecommendations(args as any), null, 2),
                },
              ],
            };

          case 'generate-travel-inspiration':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await generateTravelInspiration(args as any), null, 2),
                },
              ],
            };

          case 'get-seasonal-insights':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await getSeasonalInsights(args as any), null, 2),
                },
              ],
            };

          case 'analyze-content-performance':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await analyzeContentPerformance(args as any), null, 2),
                },
              ],
            };

          case 'get-local-insights':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await getLocalInsights(args as any), null, 2),
                },
              ],
            };

          case 'compare-destinations':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await compareDestinations(args as any), null, 2),
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        console.error(`[MCP] Error executing ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: error.message || 'Unknown error occurred',
                  tool: name,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandlers(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      console.log('\n[MCP] Shutting down gracefully...');
      await closeConnection();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    // Test database connection
    console.error('[MCP] Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('[MCP] ⚠️  Database connection failed - continuing with limited functionality');
    }

    // Initialize OpenAI
    console.error('[MCP] Initializing OpenAI...');
    initOpenAI();

    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('[MCP] ✅ Destination Intelligence MCP Server running');
    console.error('[MCP] Available tools:', TOOLS.length);
    console.error('[MCP] Environment:', config.app.env);
  }
}

// Start the server
const server = new DestinationIntelligenceServer();
server.run().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
