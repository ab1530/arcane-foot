# Player Validation Dashboard - Quick Start Guide

## Installation

The dashboard is already set up. Just make sure you have all dependencies installed:

```bash
cd /Users/lakhdari/Desktop/AppFoot/web
npm install
```

## Environment Setup

Make sure your `.env.local` file has the correct API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Running the Dashboard

1. Start the backend server:
```bash
cd /Users/lakhdari/Desktop/AppFoot/backend
npm run start:dev
```

2. Start the frontend development server:
```bash
cd /Users/lakhdari/Desktop/AppFoot/web
npm run dev
```

3. Navigate to: `http://localhost:3001/admin/player-validation`

## Authentication

You must be logged in with one of the following roles:
- SUPER_ADMIN
- ADMIN
- SCOUT

## Quick Actions Guide

### 1. View Statistics
- Dashboard shows real-time stats automatically
- Charts display status distribution and recent activity
- Stats refresh every 30 seconds

### 2. Review Players
- Players list shows all pending players by default
- Use status filters to view VERIFIED, REJECTED, or SUSPICIOUS players
- Click "View" or "View Details" to open player profile

### 3. Validate a Player
1. Click on a player to open their profile
2. Review their information
3. Click "Validate" button
4. Add optional notes
5. Confirm action
6. Toast notification confirms success

### 4. Reject a Player
1. Open player profile
2. Click "Reject" button
3. Enter rejection reason (required)
4. Add optional notes
5. Confirm rejection

### 5. Mark as Suspicious
1. Open player profile
2. Click "Mark Suspicious" button
3. Enter reason (required)
4. Confirm action

### 6. Convert to Agency
1. Player must be VERIFIED first
2. Open player profile
3. Click "Convert to Agency" button
4. Add optional notes
5. Confirm conversion

### 7. Import Players (CSV)
1. Go to Bulk Actions section
2. Click "Upload CSV File"
3. Select your CSV file
4. Review preview
5. Choose auto-verify option if desired
6. Click "Import Players"
7. Review results

### 8. Export Players
1. Go to Bulk Actions section
2. Choose export option:
   - "Export All" - All public players
   - "Verified" - Only verified players
   - "Pending" - Only pending players
3. CSV file downloads automatically

## CSV Format Example

```csv
firstName,lastName,email,position,dateOfBirth,nationality,height,weight,preferredFoot,currentClub
John,Doe,john.doe@example.com,Forward,1998-01-15,United States,180,75,Right,Example FC
Jane,Smith,jane.smith@example.com,Midfielder,1999-05-20,United Kingdom,165,60,Left,Sample United
```

### Required Fields:
- firstName
- lastName
- email (must be unique)
- position
- dateOfBirth (YYYY-MM-DD format)
- nationality

### Optional Fields:
- phone
- height (in cm)
- weight (in kg)
- preferredFoot
- currentClub

## Keyboard Shortcuts

- `Esc` - Close modal/dialog
- `Tab` - Navigate between fields
- `Enter` - Submit form (when focused)

## Status Badge Colors

- **Yellow** - PENDING (awaiting review)
- **Green** - VERIFIED (approved)
- **Red** - REJECTED (declined)
- **Orange** - SUSPICIOUS (flagged for review)

## Tips & Best Practices

1. **Review validation history** before making decisions
2. **Always provide reasons** when rejecting players
3. **Use bulk import** for large datasets
4. **Export regularly** for backup purposes
5. **Check suspicious players** before validating
6. **Add notes** for context to help other admins
7. **Use search** to quickly find specific players
8. **Monitor pending count** to stay on top of reviews

## Troubleshooting

### Dashboard not loading
- Check if backend is running on port 3000
- Verify you're logged in
- Check browser console for errors
- Clear browser cache

### Can't validate/reject players
- Verify you have correct role (ADMIN/SUPER_ADMIN/SCOUT)
- Check authentication token is valid
- Try refreshing the page

### Import failing
- Verify CSV format matches template
- Check for duplicate emails
- Ensure dates are in YYYY-MM-DD format
- Look at error details in import results

### Charts not displaying
- Ensure recharts is installed: `npm list recharts`
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Common Issues

**Issue**: "Unauthorized" error
**Solution**: Log in with an admin account

**Issue**: Players list is empty
**Solution**: Import some players or check filters

**Issue**: CSV import shows all errors
**Solution**: Download template and compare format

**Issue**: Modal won't close
**Solution**: Click X button or press Esc key

## Getting Help

- **API Documentation**: http://localhost:3000/api/docs
- **Backend Logs**: Check terminal running backend
- **Frontend Errors**: Check browser console (F12)
- **Network Issues**: Check browser Network tab (F12)

## Next Steps

After getting familiar with the dashboard:

1. Set up regular validation workflow
2. Configure automated notifications (future feature)
3. Create custom export reports
4. Train team members on validation criteria
5. Monitor analytics for trends

## Support

For technical issues:
- Check README.md for detailed documentation
- Review backend API documentation
- Contact system administrator
- Check GitHub issues (if applicable)

---

**Dashboard Version**: 1.0.0
**Last Updated**: 2024
**Arcane Football Platform**
