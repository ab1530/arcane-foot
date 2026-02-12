# ⚡ ARCANE PREMIUM COMPONENT LIBRARY

**Version:** 2.0.0
**Framework:** React / Next.js / React Native
**Status:** Production Ready

---

## 📚 COMPONENT CATALOG

### Tier 1: Primitives (Foundation)

#### 1.1 Buttons

**ArcaneButton**
```tsx
<ArcaneButton variant="primary" size="md" icon={<SearchIcon />}>
  Search Players
</ArcaneButton>
```
- **Variants:** primary | secondary | ghost | danger
- **Sizes:** sm | md | lg
- **States:** default | hover | active | disabled | loading
- **Features:** Icon support, loading spinner, glow effect

**IconButton**
```tsx
<IconButton icon={<HeartIcon />} variant="ghost" />
```
- Circular icon button
- Tooltip support
- Badge overlay option

**ButtonGroup**
```tsx
<ButtonGroup>
  <Button>Day</Button>
  <Button active>Week</Button>
  <Button>Month</Button>
</ButtonGroup>
```

---

#### 1.2 Cards

**ArcaneCard**
```tsx
<ArcaneCard variant="standard" hover glow>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</ArcaneCard>
```
- **Variants:** standard | glass | feature | stat
- **Features:** Hover lift, border glow, gradient overlay

**StatCard**
```tsx
<StatCard
  value="234"
  label="Total Reports"
  trend="+12%"
  icon={<FileTextIcon />}
  color="blue"
/>
```
- Displays key metrics
- Trend indicator (up/down)
- Icon with colored background
- Sparkline chart option

**PlayerCard**
```tsx
<PlayerCard
  player={playerData}
  onView={() => {}}
  onCompare={() => {}}
  compact={false}
/>
```
- Player photo
- Key stats
- Position badge
- Quick actions

**CoachCard**
```tsx
<CoachCard
  coach={coachData}
  onBook={() => {}}
  showRating
  showPrice
/>
```
- Coach photo
- Expertise badges
- Rating display
- Pricing info
- Book CTA

---

#### 1.3 Inputs

**ArcaneInput**
```tsx
<ArcaneInput
  type="text"
  placeholder="Search..."
  icon={<SearchIcon />}
  error="Invalid input"
/>
```
- **Types:** text | email | password | number | tel
- Icon support (left/right)
- Error states with message
- Character counter
- Clear button

**SearchInput**
```tsx
<SearchInput
  placeholder="Search players..."
  onSearch={handleSearch}
  loading={isSearching}
/>
```
- Debounced search
- Loading indicator
- Recent searches dropdown
- Clear button

**Select**
```tsx
<Select
  options={options}
  value={selected}
  onChange={handleChange}
  placeholder="Select..."
  searchable
  multiple
/>
```
- Custom styled dropdown
- Search filtering
- Multi-select support
- Custom option renderer

**DatePicker**
```tsx
<DatePicker
  value={date}
  onChange={setDate}
  minDate={minDate}
  maxDate={maxDate}
/>
```
- Calendar popup
- Date range support
- Preset ranges (Today, Week, Month)

**SliderInput**
```tsx
<SliderInput
  value={value}
  onChange={setValue}
  min={0}
  max={100}
  step={1}
  showValue
/>
```
- Custom styled range input
- Value display
- Min/max labels
- Dual-thumb for ranges

---

#### 1.4 Typography

**Heading**
```tsx
<Heading level={1} gradient>
  Welcome to Arcane
</Heading>
```
- **Levels:** 1-6
- Gradient text option
- Responsive sizing

**Text**
```tsx
<Text size="md" color="secondary" weight="medium">
  Body text
</Text>
```
- **Sizes:** xs | sm | md | lg | xl
- **Colors:** primary | secondary | tertiary | accent
- **Weights:** regular | medium | semibold | bold

**GradientText**
```tsx
<GradientText gradient="ai">
  AI-Powered Insights
</GradientText>
```
- **Gradients:** primary | ai | performance | premium

---

#### 1.5 Badges & Labels

**Badge**
```tsx
<Badge variant="success" size="sm">
  Active
</Badge>
```
- **Variants:** success | warning | error | info | premium
- **Sizes:** sm | md | lg
- Pill shape
- Icon support

**StatusDot**
```tsx
<StatusDot status="online" label="Active" />
```
- Online/offline indicator
- Pulsing animation
- Optional label

**Tag**
```tsx
<Tag color="blue" removable onRemove={handleRemove}>
  Defender
</Tag>
```
- Color variations
- Removable option
- Icon support

---

### Tier 2: Composite Components

#### 2.1 Navigation

**Sidebar**
```tsx
<Sidebar
  items={navItems}
  activeItem="dashboard"
  collapsed={isCollapsed}
  onToggle={toggleCollapse}
/>
```
- Collapsible sidebar
- Icon + label
- Active state highlighting
- Nested menu support
- Badge notifications

**BottomNav (Mobile)**
```tsx
<BottomNav
  tabs={tabs}
  activeTab="home"
  onChange={handleTabChange}
/>
```
- Fixed bottom navigation
- Icon + label
- Badge notifications
- Active indicator

**Breadcrumbs**
```tsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Players', href: '/players' },
    { label: 'John Doe' }
  ]}
/>
```
- Hierarchical navigation
- Separator customization
- Max items with collapse

**Tabs**
```tsx
<Tabs
  tabs={[
    { id: 'overview', label: 'Overview', content: <Overview /> },
    { id: 'stats', label: 'Statistics', content: <Stats /> }
  ]}
  defaultTab="overview"
/>
```
- Horizontal tabs
- Vertical tabs variant
- Icon support
- Badge notifications

---

#### 2.2 Feedback & Notifications

**Toast**
```tsx
toast.success('Report saved successfully!');
toast.error('Failed to load data');
toast.info('New update available');
toast.warning('Session expiring soon');
```
- Auto-dismiss
- Action button support
- Stacking support
- Position options

**Modal**
```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="md"
>
  <ModalContent>...</ModalContent>
  <ModalFooter>...</ModalFooter>
</Modal>
```
- **Sizes:** sm | md | lg | xl | fullscreen
- Backdrop blur
- Close button
- Keyboard ESC support

**AlertDialog**
```tsx
<AlertDialog
  isOpen={showAlert}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  title="Delete Report?"
  description="This action cannot be undone."
  variant="danger"
/>
```
- Confirmation dialogs
- **Variants:** info | warning | danger
- Primary/secondary actions

**Tooltip**
```tsx
<Tooltip content="View player details" placement="top">
  <IconButton icon={<EyeIcon />} />
</Tooltip>
```
- **Placements:** top | bottom | left | right
- Delay options
- Arrow indicator

**Popover**
```tsx
<Popover trigger={<Button>Actions</Button>}>
  <PopoverContent>
    <MenuItem>Edit</MenuItem>
    <MenuItem>Delete</MenuItem>
  </PopoverContent>
</Popover>
```
- Click or hover trigger
- Positioning
- Custom content

---

#### 2.3 Data Display

**Table**
```tsx
<Table
  columns={columns}
  data={data}
  sortable
  filterable
  pagination
  onRowClick={handleRowClick}
/>
```
- Sortable columns
- Filter row
- Pagination
- Row selection
- Sticky header
- Loading skeleton

**DataGrid**
```tsx
<DataGrid
  items={items}
  renderItem={renderCard}
  columns={3}
  gap={4}
  loading={isLoading}
/>
```
- Responsive grid
- Custom item renderer
- Loading state
- Empty state

**List**
```tsx
<List
  items={items}
  renderItem={(item) => <ListItem>{item.name}</ListItem>}
  divider
  spacing="md"
/>
```
- Vertical list
- Dividers
- Custom spacing
- Virtual scrolling for long lists

---

#### 2.4 Progress & Loading

**ProgressBar**
```tsx
<ProgressBar
  value={75}
  max={100}
  label="75% Complete"
  color="primary"
  animated
/>
```
- Linear progress
- Label display
- Animated filling
- Gradient support

**CircularProgress**
```tsx
<CircularProgress
  value={75}
  size="lg"
  thickness={8}
  label="75%"
  gradient
/>
```
- Circular progress indicator
- **Sizes:** sm | md | lg | xl
- Gradient option
- Center label

**Skeleton**
```tsx
<Skeleton type="text" lines={3} />
<Skeleton type="card" />
<Skeleton type="avatar" />
```
- **Types:** text | card | avatar | custom
- Shimmer animation
- Custom shapes

**Spinner**
```tsx
<Spinner size="md" color="primary" />
```
- Loading spinner
- **Sizes:** sm | md | lg
- Color variations

---

#### 2.5 Forms

**Form**
```tsx
<Form onSubmit={handleSubmit}>
  <FormField
    name="email"
    label="Email"
    type="email"
    required
    error={errors.email}
  />
  <FormActions>
    <Button type="submit">Submit</Button>
  </FormActions>
</Form>
```
- Form validation
- Error handling
- Field grouping
- Multi-step support

**Checkbox**
```tsx
<Checkbox
  checked={isChecked}
  onChange={setIsChecked}
  label="Accept terms"
/>
```
- Custom styled checkbox
- Indeterminate state
- Label positioning

**Radio**
```tsx
<RadioGroup
  options={options}
  value={selected}
  onChange={setSelected}
  direction="vertical"
/>
```
- Radio group
- Custom styling
- Icon support

**Switch**
```tsx
<Switch
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Enable notifications"
/>
```
- Toggle switch
- **Sizes:** sm | md | lg
- Loading state

---

### Tier 3: Domain-Specific Components

#### 3.1 Player Components

**PlayerAvatar**
```tsx
<PlayerAvatar
  player={player}
  size="lg"
  showBadge
  showStatus
/>
```
- Player photo
- Position badge
- Online status
- Fallback initials

**PlayerStats**
```tsx
<PlayerStats
  stats={playerStats}
  layout="grid"
  compact
/>
```
- Key statistics display
- Grid or list layout
- Trend indicators
- Color-coded values

**PositionBadge**
```tsx
<PositionBadge position="CF" size="md" />
```
- Position abbreviation
- Color-coded by position
- Tooltip with full name

---

#### 3.2 Gamification Components

**AchievementCard**
```tsx
<AchievementCard
  achievement={achievement}
  earned
  onShare={handleShare}
/>
```
- Achievement display
- Earned/locked state
- Progress indicator
- Share button

**BadgeDisplay**
```tsx
<BadgeDisplay
  badge={badge}
  size="lg"
  animated
  showTooltip
/>
```
- Badge icon/image
- Rarity indicator
- Animated on earn
- Tooltip with details

**XPBar**
```tsx
<XPBar
  currentXP={24350}
  nextLevelXP={28000}
  currentLevel={12}
  animated
/>
```
- XP progress bar
- Level display
- Next level info
- Animated fill

**LeaderboardTable**
```tsx
<LeaderboardTable
  entries={leaderboardData}
  currentUserId={userId}
  highlightUser
  showRank
  showChange
/>
```
- Ranked list
- User highlighting
- Rank change indicators
- Avatar + name + XP

---

#### 3.3 AI Components

**AIInsightCard**
```tsx
<AIInsightCard
  insight={aiInsight}
  confidence={0.92}
  icon={<SparklesIcon />}
/>
```
- AI-generated insight
- Confidence indicator
- Icon representation
- Expandable details

**PredictionCard**
```tsx
<PredictionCard
  prediction={predictionData}
  actualValue={actualData}
  showAccuracy
/>
```
- Predicted vs actual
- Accuracy score
- Confidence interval
- Visual comparison

**RadarChart**
```tsx
<RadarChart
  data={playerAttributes}
  categories={attributeNames}
  color="primary"
  animated
/>
```
- 6-axis radar chart
- Animated on load
- Hover tooltips
- Gradient fill

**HeatMap**
```tsx
<HeatMap
  data={heatmapData}
  gradient={heatmapGradient}
  showLegend
  onCellClick={handleCellClick}
/>
```
- Grid-based heatmap
- Color gradient
- Interactive cells
- Legend

---

#### 3.4 Coaching Components

**CoachingSessionCard**
```tsx
<CoachingSessionCard
  session={sessionData}
  onJoin={handleJoin}
  onCancel={handleCancel}
  onRate={handleRate}
/>
```
- Session details
- Date/time display
- Coach info
- Action buttons
- Rating prompt (post-session)

**AvailabilityCalendar**
```tsx
<AvailabilityCalendar
  availableSlots={slots}
  onSelectSlot={handleSelect}
  timezone={userTimezone}
/>
```
- Calendar view
- Available slot highlighting
- Slot selection
- Timezone display

**RatingStars**
```tsx
<RatingStars
  value={4.5}
  max={5}
  editable
  onChange={handleRatingChange}
  size="lg"
/>
```
- Star rating display
- Editable mode
- Half-star support
- Hover preview

---

#### 3.5 Onboarding Components

**OnboardingWizard**
```tsx
<OnboardingWizard
  steps={steps}
  currentStep={currentStep}
  onStepComplete={handleStepComplete}
  onSkip={handleSkip}
/>
```
- Multi-step wizard
- Progress indicator
- Step navigation
- Skip option

**FeatureTour**
```tsx
<FeatureTour
  steps={tourSteps}
  isActive={showTour}
  onComplete={handleTourComplete}
/>
```
- Interactive tour
- Spotlight highlighting
- Step-by-step guidance
- Skip/complete options

**RoleSelector**
```tsx
<RoleSelector
  roles={availableRoles}
  selectedRole={selected}
  onChange={handleRoleChange}
/>
```
- Visual role cards
- Icon + description
- Single selection
- Hover effects

---

### Tier 4: Layout Components

**Container**
```tsx
<Container maxWidth="lg" centered>
  Content
</Container>
```
- **Max widths:** sm | md | lg | xl | 2xl
- Centered option
- Padding options

**Grid**
```tsx
<Grid columns={3} gap={6} responsive>
  <GridItem>...</GridItem>
  <GridItem>...</GridItem>
</Grid>
```
- CSS Grid wrapper
- Responsive columns
- Custom gap
- Span support

**Flex**
```tsx
<Flex direction="row" justify="between" align="center" gap={4}>
  <FlexItem>...</FlexItem>
  <FlexItem>...</FlexItem>
</Flex>
```
- Flexbox wrapper
- Direction control
- Justify/align options
- Gap support

**Stack**
```tsx
<Stack direction="vertical" spacing={4}>
  <StackItem>...</StackItem>
  <StackItem>...</StackItem>
</Stack>
```
- Simple stacking
- Vertical/horizontal
- Consistent spacing

**Divider**
```tsx
<Divider orientation="horizontal" spacing="md" />
```
- Horizontal/vertical
- Custom thickness
- Spacing options

---

### Tier 5: Utility Components

**Portal**
```tsx
<Portal>
  <Modal>...</Modal>
</Portal>
```
- React portal wrapper
- Renders outside DOM hierarchy

**ErrorBoundary**
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```
- Catches React errors
- Custom fallback UI
- Error logging

**LazyLoad**
```tsx
<LazyLoad>
  <HeavyComponent />
</LazyLoad>
```
- Lazy component loading
- Intersection Observer
- Loading placeholder

**EmptyState**
```tsx
<EmptyState
  icon={<InboxIcon />}
  title="No reports yet"
  description="Create your first report to get started"
  action={<Button>Create Report</Button>}
/>
```
- Empty data state
- Icon + message
- CTA button
- Illustration support

---

## 📦 COMPONENT ORGANIZATION

### File Structure

```
src/components/
├── primitives/          # Tier 1: Basic components
│   ├── Button/
│   ├── Card/
│   ├── Input/
│   ├── Typography/
│   └── Badge/
├── composite/           # Tier 2: Composite components
│   ├── Navigation/
│   ├── Feedback/
│   ├── DataDisplay/
│   ├── Progress/
│   └── Forms/
├── domain/              # Tier 3: Domain-specific
│   ├── Player/
│   ├── Gamification/
│   ├── AI/
│   ├── Coaching/
│   └── Onboarding/
├── layout/              # Tier 4: Layout components
│   ├── Container/
│   ├── Grid/
│   ├── Flex/
│   └── Stack/
└── utility/             # Tier 5: Utility components
    ├── Portal/
    ├── ErrorBoundary/
    ├── LazyLoad/
    └── EmptyState/
```

---

## 🎨 COMPONENT VARIANTS

### Theming Support

All components support module-specific theming:

```tsx
<ThemeProvider theme="scouting">  {/* Blue theme */}
  <ArcaneButton>Search</ArcaneButton>
</ThemeProvider>

<ThemeProvider theme="ai">  {/* Purple theme */}
  <AIInsightCard />
</ThemeProvider>

<ThemeProvider theme="coaching">  {/* Green theme */}
  <CoachCard />
</ThemeProvider>

<ThemeProvider theme="gamification">  {/* Gold theme */}
  <AchievementCard />
</ThemeProvider>
```

---

## 📚 STORYBOOK INTEGRATION

Each component has Storybook stories:

```tsx
// Button.stories.tsx
export default {
  title: 'Primitives/Button',
  component: ArcaneButton,
};

export const Primary = () => <ArcaneButton>Click me</ArcaneButton>;
export const WithIcon = () => (
  <ArcaneButton icon={<SearchIcon />}>Search</ArcaneButton>
);
export const Loading = () => <ArcaneButton loading>Loading</ArcaneButton>;
```

---

## ✅ COMPONENT CHECKLIST

Every component must have:
- [ ] TypeScript types
- [ ] Accessibility support (ARIA labels, keyboard nav)
- [ ] Dark mode only (no light mode)
- [ ] Responsive design
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Hover/active/focus states
- [ ] Storybook story
- [ ] Unit tests
- [ ] Documentation

---

## 🚀 USAGE EXAMPLES

### Building a Player Card

```tsx
<ArcaneCard variant="feature" hover glow>
  <PlayerAvatar player={player} size="lg" showBadge />
  <Heading level={3}>{player.name}</Heading>
  <Flex gap={2}>
    <PositionBadge position={player.position} />
    <Badge variant="success">{player.status}</Badge>
  </Flex>
  <PlayerStats stats={player.stats} compact />
  <Flex justify="between" gap={2}>
    <ArcaneButton variant="primary" size="sm">
      View Profile
    </ArcaneButton>
    <IconButton icon={<HeartIcon />} variant="ghost" />
  </Flex>
</ArcaneCard>
```

### Building a Dashboard Stat Section

```tsx
<Grid columns={4} gap={6}>
  <StatCard
    value="234"
    label="Total Reports"
    trend="+12%"
    icon={<FileTextIcon />}
    color="blue"
  />
  <StatCard
    value="1,234"
    label="Players Scouted"
    trend="+8%"
    icon={<UsersIcon />}
    color="green"
  />
  <StatCard
    value="56"
    label="Matches"
    trend="-3%"
    icon={<CalendarIcon />}
    color="purple"
  />
  <StatCard
    value="24,350"
    label="Total XP"
    trend="+15%"
    icon={<TrophyIcon />}
    color="gold"
  />
</Grid>
```

---

**Component Library Maintained By:** Design & Engineering
**Status:** ✅ Ready for Implementation
**Total Components:** 80+
