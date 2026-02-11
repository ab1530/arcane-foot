# Player Validation Dashboard

A comprehensive admin dashboard for managing and validating public player submissions in the Arcane Football Platform.

## Overview

This dashboard provides administrators with powerful tools to review, validate, reject, and manage player profiles submitted to the platform. It features real-time statistics, bulk operations, and detailed player management capabilities.

## Features

### 1. Statistics Dashboard
- **Real-time metrics**: View pending, verified, rejected, and suspicious player counts
- **Visual analytics**: Interactive charts showing status distribution and activity trends
- **Performance tracking**: Monitor validation activity over the last 30 days
- **Percentage breakdowns**: Understand the composition of your player database

### 2. Player Management
- **Advanced filtering**: Filter by verification status (PENDING, VERIFIED, REJECTED, SUSPICIOUS)
- **Search functionality**: Quick search across player names and emails
- **Pagination**: Efficient browsing of large player lists
- **Responsive design**: Works seamlessly on desktop, tablet, and mobile devices

### 3. Player Detail Modal
- **Comprehensive view**: Full player profile with all relevant information
- **Validation history**: Timeline of all status changes and actions
- **Quick actions**:
  - Validate player
  - Reject player with reason
  - Mark as suspicious
  - Convert to agency player
- **Notes system**: Add contextual notes to validation decisions

### 4. Bulk Operations
- **CSV Import**: Upload multiple players at once
- **Auto-verification**: Option to automatically verify imported players
- **Export capabilities**: Download player lists filtered by status
- **Template download**: Get a pre-formatted CSV template
- **Error handling**: Detailed feedback on import failures

### 5. User Experience
- **Loading states**: Clear feedback during data fetching
- **Error handling**: User-friendly error messages
- **Toast notifications**: Real-time feedback on actions
- **Smooth animations**: Framer Motion powered transitions
- **Arcane branding**: Consistent dark theme with yellow accent

## File Structure

```
/web/src/app/admin/player-validation/
├── page.tsx                    # Main dashboard page
├── layout.tsx                  # Layout with React Query provider
├── types.ts                    # TypeScript type definitions
├── README.md                   # This file
└── components/
    ├── ValidationStats.tsx     # Statistics and charts component
    ├── PlayerValidationList.tsx # Player list with filtering
    ├── PlayerDetailModal.tsx   # Detailed player view modal
    └── BulkActions.tsx         # Import/Export operations

/web/src/services/
└── validationService.ts        # API service for validation endpoints

/web/src/providers/
└── QueryProvider.tsx           # React Query provider wrapper
```

## API Integration

The dashboard integrates with the following backend endpoints:

### Statistics
- `GET /api/admin/players/verification-stats` - Get verification statistics

### Player Retrieval
- `GET /api/admin/players/pending-validation` - Get pending players
- `GET /api/admin/players/by-status/:status` - Get players by status
- `GET /api/admin/players/:id/validation-history` - Get validation history

### Player Actions
- `POST /api/admin/players/:id/validate` - Validate a player
- `POST /api/admin/players/:id/reject` - Reject a player
- `POST /api/admin/players/:id/mark-suspicious` - Mark as suspicious
- `POST /api/admin/players/:id/convert-to-agency` - Convert to agency

### Bulk Operations
- `POST /api/admin/players/bulk-import` - Import players from JSON
- `POST /api/admin/players/bulk-import-csv` - Import players from CSV
- `GET /api/admin/players/export-csv` - Export players to CSV

## Usage

### Accessing the Dashboard

Navigate to `/admin/player-validation` in your browser. You must be authenticated with ADMIN, SUPER_ADMIN, or SCOUT role.

### Validating a Player

1. Click on a player in the list
2. Review their profile and information
3. Check validation history if available
4. Click "Validate" button
5. Optionally add notes
6. Confirm the action

### Rejecting a Player

1. Open player detail modal
2. Click "Reject" button
3. Provide a rejection reason (required)
4. Add optional notes
5. Confirm rejection

### Bulk Import

1. Click "Upload CSV File" in Bulk Actions section
2. Select your CSV file
3. Review the preview
4. Choose whether to auto-verify
5. Click "Import Players"
6. Review import results

### CSV Format

Required columns:
- `firstName` (string)
- `lastName` (string)
- `email` (string, unique)
- `position` (string)
- `dateOfBirth` (YYYY-MM-DD)
- `nationality` (string)

Optional columns:
- `phone` (string)
- `height` (number, cm)
- `weight` (number, kg)
- `preferredFoot` (string)
- `currentClub` (string)

Example:
```csv
firstName,lastName,email,position,dateOfBirth,nationality,height,weight
John,Doe,john@example.com,Forward,1998-01-15,United States,180,75
Jane,Smith,jane@example.com,Midfielder,1999-05-20,United Kingdom,165,60
```

## Technologies Used

- **React 19** - UI framework
- **Next.js 15** - App router and SSR
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Query (@tanstack/react-query)** - Data fetching and caching
- **Recharts** - Data visualization
- **Sonner** - Toast notifications
- **Lucide React** - Icons
- **shadcn/ui** - UI components

## Performance Optimizations

- **React Query caching**: Reduces unnecessary API calls
- **Pagination**: Efficient handling of large datasets
- **Lazy loading**: Components load on demand
- **Optimistic updates**: UI updates immediately
- **Debounced search**: Prevents excessive API requests

## Security Considerations

- **Role-based access**: Only authorized users can access
- **JWT authentication**: All API calls include auth tokens
- **Input validation**: CSV imports are validated
- **Error handling**: Sensitive errors are not exposed

## Accessibility

- **Keyboard navigation**: Full keyboard support
- **Screen reader friendly**: Semantic HTML
- **High contrast**: Dark theme with clear visual hierarchy
- **Responsive design**: Works on all device sizes

## Future Enhancements

Potential improvements for future versions:

1. **Advanced filters**: Date ranges, age groups, positions
2. **Batch operations**: Select multiple players for bulk actions
3. **Analytics dashboard**: More detailed insights and trends
4. **Email notifications**: Notify players of status changes
5. **Audit logs**: Complete history of all admin actions
6. **Player comparison**: Side-by-side profile comparison
7. **Automated verification**: ML-based suspicious player detection
8. **Custom reports**: Generate PDF reports
9. **Real-time updates**: WebSocket for live status changes
10. **Mobile app**: Native mobile version

## Troubleshooting

### Players not loading
- Check backend API is running
- Verify authentication token is valid
- Check browser console for errors
- Ensure proper role permissions

### Import failing
- Verify CSV format matches template
- Check for duplicate emails
- Ensure date format is YYYY-MM-DD
- Review error messages for specific issues

### Slow performance
- Check network connection
- Clear browser cache
- Reduce page limit in filters
- Contact system administrator

## Support

For technical support or questions:
- Backend API Documentation: Check Swagger at `/api/docs`
- Frontend Issues: Check browser console
- Contact: System Administrator

## License

Copyright 2024 Arcane Football Platform. All rights reserved.
