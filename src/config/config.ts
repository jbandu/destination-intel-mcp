/**
 * Configuration management for Destination Intelligence MCP Server
 */

import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  // Database
  database: {
    url: string;
    neo4jUri: string;
    neo4jUser: string;
    neo4jPassword: string;
  };

  // External APIs
  apis: {
    openai: {
      apiKey: string;
      model: string;
    };
    tripadvisor: {
      apiKey: string;
      baseUrl: string;
    };
    googlePlaces: {
      apiKey: string;
    };
    openWeather: {
      apiKey: string;
      baseUrl: string;
    };
    eventbrite: {
      apiKey: string;
    };
  };

  // Redis
  redis: {
    url: string;
    cacheTtl: number;
  };

  // Application
  app: {
    env: string;
    port: number;
    logLevel: string;
  };

  // Content Generation
  content: {
    maxLength: number;
    enableCaching: boolean;
  };

  // Recommendations
  recommendations: {
    modelPath: string;
    minScore: number;
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const config: Config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/destination_intelligence',
    neo4jUri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4jUser: process.env.NEO4J_USER || 'neo4j',
    neo4jPassword: process.env.NEO4J_PASSWORD || 'password',
  },

  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    },
    tripadvisor: {
      apiKey: process.env.TRIPADVISOR_API_KEY || '',
      baseUrl: 'https://api.content.tripadvisor.com/api/v1',
    },
    googlePlaces: {
      apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
    },
    openWeather: {
      apiKey: process.env.OPENWEATHER_API_KEY || '',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
    },
    eventbrite: {
      apiKey: process.env.EVENTBRITE_API_KEY || '',
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    cacheTtl: parseInt(process.env.REDIS_CACHE_TTL || '3600', 10),
  },

  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  content: {
    maxLength: parseInt(process.env.MAX_CONTENT_LENGTH || '2000', 10),
    enableCaching: process.env.ENABLE_CONTENT_CACHING === 'true',
  },

  recommendations: {
    modelPath: process.env.RECOMMENDATION_MODEL_PATH || './models/recommendation_model',
    minScore: parseFloat(process.env.MIN_RECOMMENDATION_SCORE || '0.6'),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
