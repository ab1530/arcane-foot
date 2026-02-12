# ArkaneMatch - AI-Powered Conversational Scout Search

ArkaneMatch is an intelligent, conversational AI system that allows clubs to find scouts using natural language queries. It understands context, maintains conversation history, and provides smart recommendations.

## Features

- **Natural Language Understanding (NLU)**: Parse unstructured queries into structured search criteria
- **Intent Detection**: Understand what the user wants (search, refine, compare, etc.)
- **Multi-turn Conversations**: Maintain context across multiple messages
- **Smart Recommendations**: Provide follow-up questions and suggestions
- **Fallback System**: Works without AI providers using rule-based NLU
- **Rate Limited**: Prevents abuse with configurable limits
- **Cached Conversations**: Uses Redis/in-memory storage for conversation history

## Architecture

```
┌─────────────────┐
│  Club (User)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   ArkaneMatchController             │
│   - POST /chat                      │
│   - GET /conversations/:id          │
│   - DELETE /conversations/:id       │
│   - GET /info                       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   ArkaneMatchService                │
│   - detectIntent()                  │
│   - extractCriteria()               │
│   - searchScouts()                  │
│   - generateResponse()              │
└────┬─────────────────┬──────────────┘
     │                 │
     ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Marketplace  │  │  Redis/      │
│ Service      │  │  Cache       │
└──────────────┘  └──────────────┘
```

## API Endpoints

### POST `/api/arkane-match/chat`

Send a natural language message to find scouts.

**Request:**
```json
{
  "message": "I need a LaLiga scout who specializes in defenders under €150/hr",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "response": "Great! I found 2 scouts that match your criteria...",
  "scouts": [
    {
      "id": "scout-id",
      "users": {
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "headline": "LaLiga Specialist - 10 years experience",
      "hourlyRate": 120,
      "stats": {
        "avgRating": 4.5,
        "totalReviews": 15
      }
    }
  ],
  "extractedCriteria": {
    "leagues": ["LaLiga"],
    "positions": ["CB", "LB", "RB"],
    "maxBudget": 150,
    "currency": "EUR"
  },
  "suggestions": [
    "What's your budget range?",
    "Which languages should the scout speak?"
  ],
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "intent": "SEARCH_SCOUT"
}
```

### GET `/api/arkane-match/conversations/:id`

Get conversation history.

**Response:**
```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "messages": [
    {
      "role": "user",
      "content": "I need a LaLiga scout",
      "timestamp": "2025-11-06T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Great! I found 2 scouts...",
      "timestamp": "2025-11-06T10:00:02Z",
      "scouts": [...]
    }
  ],
  "messageCount": 2,
  "createdAt": "2025-11-06T10:00:00Z",
  "lastMessageAt": "2025-11-06T10:00:02Z"
}
```

### DELETE `/api/arkane-match/conversations/:id`

Clear conversation history.

**Response:**
```json
{
  "message": "Conversation cleared successfully",
  "conversationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### GET `/api/arkane-match/info`

Get AI capabilities and configuration.

**Response:**
```json
{
  "serviceName": "ArkaneMatch",
  "version": "1.0.0",
  "description": "AI-powered conversational scout search",
  "capabilities": [
    "Natural language understanding",
    "Intent detection",
    "Multi-turn conversations",
    "Context-aware recommendations"
  ],
  "aiProvider": "Rule-based fallback",
  "supportedLanguages": ["English"],
  "maxConversationAge": "1 hour",
  "rateLimit": {
    "perMinute": 20,
    "perHour": 100
  }
}
```

## Intent Types

1. **SEARCH_SCOUT**: User wants to find scouts
2. **REFINE_SEARCH**: User wants to narrow down results
3. **GET_DETAILS**: User wants details about a specific scout
4. **COMPARE_SCOUTS**: User wants to compare multiple scouts
5. **GENERAL_QUESTION**: User has a question about the marketplace
6. **UNCLEAR**: Intent could not be determined

## Natural Language Understanding (NLU)

### Supported Criteria Extraction

#### Leagues
- **LaLiga**: "laliga", "la liga", "spanish", "primera"
- **Premier League**: "premier", "epl", "english"
- **Bundesliga**: "bundesliga", "german"
- **Serie A**: "serie a", "italian"
- **Ligue 1**: "ligue 1", "french"

#### Positions
- **Specific**: GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST
- **General**: "defenders" → CB/LB/RB, "midfielders" → CDM/CM/CAM, "forwards" → ST/LW/RW

#### Budget
- Patterns: "under €150", "max $200", "below £100"
- Extracts number and currency

#### Rating
- Patterns: "4+ stars", "rating above 4", "rated 5"

#### Languages
- English, Spanish, French, German, Italian, Portuguese

#### Countries
- Spain, England, Germany, France, Italy

#### Verified
- Keywords: "verified", "certified", "validated"

## Example Conversations

### Example 1: Simple Search
```
User: I need a LaLiga scout
AI: Great! I found 3 scouts that match your criteria (LaLiga specialists).

    1. Jean Dupont (4.5 ⭐)
       LaLiga Specialist - 10 years experience
       Leagues: LaLiga, Ligue 1
       Positions: CB, LB, RB
       Rate: EUR120/hr
       ✓ Verified Scout
```

### Example 2: Complex Search
```
User: Find me a Bundesliga specialist who scouts center backs, speaks German, and costs under 150€ per hour
AI: I found 1 scout that match your criteria (Bundesliga specialist, focusing on CB, under EUR150/hr).

    1. Klaus Schmidt (4.8 ⭐)
       Bundesliga CB Expert
       Leagues: Bundesliga
       Positions: CB
       Rate: EUR140/hr
       ✓ Verified Scout
```

### Example 3: Multi-turn Refinement
```
User: I need a scout for defenders
AI: I found 5 scouts that focus on defenders...

User: Actually, I prefer LaLiga specialists
AI: I've refined your search. Looking for LaLiga specialist, focusing on CB, LB, RB.
    I found 2 scouts...

User: And they should speak Spanish
AI: I've refined your search. Looking for LaLiga specialist, focusing on CB, LB, RB.
    I found 1 scout that matches...
```

### Example 4: No Results
```
User: Find a scout for €20/hr
AI: I couldn't find any scouts matching your exact criteria.

    Here are some suggestions:
    • Try increasing your budget range
    • Consider scouts with slightly lower ratings (still highly rated)

    Would you like me to search with adjusted criteria?
```

## Testing

### Manual Testing with cURL

1. Get an authentication token (club user)
2. Test the chat endpoint:

```bash
curl -X POST http://localhost:3000/api/arkane-match/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need a LaLiga scout for defenders under 150€/hr"
  }'
```

### Automated Testing

Run the test script:

```bash
# Set your auth token
export AUTH_TOKEN="your_jwt_token_here"

# Run the test script
ts-node src/scripts/test-arkane-match.ts
```

The test script covers:
- Single-turn conversations
- Multi-turn conversations
- Context preservation
- Criteria extraction
- Scout searching
- Edge cases (no results, vague queries)

## Configuration

Add to `.env`:

```env
# AI Provider (optional - uses fallback if not set)
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# AI Model
AI_MODEL=gpt-4-turbo-preview
# OR
AI_MODEL=claude-3-5-sonnet-20241022

# Rate Limits
ARKANE_MATCH_RATE_LIMIT_PER_MINUTE=20
ARKANE_MATCH_RATE_LIMIT_PER_HOUR=100

# Redis (optional - uses in-memory if not available)
REDIS_HOST=localhost
REDIS_PORT=6379
SKIP_REDIS=false
```

## Performance

- **Average Response Time**: < 3 seconds
- **Conversation TTL**: 1 hour
- **In-memory Cache**: Up to 100 conversations
- **Rate Limits**: 20/minute, 100/hour per user

## Integration with Frontend

### React/Next.js Example

```typescript
import { useState } from 'react';
import axios from 'axios';

function ArkaneMatchChat() {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    const response = await axios.post('/api/arkane-match/chat', {
      message,
      conversationId,
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setConversationId(response.data.conversationId);
    setMessages([
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: response.data.response, scouts: response.data.scouts }
    ]);
    setMessage('');
  };

  return (
    <div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
            {msg.scouts && <ScoutList scouts={msg.scouts} />}
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

## Future Enhancements

1. **AI Provider Integration**
   - Add OpenAI GPT-4 integration
   - Add Anthropic Claude integration
   - Hybrid approach (AI + rules)

2. **Advanced Features**
   - Voice input support
   - Multi-language support (French, Spanish, etc.)
   - Scout comparison mode
   - Saved searches
   - Email notifications for new matches

3. **Analytics**
   - Track popular queries
   - Measure search success rate
   - A/B test response formats
   - User satisfaction metrics

4. **Personalization**
   - Learn user preferences
   - Suggest scouts based on history
   - Custom response styles

## Troubleshooting

### "Conversation not found"
Conversations expire after 1 hour. Start a new conversation.

### "Too many requests"
You've exceeded the rate limit. Wait a minute before retrying.

### No scouts found
Try:
- Broader search criteria
- Higher budget
- Remove strict filters (verified, rating)

### Slow responses
- Check marketplace service is running
- Verify Redis connection
- Check database performance

## Contributing

When adding new features:
1. Update NLU patterns in service
2. Add test cases in test script
3. Update this documentation
4. Test with real users

## License

Copyright 2025 Arcane Football Platform
