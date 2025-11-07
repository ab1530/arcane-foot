# Email Campaign Guide - RBAC Rollout Communication

## Campaign Overview

**Campaign Name:** RBAC Security Update & Tier Optimization Campaign
**Objective:** Communicate RBAC changes, drive FREE→GOLD conversions, upsell BASIC→GOLD, retain premium members
**Launch Date:** [Set date - recommended within 48 hours of RBAC deployment]
**Duration:** 7-day campaign with 3 touch points

---

## User Segmentation

### SQL Queries for User Segmentation

#### Segment 1: FREE Users (Conversion Target)
```sql
-- Get all FREE tier users
SELECT
  u.id,
  u.email,
  u.name,
  u.createdAt as signup_date,
  u.tier,
  COUNT(DISTINCT sr.id) as reports_created,
  COUNT(DISTINCT p.id) as players_viewed
FROM "User" u
LEFT JOIN "ScoutingReport" sr ON sr.scoutId = u.id
LEFT JOIN "PlayerView" p ON p.userId = u.id
WHERE u.tier = 'FREE'
  AND u.email IS NOT NULL
  AND u.emailVerified = true
GROUP BY u.id, u.email, u.name, u.createdAt, u.tier
ORDER BY u.createdAt DESC;
```

**Expected Size:** 70-80% of user base
**Campaign:** Email 1 - Upgrade with 30% discount

---

#### Segment 2: BASIC Users (Upsell Target)
```sql
-- Get all BASIC tier users
SELECT
  u.id,
  u.email,
  u.name,
  u.createdAt as signup_date,
  u.tier,
  s.status as subscription_status,
  s.currentPeriodEnd as subscription_expires,
  COUNT(DISTINCT sr.id) as reports_created,
  COUNT(DISTINCT p.id) as players_viewed
FROM "User" u
LEFT JOIN "Subscription" s ON s.userId = u.id
LEFT JOIN "ScoutingReport" sr ON sr.scoutId = u.id
LEFT JOIN "PlayerView" p ON p.userId = u.id
WHERE u.tier = 'BASIC'
  AND u.email IS NOT NULL
  AND u.emailVerified = true
GROUP BY u.id, u.email, u.name, u.createdAt, u.tier, s.status, s.currentPeriodEnd
ORDER BY u.createdAt DESC;
```

**Expected Size:** 15-20% of user base
**Campaign:** Email 2 - Loyalty offer (first month at BASIC price)

---

#### Segment 3: GOLD+ Users (Retention Target)
```sql
-- Get all GOLD, PRO, ENTERPRISE users
SELECT
  u.id,
  u.email,
  u.name,
  u.createdAt as signup_date,
  u.tier,
  s.status as subscription_status,
  s.currentPeriodEnd as subscription_expires,
  COUNT(DISTINCT sr.id) as reports_created,
  COUNT(DISTINCT ai.id) as ai_features_used
FROM "User" u
LEFT JOIN "Subscription" s ON s.userId = u.id
LEFT JOIN "ScoutingReport" sr ON sr.scoutId = u.id
LEFT JOIN "AIUsageLog" ai ON ai.userId = u.id
WHERE u.tier IN ('GOLD', 'PRO', 'ENTERPRISE')
  AND u.email IS NOT NULL
  AND u.emailVerified = true
GROUP BY u.id, u.email, u.name, u.createdAt, u.tier, s.status, s.currentPeriodEnd
ORDER BY u.tier DESC, u.createdAt DESC;
```

**Expected Size:** 5-10% of user base
**Campaign:** Email 3 - Security enhancement & retention

---

## Campaign Schedule

### Week 1: Launch Sequence

| Day | Segment | Email | Subject Line | Send Time |
|-----|---------|-------|--------------|-----------|
| Day 1 (Monday) | GOLD+ Users | Email 3 - Retention | "Enhanced Security for Your Premium Features" | 10:00 AM CET |
| Day 1 (Monday) | BASIC Users | Email 2 - Upsell | "Unlock AI Features - Exclusive Loyalty Offer" | 2:00 PM CET |
| Day 2 (Tuesday) | FREE Users | Email 1 - Conversion | "Unlock Advanced AI Scouting - Special 30% Discount Inside" | 10:00 AM CET |
| Day 4 (Thursday) | FREE Users (no open) | Email 1 - Resend | "Your Premium Features Await - Limited Time Offer" | 3:00 PM CET |
| Day 7 (Sunday) | FREE Users (no conversion) | Final Reminder | "Last Chance: 30% OFF GOLD Expires Tonight" | 5:00 PM CET |

**Rationale:**
- **Day 1 AM:** Send to GOLD+ first to reassure existing customers
- **Day 1 PM:** Send to BASIC users (paying customers get priority)
- **Day 2:** Send to FREE users with conversion focus
- **Day 4:** Resend to FREE users who didn't open (50% of list)
- **Day 7:** Final urgency email to FREE users

---

## Email Templates

### Template Files

| Segment | HTML Template | Plain Text Template |
|---------|---------------|---------------------|
| FREE Users | `email-free-users-upgrade.html` | `email-free-users-upgrade.txt` |
| BASIC Users | `email-basic-users-upsell.html` | `email-basic-users-upsell.txt` |
| GOLD+ Users | `email-gold-users-retention.html` | `email-gold-users-retention.txt` |

### Subject Line A/B Testing

#### Email 1: FREE Users (Test 3 variants)
- **Variant A:** "Unlock Advanced AI Scouting - Special 30% Discount Inside"
- **Variant B:** "Your Premium Features Await - Limited Time Offer"
- **Variant C:** "Upgrade to GOLD and Save 30% This Week"

**Hypothesis:** Variant A (feature-focused + discount) will have highest open rate
**Test Size:** 33% each variant
**Winner Selection:** After 24 hours, send winner to remaining 50% (Day 4 resend)

#### Email 2: BASIC Users (Test 2 variants)
- **Variant A:** "Unlock AI Features - Exclusive Loyalty Offer"
- **Variant B:** "You're Ready for GOLD - Special Pricing Inside"

**Test Size:** 50% each variant

#### Email 3: GOLD+ Users (Single variant)
- "Enhanced Security for Your Premium Features"

**Rationale:** Retention email doesn't need testing; focus is reassurance, not conversion

---

## Expected Results & Metrics

### Conversion Rate Projections

| Segment | Email Opens | CTR (Click) | Conversion Rate | Expected Conversions |
|---------|-------------|-------------|-----------------|---------------------|
| FREE → GOLD | 28% | 12% | 10-15% | 100-150 per 1,000 FREE users |
| BASIC → GOLD | 45% | 22% | 18-25% | 180-250 per 1,000 BASIC users |
| GOLD+ Retention | 52% | 8% | N/A (retention) | 95%+ retention |

### Revenue Impact (Per 1,000 Users)

**FREE Users (1,000 users):**
- Conversions: 120 users @ €34.99/month (discounted first month)
- Month 1 Revenue: €4,198
- Month 2+ Revenue: €5,998/month (€49.99 regular price)
- Annual Impact: ~€68,000

**BASIC Users (1,000 users):**
- Conversions: 200 users @ €19.99/month (loyalty first month)
- Month 1 Revenue: €3,998
- Month 2+ Revenue: €9,998/month (€49.99 regular price)
- Annual Impact: ~€116,000

**Total Campaign Revenue Impact (Conservative):**
- **Year 1 ARR Increase:** €150,000 - €250,000 per 10,000 users

---

## Success Metrics & KPIs

### Primary Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Email Open Rate** | 30-35% (FREE), 40-50% (BASIC), 50%+ (GOLD) | Email platform analytics |
| **Click-Through Rate (CTR)** | 10-15% (FREE), 18-25% (BASIC) | Track CTA clicks to upgrade pages |
| **FREE → GOLD Conversion** | 10-15% | Stripe webhook + user tier updates |
| **BASIC → GOLD Conversion** | 18-25% | Stripe webhook + user tier updates |
| **GOLD+ Retention** | 95%+ | Monitor churn rate post-campaign |
| **Support Ticket Volume** | < 2% of recipients | Support system tracking |

### Secondary Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| **Discount Code Usage** | 80% of conversions use GOLDUPGRADE30 | Track campaign attribution |
| **Time to Conversion** | Average 2-3 days | Optimize future campaigns |
| **Unsubscribe Rate** | < 0.5% | Measure email fatigue |
| **Landing Page Conversion** | 25-35% | Optimize upgrade flow |

---

## Technical Implementation

### Email Sending Service

**Recommended Platform:** SendGrid, Mailgun, or AWS SES

#### SendGrid Template IDs (Example)
```javascript
const TEMPLATE_IDS = {
  FREE_USERS_UPGRADE: 'd-abc123...',
  BASIC_USERS_UPSELL: 'd-def456...',
  GOLD_USERS_RETENTION: 'd-ghi789...',
};
```

### Dynamic Personalization Variables

```javascript
// Email 1: FREE Users
{
  "user_name": "{{user.name}}",
  "signup_date": "{{user.createdAt | date}}",
  "reports_created": "{{user.reportCount}}",
  "discount_code": "GOLDUPGRADE30",
  "discount_expires": "{{campaign.endDate}}"
}

// Email 2: BASIC Users
{
  "user_name": "{{user.name}}",
  "current_tier": "BASIC",
  "monthly_price": "€19.99",
  "gold_price": "€49.99",
  "loyalty_code": "LOYALTY",
  "subscription_expires": "{{user.subscriptionEnd | date}}"
}

// Email 3: GOLD+ Users
{
  "user_name": "{{user.name}}",
  "current_tier": "{{user.tier}}",
  "member_since": "{{user.createdAt | date}}",
  "ai_features_used": "{{user.aiUsageCount}}"
}
```

### Tracking Parameters

Add UTM parameters to all links:

```
https://arcane-football.com/upgrade?
  utm_source=email&
  utm_medium=campaign&
  utm_campaign=rbac_rollout&
  utm_content=free_users_30off&
  code=GOLDUPGRADE30
```

---

## Discount Code Configuration

### Stripe Coupon Setup

#### Code: GOLDUPGRADE30
```javascript
// Create Stripe coupon
stripe.coupons.create({
  id: 'GOLDUPGRADE30',
  percent_off: 30,
  duration: 'once',
  max_redemptions: 1000, // Limit to control cost
  redeem_by: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  name: 'RBAC Launch - 30% OFF GOLD Tier',
  metadata: {
    campaign: 'rbac_rollout',
    segment: 'free_users'
  }
});
```

**Discount Details:**
- Original Price: €49.99/month
- Discounted Price: €34.99/month (first month)
- Then: €49.99/month
- Valid: 7 days from campaign launch

#### Code: LOYALTY (BASIC Users)
```javascript
// Special loyalty pricing
stripe.prices.create({
  unit_amount: 1999, // €19.99
  currency: 'eur',
  recurring: {
    interval: 'month',
    interval_count: 1,
  },
  product: 'prod_gold_tier',
  nickname: 'GOLD - Loyalty First Month',
  metadata: {
    campaign: 'rbac_rollout',
    segment: 'basic_users',
    promotion: 'loyalty_upgrade'
  }
});
```

**Loyalty Offer:**
- First Month: €19.99 (same as BASIC)
- Then: €49.99/month
- No coupon code needed (automated at checkout)

---

## A/B Testing Framework

### Test 1: Subject Lines (FREE Users)

| Variant | Subject Line | Hypothesis |
|---------|-------------|------------|
| A (Control) | "Unlock Advanced AI Scouting - Special 30% Discount Inside" | Feature + discount = best open rate |
| B | "Your Premium Features Await - Limited Time Offer" | Urgency-focused = better action |
| C | "Upgrade to GOLD and Save 30% This Week" | Direct CTA = higher intent |

**Sample Size:** 3,000 FREE users (1,000 each)
**Duration:** 24 hours
**Winner Criteria:** Highest open rate × CTR

### Test 2: CTA Button Copy (Landing Page)

| Variant | Button Text | Hypothesis |
|---------|-------------|------------|
| A (Control) | "Claim Your 30% Discount" | Value-focused = higher conversion |
| B | "Upgrade to GOLD Now" | Action-focused = clearer intent |
| C | "Start Free Trial" | Lower commitment = more clicks |

**Sample Size:** 50/50 split of landing page traffic
**Winner Criteria:** Highest conversion to paid

### Test 3: Social Proof Placement

| Variant | Testimonial Position | Hypothesis |
|---------|---------------------|------------|
| A (Control) | After feature list | Traditional placement |
| B | Above CTA button | Last thing before conversion |

**Winner Criteria:** Higher scroll-to-CTA and conversion rate

---

## Customer Support Preparation

### Expected Support Volume

| Topic | Expected Tickets | Response Time SLA |
|-------|-----------------|-------------------|
| "Why am I losing features?" | 50-100 (FREE users) | < 4 hours |
| "Discount code not working" | 20-30 | < 2 hours |
| "What tier do I need?" | 30-50 | < 4 hours |
| "Cancel my subscription" | 10-15 (expected churn) | < 24 hours |
| "Technical issues with AI features" | 5-10 | < 2 hours |

**Total Expected:** 115-205 tickets over 7 days

### FAQ Responses (Pre-Written)

#### Q: "Why am I losing access to AI features?"
**A:**
"Thank you for reaching out! AI features have always been part of our premium tiers. We've implemented enhanced security (RBAC) to protect these advanced features and ensure the best performance for paying members.

As a FREE user, you still have full access to:
- Player database (500K+ profiles)
- Match calendar and basic stats
- Club and scout networks
- Basic scouting reports

To unlock AI features like SmartScout, Performance Predictor, and Market Value AI, upgrade to GOLD. We're offering 30% OFF this week: use code GOLDUPGRADE30 at checkout.

[Upgrade to GOLD] (link)"

---

#### Q: "The discount code isn't working."
**A:**
"I'm sorry to hear that! Let me help you right away.

Please check:
1. Code is entered correctly: GOLDUPGRADE30 (all caps, no spaces)
2. You're selecting the GOLD tier (€49.99/month)
3. The code hasn't expired (valid until [date])

If it's still not working, I'll manually apply the discount for you. Can you provide:
- Your account email
- Screenshot of the error (if any)

I'll respond within 30 minutes with a custom discount link.

Best,
[Agent Name]"

---

#### Q: "What tier do I need for [specific feature]?"
**A:**
"Great question! Here's a quick breakdown:

**FREE:** Player database, match calendar, basic reports
**BASIC (€19.99/mo):** Everything in FREE + advanced search, unlimited reports
**GOLD (€49.99/mo):** Everything in BASIC + ALL 8 AI features

AI features include: SmartScout AI, Performance Predictor, Market Value AI, Playstyle DNA, Arkane Match Analysis, Voice-to-Report, AI Search, AutoScout.

For [specific feature user mentioned], you'll need GOLD tier.

We have a special offer this week: 30% OFF your first month (€34.99 instead of €49.99).

[View Full Comparison] (link)
[Upgrade to GOLD] (link)

Let me know if you have other questions!

Best,
[Agent Name]"

---

### Support Team Briefing

**Pre-Campaign Training (1 hour):**
1. Overview of RBAC changes (technical)
2. New tier restrictions for AI features
3. Discount code mechanics and troubleshooting
4. Expected user objections and responses
5. Escalation path for technical issues

**Support Resources:**
- RBAC Implementation Doc: `/backend/RBAC_IMPLEMENTATION_GUIDE.md`
- Tier Comparison Chart: `/docs/TIER_COMPARISON.md`
- Discount Code Admin Panel: Stripe Dashboard
- Internal Slack Channel: #rbac-campaign-support

---

## Post-Campaign Analysis

### Analysis Checklist (Day 8)

- [ ] **Conversion Report:** Export all upgrades during campaign period
- [ ] **Revenue Impact:** Calculate MRR increase from conversions
- [ ] **A/B Test Winners:** Document winning subject lines and CTAs
- [ ] **Segment Performance:** Compare FREE vs BASIC conversion rates
- [ ] **Support Analysis:** Review ticket themes and resolutions
- [ ] **Churn Analysis:** Monitor GOLD+ retention post-campaign
- [ ] **Landing Page Optimization:** Identify drop-off points in funnel
- [ ] **Discount Code ROI:** Calculate cost of discounts vs LTV increase

### Report Template

```markdown
# RBAC Campaign Results - Week 1

## Executive Summary
- **Total Emails Sent:** [X]
- **Total Conversions:** [X]
- **Revenue Impact:** €[X] MRR increase
- **ROI:** [X]% (revenue vs campaign cost)

## Segment Performance

### FREE Users
- Sent: [X]
- Opens: [X] ([X]%)
- Clicks: [X] ([X]%)
- Conversions: [X] ([X]%)
- Revenue: €[X]

### BASIC Users
- Sent: [X]
- Opens: [X] ([X]%)
- Clicks: [X] ([X]%)
- Conversions: [X] ([X]%)
- Revenue: €[X]

### GOLD+ Users
- Sent: [X]
- Opens: [X] ([X]%)
- Churn: [X] ([X]%)

## A/B Test Results

### Subject Line Winner: [Variant X]
- Open Rate: [X]% (vs [X]% control)
- Statistical Significance: [Yes/No]

### CTA Button Winner: [Variant X]
- Conversion Rate: [X]% (vs [X]% control)

## Key Learnings
1. [Insight 1]
2. [Insight 2]
3. [Insight 3]

## Recommendations for Next Campaign
1. [Action 1]
2. [Action 2]
3. [Action 3]
```

---

## Contingency Plans

### Scenario 1: High Churn (GOLD+ users)

**If churn > 5% in first 48 hours:**

1. **Immediate Action:** Pause FREE/BASIC campaigns
2. **Send Apology Email to GOLD+ users:**
   - Subject: "We Heard Your Feedback - Here's What's Changing"
   - Offer: Free month extension or bonus feature
3. **Review RBAC implementation for bugs**
4. **Schedule 1-on-1 calls with churned users**

**Escalation Trigger:** > 3% churn in 24 hours

---

### Scenario 2: Support Overwhelmed

**If tickets > 300 in first 48 hours:**

1. **Auto-responder:** Set up instant FAQ responses
2. **Temporary SLA adjustment:** 8-hour response time
3. **Bring in backup support:** Developer team assists
4. **Pause outbound emails:** Slow down campaign

**Escalation Trigger:** > 150 tickets in 24 hours

---

### Scenario 3: Low Conversion Rate

**If FREE→GOLD < 5% after Day 4:**

1. **Increase discount:** 30% → 40% OFF
2. **Extend deadline:** 7 days → 14 days
3. **Add bonus:** First month + free onboarding call
4. **Adjust messaging:** Focus on specific AI features (Performance Predictor)

**Escalation Trigger:** < 5% conversion by Day 4

---

### Scenario 4: Discount Code Abuse

**If same user creates multiple accounts for discount:**

1. **Technical fix:** Limit to 1 code per email domain
2. **Manual review:** Flag suspicious accounts (created < 24h ago)
3. **Stripe rule:** Require payment method verification before discount

**Prevention:** Implement before campaign launch

---

## Legal & Compliance

### GDPR Compliance Checklist

- [x] All emails include unsubscribe link
- [x] Privacy policy link in footer
- [x] User consent verified (emailVerified = true)
- [x] Data retention policy followed (no emails to deleted accounts)
- [x] Right to data portability (users can export their data)

### Discount Terms & Conditions

**Displayed on checkout page:**

```
30% OFF GOLD Tier - Terms & Conditions

1. Discount applies to first month only (€34.99 instead of €49.99)
2. Subscription auto-renews at €49.99/month after first month
3. Valid for new GOLD subscriptions only (not for renewals)
4. One use per customer
5. Cannot be combined with other offers
6. Expires [7 days from campaign launch]
7. Arcane Football reserves the right to modify or cancel this offer

Cancel anytime via account settings. No refunds for partial months.
```

---

## Campaign Checklist

### Pre-Launch (Day -2)

- [ ] **Stripe Coupons Created:**
  - [ ] GOLDUPGRADE30 (30% off, 7-day expiry)
  - [ ] LOYALTY pricing (€19.99 first month)
- [ ] **Email Templates Loaded:**
  - [ ] Upload HTML templates to SendGrid
  - [ ] Test plain text fallbacks
  - [ ] Verify personalization tokens
- [ ] **User Segmentation:**
  - [ ] Run SQL queries and export CSVs
  - [ ] Verify email counts (FREE, BASIC, GOLD+)
  - [ ] Remove bounced/unsubscribed emails
- [ ] **Landing Pages:**
  - [ ] Test `/upgrade` page with discount code
  - [ ] Verify Stripe checkout integration
  - [ ] Add UTM tracking parameters
- [ ] **A/B Tests:**
  - [ ] Configure subject line variants
  - [ ] Set up landing page split (50/50)
  - [ ] Verify tracking pixels
- [ ] **Support Prep:**
  - [ ] Train support team (1-hour session)
  - [ ] Load FAQ responses into help desk
  - [ ] Create internal Slack channel
- [ ] **Monitoring:**
  - [ ] Set up Stripe webhook alerts
  - [ ] Configure email analytics dashboard
  - [ ] Create real-time conversion tracker

### Launch Day (Day 0)

- [ ] **Morning (9 AM CET):**
  - [ ] Final RBAC deployment check
  - [ ] Verify all AI features restricted correctly
  - [ ] Test discount codes one more time
- [ ] **10 AM CET:** Send Email 3 (GOLD+ users)
- [ ] **2 PM CET:** Send Email 2 (BASIC users)
- [ ] **Monitoring:**
  - [ ] Check open rates (first 2 hours)
  - [ ] Monitor support ticket volume
  - [ ] Watch for error reports

### Day 1 (Tuesday)

- [ ] **10 AM CET:** Send Email 1 (FREE users - Variant A/B/C)
- [ ] **Monitor A/B test results** (subject lines)
- [ ] **Review support tickets** and adjust FAQs if needed

### Day 4 (Thursday)

- [ ] **9 AM CET:** Analyze A/B test winner
- [ ] **3 PM CET:** Resend Email 1 to non-openers (winning subject line)
- [ ] **Check conversion rate:** If < 5%, activate contingency plan

### Day 7 (Sunday)

- [ ] **5 PM CET:** Send final urgency email (FREE users who didn't convert)
- [ ] **Subject:** "Last Chance: 30% OFF GOLD Expires Tonight"
- [ ] **11:59 PM CET:** Expire discount codes

### Day 8 (Post-Campaign)

- [ ] **Pull analytics report** (conversions, revenue, retention)
- [ ] **Analyze A/B test results** and document winners
- [ ] **Review support tickets** for product feedback
- [ ] **Calculate ROI** and present to leadership
- [ ] **Plan next steps:** Onboarding emails for new GOLD users

---

## Next Steps: Onboarding Sequence (New GOLD Users)

**After a user upgrades, send a 5-email onboarding sequence:**

### Email 1: Welcome to GOLD (Immediate)
- Subject: "Welcome to GOLD - Here's How to Get Started"
- Content: Quick start guide, link to AI features tutorial
- CTA: "Explore Your First AI Feature"

### Email 2: SmartScout Tutorial (Day 2)
- Subject: "Find Your Next Star Player with SmartScout AI"
- Content: Step-by-step guide, video demo
- CTA: "Try SmartScout Now"

### Email 3: Performance Predictor (Day 4)
- Subject: "Predict Future Performance with 85% Accuracy"
- Content: Case study, how it works
- CTA: "Analyze a Player"

### Email 4: Advanced Tips (Day 7)
- Subject: "Pro Tips: Get the Most Out of Your AI Tools"
- Content: Power user tips, keyboard shortcuts
- CTA: "View Full Guide"

### Email 5: Feedback Request (Day 14)
- Subject: "How's Your Experience with GOLD? (Quick Survey)"
- Content: 3-question survey, testimonial request
- CTA: "Share Feedback (2 minutes)"

---

## Contact & Support

**Campaign Manager:** [Your Name]
**Email:** marketing@arcane-football.com
**Slack:** #rbac-campaign

**Technical Support:** premium-support@arcane-football.com
**Emergency Contact:** [Phone Number]

---

## Appendix

### A. User Tier Comparison (For Support Reference)

| Feature | FREE | BASIC | GOLD | PRO | ENTERPRISE |
|---------|------|-------|------|-----|------------|
| Player Database | ✓ | ✓ | ✓ | ✓ | ✓ |
| Match Calendar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Basic Reports | 5/month | Unlimited | Unlimited | Unlimited | Unlimited |
| Advanced Search | ✗ | ✓ | ✓ | ✓ | ✓ |
| SmartScout AI | ✗ | ✗ | ✓ | ✓ | ✓ |
| Performance Predictor | ✗ | ✗ | ✓ | ✓ | ✓ |
| Market Value AI | ✗ | ✗ | ✓ | ✓ | ✓ |
| Playstyle DNA | ✗ | ✗ | ✓ | ✓ | ✓ |
| Arkane Match | ✗ | ✗ | ✓ | ✓ | ✓ |
| Voice-to-Report | ✗ | ✗ | ✓ | ✓ | ✓ |
| AI Search | ✗ | ✗ | ✓ | ✓ | ✓ |
| AutoScout | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Price** | **€0** | **€19.99/mo** | **€49.99/mo** | **€99.99/mo** | **Custom** |

---

### B. Campaign Budget

| Item | Cost | Notes |
|------|------|-------|
| SendGrid (10K emails) | €200 | Email delivery service |
| Discount Revenue Loss | €4,500 | 300 conversions × €15 discount |
| Support Overtime | €500 | Extra support hours (20h × €25/h) |
| A/B Testing Tools | €100 | Landing page optimization |
| **Total Campaign Cost** | **€5,300** | |
| **Expected MRR Increase** | **€15,000** | 300 conversions × €50 MRR |
| **ROI (Month 1)** | **183%** | |
| **ROI (Year 1)** | **3,300%** | (€15K × 12) / €5.3K |

---

### C. Key Dates

| Date | Milestone |
|------|-----------|
| Day -2 | Pre-launch checklist complete |
| Day 0 (Monday) | Campaign launch (GOLD+, BASIC) |
| Day 1 (Tuesday) | FREE user campaign starts |
| Day 4 (Thursday) | Resend to non-openers |
| Day 7 (Sunday) | Final urgency email, codes expire |
| Day 8 (Monday) | Post-campaign analysis |
| Day 14 | New user onboarding complete |
| Day 30 | First renewal cycle (monitor retention) |

---

**Document Version:** 1.0
**Last Updated:** 2025-01-07
**Next Review:** Post-campaign (Day 8)

---

**Ready to launch? Use this guide as your playbook for a successful RBAC rollout campaign.**

**Questions? Contact the campaign team on Slack: #rbac-campaign**
