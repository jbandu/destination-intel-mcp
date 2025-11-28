# Architecture Documentation

## System Overview

The Destination Intelligence & Content MCP Server is built with a modular, scalable architecture designed for high performance and maintainability.

## Component Architecture

```
src/
├── index.ts                 # Main MCP server entry point
├── config/
│   └── config.ts           # Configuration management
├── database/
│   └── db.ts              # PostgreSQL connection & queries
├── services/
│   ├── openai.ts          # OpenAI integration
│   ├── tripadvisor.ts     # TripAdvisor API (future)
│   ├── google-places.ts   # Google Places API (future)
│   └── cache.ts           # Redis caching (future)
├── tools/
│   ├── get-destination-guide.ts
│   ├── generate-personalized-itinerary.ts
│   ├── recommend-destinations.ts
│   ├── get-things-to-do.ts
│   ├── get-dining-recommendations.ts
│   └── remaining-tools.ts  # Tools 6-10
└── types/
    └── index.ts            # TypeScript type definitions
```

## Data Flow

### 1. Tool Invocation Flow

```
Client Request
    ↓
MCP Server (index.ts)
    ↓
Tool Handler (e.g., get-destination-guide.ts)
    ↓
Database Query (db.ts)
    ↓
AI Enhancement (openai.ts) [if needed]
    ↓
Format Response
    ↓
Return to Client
```

### 2. Recommendation Engine Flow

```
User Preferences
    ↓
Query Candidate Destinations (PostgreSQL)
    ↓
Calculate Match Scores (recommendation logic)
    ↓
AI Personalization (OpenAI)
    ↓
Rank & Filter Results
    ↓
Log for Analytics
    ↓
Return Recommendations
```

### 3. Content Generation Flow

```
Content Request
    ↓
Check Database Cache
    ↓ (if not found)
Generate with AI (GPT-4)
    ↓
Enhance with DB Data
    ↓
Save to Database
    ↓
Return Content
```

## Database Schema Design

### Normalization Strategy
- **3NF (Third Normal Form)** for most tables
- **JSONB** for flexible, semi-structured data (e.g., opening hours, schedules)
- **Arrays** for multi-valued attributes (e.g., tags, activities)

### Indexing Strategy
- **B-tree indexes** on frequently queried columns (city, country, dates)
- **GIN indexes** on array and JSONB columns for efficient containment queries
- **Composite indexes** for common query patterns

### Key Design Decisions

1. **UUID Primary Keys**: Better for distributed systems and prevents sequential scanning attacks
2. **Timestamps**: Created_at and updated_at on all major tables for audit trails
3. **Soft Deletes**: is_active flags instead of hard deletes
4. **Triggers**: Automatic timestamp updates and conversion rate calculations

## Scalability Considerations

### Database
- **Connection Pooling**: Max 20 connections, configurable
- **Query Optimization**: Prepared statements, parameterized queries
- **Indexing**: Strategic indexes on high-query columns
- **Partitioning**: Future consideration for travel_recommendations_log by date

### Caching Strategy (Future)
```
Redis Layer
├── Destination guides (TTL: 1 hour)
├── Popular POIs (TTL: 6 hours)
├── Weather data (TTL: 4 hours)
└── Recommendations (TTL: 30 minutes)
```

### AI Optimization
- **Prompt Caching**: Reuse system prompts
- **Token Limits**: Enforce maximum response sizes
- **Streaming**: For long content generation
- **Fallbacks**: Database content when AI unavailable

## Security Architecture

### Input Validation
- **Zod schemas** for type-safe validation
- **SQL injection prevention** via parameterized queries
- **Rate limiting** to prevent abuse

### API Key Management
- **Environment variables** for all secrets
- **Never log** API keys or sensitive data
- **Rotation support** for key updates

### Data Privacy
- **No PII** in logs
- **Hashed IDs** for passenger identification
- **GDPR compliance** ready (user data deletion support)

## Error Handling

### Layered Error Handling

```typescript
Try-Catch Hierarchy:
1. Tool Level: Handle specific errors, provide fallbacks
2. Service Level: Handle external API failures
3. Database Level: Handle connection/query errors
4. Server Level: Catch all, log, return error response
```

### Error Response Format

```json
{
  "error": "Destination not found",
  "tool": "get-destination-guide",
  "timestamp": "2025-11-28T12:00:00Z"
}
```

## Performance Metrics

### Target Metrics
- **Response Time**: < 500ms (cached), < 2s (AI-generated)
- **Database Queries**: < 100ms average
- **AI Generation**: < 5s for content
- **Throughput**: 100 requests/second

### Monitoring
- **Database Query Logging**: Track slow queries
- **Error Rate Tracking**: Alert on high error rates
- **AI Usage Metrics**: Track token consumption
- **Cache Hit Rate**: Optimize caching strategy

## Future Enhancements

### Phase 2: Advanced Personalization
- **Neo4j Knowledge Graph**: Destination relationships
- **ML Models**: TensorFlow.js for recommendations
- **User Behavior Tracking**: Click patterns, dwell time
- **A/B Testing Framework**: Content variation testing

### Phase 3: Real-time Features
- **WebSocket Support**: Live updates
- **Event Streaming**: Kafka for analytics
- **Microservices**: Split into specialized services
- **Multi-region Deployment**: Global CDN

### Phase 4: Advanced Content
- **Image Generation**: DALL-E for custom images
- **Video Content**: AI-generated travel videos
- **Voice Guides**: Text-to-speech integration
- **AR Experiences**: Augmented reality previews

## Technology Stack

### Core
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5+
- **MCP SDK**: @modelcontextprotocol/sdk

### Database
- **Primary**: PostgreSQL 14+
- **Future**: Neo4j (knowledge graph)
- **Cache**: Redis (optional)

### AI/ML
- **Content Generation**: OpenAI GPT-4
- **Future ML**: TensorFlow.js

### External APIs
- **TripAdvisor**: POI data
- **Google Places**: Location data
- **OpenWeather**: Weather data
- **Eventbrite**: Event data

### DevOps
- **Build**: TypeScript Compiler
- **Test**: Jest
- **Lint**: ESLint
- **Deploy**: Railway / Vercel
- **CI/CD**: GitHub Actions

## Design Patterns

### Used Patterns
1. **Repository Pattern**: Database abstraction
2. **Factory Pattern**: Tool creation
3. **Strategy Pattern**: Recommendation algorithms
4. **Observer Pattern**: Event logging
5. **Singleton Pattern**: Database connection pool

### Code Organization
- **Separation of Concerns**: Clear boundaries between layers
- **DRY Principle**: Shared utilities and helpers
- **SOLID Principles**: Maintainable, testable code
- **Type Safety**: Comprehensive TypeScript types

## API Documentation

See README.md for:
- Tool descriptions
- Input schemas
- Output formats
- Usage examples

## Testing Strategy

### Unit Tests
- Tool functions with mocked dependencies
- Database queries with test database
- AI service with mocked responses

### Integration Tests
- Full tool execution
- Database migrations
- External API integrations

### E2E Tests
- Complete user workflows
- MCP protocol compliance
- Error scenarios

## Deployment Guide

### Prerequisites Check
```bash
# Node.js version
node --version  # Should be 18+

# PostgreSQL
psql --version  # Should be 14+

# Environment variables
env | grep DATABASE_URL
env | grep OPENAI_API_KEY
```

### Deployment Steps
1. Clone repository
2. Install dependencies
3. Configure environment
4. Run database migrations
5. Build TypeScript
6. Start server
7. Verify health

### Health Checks
- Database connection test
- OpenAI API availability
- Tool execution test
- Response time monitoring

---

**Last Updated**: November 28, 2025
**Version**: 1.0.0
