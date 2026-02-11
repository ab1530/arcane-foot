# ArkaneMatch - Example Conversations & Test Scenarios

This document provides real-world conversation examples to test ArkaneMatch functionality.

---

## Test Scenario 1: Simple League Search

### Conversation
```
User: "I need a LaLiga scout"

Expected Response:
✓ Intent: SEARCH_SCOUT
✓ Extracted: { leagues: ["LaLiga"] }
✓ Returns: All active LaLiga scouts
✓ Suggests: Budget range, language requirements
```

### Variations to Test
- "Find me scouts for Spanish football"
- "Looking for someone who knows LaLiga"
- "I want a scout for the Spanish league"
- "Need help finding a Primera Division scout"

---

## Test Scenario 2: Position-Specific Search

### Conversation
```
User: "I need a scout who specializes in defenders"

Expected Response:
✓ Intent: SEARCH_SCOUT
✓ Extracted: { positions: ["CB", "LB", "RB", "LWB", "RWB"] }
✓ Returns: Scouts focusing on defensive positions
✓ Suggests: Specific league, budget
```

### Variations to Test
- "Find scouts for center backs"
- "I'm looking for someone who knows attackers"
- "Need a midfielder specialist"
- "Scout for forwards and wingers"

---

## Test Scenario 3: Budget-Constrained Search

### Conversation
```
User: "Find scouts under €150 per hour"

Expected Response:
✓ Intent: SEARCH_SCOUT
✓ Extracted: { maxBudget: 150, currency: "EUR" }
✓ Returns: Scouts with hourlyRate <= 150
✓ Suggests: League preferences, positions
```

### Variations to Test
- "I have a budget of max $200/hr"
- "Looking for scouts below £120 per hour"
- "Need someone under 100 euros hourly"
- "What can I get for €175/hr?"

---

## Test Scenario 4: Complex Multi-Criteria Search

### Conversation
```
User: "Find me a Bundesliga specialist who scouts center backs, speaks German, and costs under 150€ per hour"

Expected Response:
✓ Intent: SEARCH_SCOUT
✓ Extracted: {
    leagues: ["Bundesliga"],
    positions: ["CB"],
    languages: ["German"],
    maxBudget: 150,
    currency: "EUR"
  }
✓ Returns: Precise matches
✓ Suggests: Expand criteria if no results
```

### Variations to Test
- "LaLiga scout for defenders, Spanish speaking, verified, under €200"
- "Premier League midfielder specialist, English, 4+ stars"
- "Italian scout for forwards, speaks Italian and English, €100-€180/hr"

---

## Test Scenario 5: Multi-Turn Conversation (Refinement)

### Conversation
```
Turn 1:
User: "I need a scout for defenders"
AI: "I found 8 scouts that focus on defenders..."
Extracted: { positions: ["CB", "LB", "RB", "LWB", "RWB"] }

Turn 2:
User: "Actually, I prefer LaLiga specialists"
AI: "I've refined your search. Looking for LaLiga specialist, focusing on defenders..."
Extracted: { leagues: ["LaLiga"], positions: ["CB", "LB", "RB", "LWB", "RWB"] }

Turn 3:
User: "And they should speak Spanish"
AI: "I've refined your search. Looking for LaLiga specialist, focusing on defenders..."
Extracted: {
  leagues: ["LaLiga"],
  positions: ["CB", "LB", "RB", "LWB", "RWB"],
  languages: ["Spanish"]
}

Turn 4:
User: "Budget under €140/hr"
AI: "I've refined your search. Looking for LaLiga specialist, focusing on defenders, under EUR140/hr..."
Extracted: {
  leagues: ["LaLiga"],
  positions: ["CB", "LB", "RB", "LWB", "RWB"],
  languages: ["Spanish"],
  maxBudget: 140,
  currency: "EUR"
}
```

**Test Points:**
- ✅ Conversation ID persists
- ✅ Context maintained across turns
- ✅ Criteria accumulate correctly
- ✅ Each response acknowledges refinement
- ✅ Scouts list updates with each refinement

---

## Test Scenario 6: Vague Query Handling

### Conversation
```
User: "I need help finding a scout"

Expected Response:
✓ Intent: UNCLEAR or GENERAL_QUESTION
✓ AI asks clarifying questions:
  - "What league are you interested in?"
  - "What positions should they specialize in?"
  - "What's your budget range?"
✓ Friendly, helpful tone
```

### Variations to Test
- "Help me find someone"
- "I'm looking for scouts"
- "Can you help me?"
- "Scout recommendations please"

---

## Test Scenario 7: Rating and Verification

### Conversation
```
User: "Find me verified scouts with 4+ stars"

Expected Response:
✓ Intent: SEARCH_SCOUT
✓ Extracted: { verifiedOnly: true, minRating: 4 }
✓ Returns: Only verified scouts with avgRating >= 4
✓ Shows verification badge in results
```

### Variations to Test
- "I want certified scouts only"
- "Show me top-rated scouts"
- "Find 5-star scouts"
- "Need validated profiles with good reviews"

---

## Test Scenario 8: No Results Scenario

### Conversation
```
User: "Find a scout for €20 per hour"

Expected Response:
✓ Intent: SEARCH_SCOUT
✓ Extracted: { maxBudget: 20, currency: "EUR" }
✓ No scouts found (budget too low)
✓ AI provides helpful suggestions:
  - "Try increasing your budget range"
  - "Most scouts charge €50-300/hr"
  - "Would you like to see scouts in a higher range?"
```

### Other No-Result Scenarios to Test
- Extremely specific criteria (no matches)
- Non-existent league combinations
- Unrealistic requirement combinations

---

## Test Scenario 9: General Questions

### Conversation
```
User: "How does the marketplace work?"

Expected Response:
✓ Intent: GENERAL_QUESTION
✓ Provides helpful information about marketplace
✓ Explains how to search for scouts
✓ Mentions pricing, verification, etc.
✓ Invites user to try searching
```

### Other Questions to Test
- "What can you do?"
- "How do I use this?"
- "What are the scout rates?"
- "Tell me about verified scouts"
- "How does pricing work?"

---

## Test Scenario 10: Language Requirements

### Conversation
```
User: "I need a scout who speaks English and Spanish"

Expected Response:
✓ Intent: SEARCH_SCOUT
✓ Extracted: { languages: ["English", "Spanish"] }
✓ Returns: Scouts who speak both languages
✓ Highlights language capabilities in results
```

### Variations to Test
- "Find someone who speaks German"
- "Bilingual scout - French and English"
- "Scout who can communicate in Italian"

---

## Test Scenario 11: Multiple Leagues

### Conversation
```
User: "Find scouts for LaLiga and Premier League"

Expected Response:
✓ Intent: SEARCH_SCOUT
✓ Extracted: { leagues: ["LaLiga", "Premier League"] }
✓ Returns: Scouts specializing in either league
✓ Shows league expertise in results
```

### Variations to Test
- "Scout for Spanish and German football"
- "I need someone for Bundesliga or Serie A"
- "Looking for scouts covering multiple leagues"

---

## Test Scenario 12: Edge Cases

### Test Cases

#### Empty Message
```
User: ""
Expected: Validation error or helpful prompt
```

#### Very Long Message
```
User: "I'm looking for a scout who specializes in LaLiga and Premier League, focuses on defenders especially center backs and full backs, speaks Spanish and English fluently, has 4+ star rating, is verified, costs under €150 per hour, operates in Spain or England, has experience with youth players, and knows modern tactics..."

Expected:
✓ Extracts all relevant criteria
✓ Ignores irrelevant parts
✓ Returns appropriate matches
```

#### Special Characters
```
User: "Find scouts for €150/hr (max) in LaLiga!!!"
Expected: Handles gracefully, extracts criteria
```

#### Numbers Only
```
User: "150"
Expected: Asks for clarification or assumes budget
```

---

## Rate Limiting Tests

### Scenario: Rapid Fire Requests

```bash
# Send 25 requests in quick succession
for i in {1..25}; do
  curl -X POST localhost:3000/api/arkane-match/chat \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"message":"test"}' &
done
```

**Expected:**
- First 20 succeed
- Requests 21-25 return 429 (Too Many Requests)
- After 1 minute, rate limit resets

---

## Conversation Expiry Test

### Scenario: Old Conversation

1. Start conversation
2. Wait 1 hour + 1 minute
3. Try to continue conversation

**Expected:**
- Conversation not found
- Prompt to start new conversation
- Previous messages not accessible

---

## Integration Tests

### Test with Real Scout Data

**Prerequisites:**
- At least 5 active scout listings in database
- Scouts with different leagues, positions, rates
- Some verified, some not
- Variety of ratings

**Test Flow:**
1. Search for existing criteria
2. Verify correct scouts returned
3. Check response accuracy
4. Validate suggestion relevance

---

## Performance Tests

### Response Time Benchmarks

| Scenario | Expected Time | Max Time |
|----------|--------------|----------|
| Simple search | < 1s | 2s |
| Complex search | < 2s | 3s |
| Multi-turn | < 1.5s | 2.5s |
| No results | < 1s | 2s |
| General question | < 0.5s | 1s |

### Load Test

```bash
# 100 concurrent users, each sending 5 messages
ab -n 500 -c 100 -T 'application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -p request.json \
  http://localhost:3000/api/arkane-match/chat
```

**Expected:**
- 90% of requests < 3s
- 0% failures
- Rate limiting kicks in appropriately

---

## UI/UX Test Scenarios

### Mobile Testing
- Test with short queries
- Test with voice input (future)
- Test suggestion buttons
- Test scout card display

### Desktop Testing
- Test with longer queries
- Test multi-turn conversations
- Test conversation history view
- Test keyboard shortcuts

---

## Success Metrics

After testing, verify:

1. **Accuracy**
   - ✅ Criteria extraction accuracy > 85%
   - ✅ Intent detection accuracy > 90%
   - ✅ Relevant scouts returned

2. **Performance**
   - ✅ Average response time < 2s
   - ✅ No timeouts under normal load
   - ✅ Rate limiting works correctly

3. **User Experience**
   - ✅ Responses are natural and helpful
   - ✅ Suggestions are relevant
   - ✅ Conversation flows smoothly
   - ✅ Error messages are clear

4. **Reliability**
   - ✅ Works without AI providers (fallback)
   - ✅ Handles edge cases gracefully
   - ✅ Maintains conversation context
   - ✅ Expires conversations appropriately

---

## Debugging Tips

### Enable Debug Logging

```typescript
// In arkane-match.service.ts
private readonly logger = new Logger(ArkaneMatchService.name);

// Add debug logs
this.logger.debug(`Detected intent: ${intent}`);
this.logger.debug(`Extracted criteria: ${JSON.stringify(criteria)}`);
this.logger.debug(`Found ${scouts.length} scouts`);
```

### Check Conversation State

```bash
# Get conversation from Redis
redis-cli GET "arkane-match:conversation:{conversationId}"

# List all conversations
redis-cli KEYS "arkane-match:conversation:*"
```

### Monitor Performance

```bash
# Watch response times
tail -f logs/app.log | grep "arkane-match"

# Check rate limiting
redis-cli GET "arkane-match:rate-limit:{userId}"
```

---

## Reporting Issues

When reporting issues, include:
1. User query (exact message)
2. Expected behavior
3. Actual behavior
4. Conversation ID (if applicable)
5. Response time
6. Screenshots (if UI issue)

---

**Test Date:** _________________
**Tester:** _________________
**Environment:** _________________
**Results:** _________________
