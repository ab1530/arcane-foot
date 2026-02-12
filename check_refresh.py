import json
from pathlib import Path

text = Path('mobile/src/screens/calendar/CalendarScreen.tsx').read_text()
print('RefreshControl testID exists:', 'testID="calendar-refresh-control"' in text)
