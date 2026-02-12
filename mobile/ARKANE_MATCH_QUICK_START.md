# ArkaneMatch Quick Start Guide

## Navigation

### From Any Screen
```tsx
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('ArkaneMatch');
```

### Example: Add Button to AI Screen
```tsx
// In src/screens/ai/AIScreen.tsx
<TouchableOpacity
  onPress={() => navigation.navigate('ArkaneMatch')}
  style={styles.card}
>
  <Text style={styles.title}>ArkaneMatch AI</Text>
  <Text style={styles.description}>
    Find scouts using natural language
  </Text>
</TouchableOpacity>
```

## Testing the Chat

### Start the App
```bash
cd /Users/lakhdari/Desktop/AppFoot/mobile
npm start
```

### Test Queries
Try these example queries:

1. **Basic Search**
   - "Find me Premier League scouts"
   - "Show scouts in LaLiga"

2. **Position Specific**
   - "Looking for defender specialists"
   - "Need a striker scout"

3. **Budget Filters**
   - "Scouts under €150/hour"
   - "Show affordable scouts"

4. **Combined Criteria**
   - "LaLiga defender scouts under €200/hr"
   - "Verified Premier League scouts with 4+ stars"

5. **Language/Location**
   - "French-speaking scouts"
   - "Scouts in Spain"

6. **General Questions**
   - "What can you help me with?"
   - "How does this work?"

## Component Usage

### Using Individual Components

#### ChatMessage
```tsx
import { ChatMessage } from '../../components/arkane-match';

<ChatMessage
  message={{
    id: '1',
    role: 'assistant',
    content: 'I found 2 scouts...',
    scouts: [...],
    timestamp: new Date()
  }}
  onScoutPress={(id) => console.log('Scout:', id)}
/>
```

#### ScoutMiniCard
```tsx
import { ScoutMiniCard } from '../../components/arkane-match';

<ScoutMiniCard
  scout={{
    id: '1',
    users: { firstName: 'John', lastName: 'Smith' },
    hourlyRate: 120,
    currency: 'EUR',
    isVerified: true,
    expertise: { leagues: ['Premier League'] }
  }}
  onPress={() => navigation.navigate('ScoutProfile', { id: '1' })}
/>
```

#### MessageInput
```tsx
import { MessageInput } from '../../components/arkane-match';

<MessageInput
  onSend={(message) => handleSend(message)}
  isLoading={false}
  placeholder="Type your message..."
/>
```

#### SuggestionChips
```tsx
import { SuggestionChips } from '../../components/arkane-match';

<SuggestionChips
  suggestions={['Find scouts', 'Show top rated']}
  onSuggestionPress={(suggestion) => handleSend(suggestion)}
/>
```

#### TypingIndicator
```tsx
import { TypingIndicator } from '../../components/arkane-match';

{isLoading && <TypingIndicator />}
```

## API Integration

### Send Chat Message
```tsx
import api from '../../services/api';

const response = await api.arkaneMatchChat(
  "Find Premier League scouts",
  conversationId // optional, for continuing conversation
);

console.log(response.response); // AI message
console.log(response.scouts);   // Matching scouts
console.log(response.conversationId); // For next message
```

### Get Conversation History
```tsx
const conversation = await api.getArkaneMatchConversation(conversationId);
console.log(conversation.messages);
```

### Clear Conversation
```tsx
await api.clearArkaneMatchConversation(conversationId);
```

### Get AI Info
```tsx
const info = await api.getArkaneMatchInfo();
console.log(info.capabilities);
```

## Customization

### Change Theme Colors
```tsx
// In src/components/arkane-match/ChatMessage.tsx
bubbleUser: {
  backgroundColor: colors.brand.primary, // Change to your color
}
```

### Modify Welcome Message
```tsx
// In src/screens/ai/ArkaneMatchScreen.tsx
const welcomeMessage = {
  content: "Your custom welcome message here...",
  // ...
};
```

### Add Custom Suggestions
```tsx
// In src/types/arkane-match.ts
export const SUGGESTED_PROMPTS = [
  "Your custom prompt 1",
  "Your custom prompt 2",
  // ...
];
```

### Change Input Placeholder
```tsx
<MessageInput
  placeholder="Your custom placeholder..."
  // ...
/>
```

## Error Handling

### Network Errors
```tsx
try {
  const response = await api.arkaneMatchChat(message);
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
  } else if (error.response?.status === 429) {
    // Rate limited - show message
  } else {
    // General error
    Alert.alert('Error', 'Failed to send message');
  }
}
```

### Empty Responses
```tsx
if (!response.response || response.scouts.length === 0) {
  // No results found
  showNoResultsMessage();
}
```

## Troubleshooting

### Messages Not Showing
- Check FlatList `data` prop has messages
- Verify message IDs are unique
- Check `renderItem` is called

### Keyboard Not Avoiding
- Ensure KeyboardAvoidingView wraps content
- Check `behavior` prop (iOS: 'padding', Android: undefined)
- Verify `keyboardVerticalOffset`

### Typing Indicator Not Animating
- Check `isLoading` state is true
- Verify animations are enabled
- Test on physical device (simulator may lag)

### Scout Cards Not Clickable
- Check `onScoutPress` prop is passed
- Verify TouchableOpacity is enabled
- Check z-index/overlay issues

### API Calls Failing
- Verify API_URL in config
- Check auth token is valid
- Confirm backend is running
- Check network connectivity

## Performance Tips

### Optimize Long Conversations
```tsx
// Use windowSize for FlatList
<FlatList
  windowSize={10}
  maxToRenderPerBatch={10}
  initialNumToRender={20}
  // ...
/>
```

### Reduce Re-renders
```tsx
import { memo, useCallback } from 'react';

const ChatMessage = memo(({ message, onScoutPress }) => {
  // Component implementation
});

const handleSend = useCallback((message) => {
  // Send logic
}, [conversationId]);
```

### Lazy Load Images
```tsx
<Image
  source={{ uri: scout.avatar }}
  defaultSource={require('../../assets/placeholder.png')}
  resizeMode="cover"
/>
```

## Accessibility

### Screen Reader Support
```tsx
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Send message"
  accessibilityHint="Sends your message to ArkaneMatch AI"
  accessibilityRole="button"
>
  {/* ... */}
</TouchableOpacity>
```

### Minimum Touch Targets
All interactive elements are 44x44 points minimum for easy tapping.

### Readable Text
- Minimum font size: 12px (typography.sizes.xs)
- High contrast: White text on dark backgrounds
- Proper line height: 1.5-1.625

## Integration Checklist

- [ ] Backend API running at correct URL
- [ ] Auth token properly configured
- [ ] Navigation route added to AppNavigator
- [ ] Type added to AppStackParamList
- [ ] API methods added to api.ts
- [ ] Components imported correctly
- [ ] Haptics permission granted (iOS)
- [ ] Keyboard settings configured
- [ ] Error boundaries added
- [ ] Analytics tracking added (optional)

## Next Steps

1. **Test with Real Data**
   - Ensure backend returns valid scout data
   - Test various search queries
   - Verify conversation context works

2. **Add Scout Profile Link**
   - Create scout detail screen
   - Link from ScoutMiniCard
   - Pass scout ID via navigation

3. **Enhance UX**
   - Add loading skeletons
   - Implement pull-to-refresh
   - Add message reactions

4. **Monitor Performance**
   - Track API response times
   - Monitor memory usage
   - Measure user engagement

## Support

For issues or questions:
1. Check backend API logs
2. Review React Native debugger
3. Check API response format matches types
4. Verify navigation stack configuration

## Quick Links

- **Main Screen**: `/mobile/src/screens/ai/ArkaneMatchScreen.tsx`
- **Components**: `/mobile/src/components/arkane-match/`
- **Types**: `/mobile/src/types/arkane-match.ts`
- **API**: `/mobile/src/services/api.ts`
- **Backend**: `/backend/src/modules/arkane-match/`
