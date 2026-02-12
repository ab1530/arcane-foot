# RBAC Rollout Email Campaign Templates

## Overview

Professional email templates for communicating RBAC changes to users and driving tier upgrades.

**Campaign Goal:** Convert FREE users to GOLD, upsell BASIC to GOLD, retain premium members

---

## Files in This Folder

### Email Templates (HTML + Plain Text)

1. **FREE Users - Conversion Campaign**
   - `email-free-users-upgrade.html` - Responsive HTML email with inline CSS
   - `email-free-users-upgrade.txt` - Plain text fallback
   - **Objective:** Convert to GOLD with 30% discount offer
   - **Promo Code:** GOLDUPGRADE30 (€49.99 → €34.99)

2. **BASIC Users - Upsell Campaign**
   - `email-basic-users-upsell.html` - Responsive HTML email
   - `email-basic-users-upsell.txt` - Plain text fallback
   - **Objective:** Upsell to GOLD with loyalty pricing
   - **Offer:** First month at BASIC price (€19.99)

3. **GOLD+ Users - Retention Campaign**
   - `email-gold-users-retention.html` - Responsive HTML email
   - `email-gold-users-retention.txt` - Plain text fallback
   - **Objective:** Reassure and retain premium members
   - **Message:** Security improvements, no action needed

### Campaign Guide

- `EMAIL_CAMPAIGN_GUIDE.md` - **Complete campaign playbook** including:
  - User segmentation SQL queries
  - Send schedule (7-day campaign)
  - Expected conversion rates (10-15% FREE→GOLD, 18-25% BASIC→GOLD)
  - A/B test strategies
  - Success metrics and KPIs
  - Support preparation and FAQs
  - Contingency plans
  - Post-campaign analysis checklist

---

## Quick Start

### 1. User Segmentation

Run the SQL queries in `EMAIL_CAMPAIGN_GUIDE.md` (section: User Segmentation) to export:
- FREE tier users
- BASIC tier users
- GOLD+ tier users

### 2. Set Up Discount Codes

Create Stripe coupons:
```bash
# 30% OFF for FREE users
Coupon ID: GOLDUPGRADE30
Discount: 30% off
Duration: once
Expires: 7 days from launch

# Loyalty pricing for BASIC users
Special Price: €19.99 (first month)
Then: €49.99/month
```

### 3. Load Templates to Email Service

**SendGrid / Mailgun / AWS SES:**
1. Upload HTML templates
2. Test personalization variables
3. Configure A/B test variants (subject lines)

### 4. Launch Schedule (Week 1)

| Day | Segment | Email | Send Time |
|-----|---------|-------|-----------|
| Day 1 Monday | GOLD+ | Retention | 10:00 AM CET |
| Day 1 Monday | BASIC | Upsell | 2:00 PM CET |
| Day 2 Tuesday | FREE | Conversion | 10:00 AM CET |
| Day 4 Thursday | FREE (no open) | Resend | 3:00 PM CET |
| Day 7 Sunday | FREE (no conversion) | Final Urgency | 5:00 PM CET |

---

## Email Design Features

### Arcane Brand Compliance

All emails follow the Arcane brand guidelines:
- **Colors:** Dark theme (#080C1D, #0F1425) with accent (#E4FF3B)
- **Typography:** Professional, clean hierarchy
- **Tone:** Professional but not corporate
- **Mobile Responsive:** Optimized for all devices

### Key Elements

- Clear value proposition
- Single prominent CTA button
- Social proof (testimonials)
- Feature comparison tables (BASIC vs GOLD)
- ROI case studies
- Unsubscribe link + footer
- Social media links

---

## Expected Results

### Conversion Rates (Conservative)

| Segment | Open Rate | CTR | Conversion | Revenue Impact |
|---------|-----------|-----|------------|----------------|
| FREE → GOLD | 28% | 12% | 10-15% | €68K/year per 1K users |
| BASIC → GOLD | 45% | 22% | 18-25% | €116K/year per 1K users |
| GOLD+ Retention | 52% | 8% | N/A | 95%+ retention |

### Total Campaign Impact

**Per 10,000 Users:**
- Year 1 ARR Increase: €150,000 - €250,000
- Campaign Cost: ~€5,300
- ROI: 3,300%+

---

## Subject Line Variants (A/B Testing)

### Email 1: FREE Users

Test these 3 variants (33% each):
- **Variant A:** "Unlock Advanced AI Scouting - Special 30% Discount Inside"
- **Variant B:** "Your Premium Features Await - Limited Time Offer"
- **Variant C:** "Upgrade to GOLD and Save 30% This Week"

**Winner:** Use for Day 4 resend

### Email 2: BASIC Users

Test these 2 variants (50% each):
- **Variant A:** "Unlock AI Features - Exclusive Loyalty Offer"
- **Variant B:** "You're Ready for GOLD - Special Pricing Inside"

### Email 3: GOLD+ Users

Single variant (retention focus):
- "Enhanced Security for Your Premium Features"

---

## Personalization Variables

### All Emails
- `{{user.name}}` - User's name
- `{{user.email}}` - User's email
- `{{user.tier}}` - Current subscription tier
- `{{user.createdAt}}` - Signup date

### FREE Users Email
- `{{user.reportCount}}` - Number of reports created
- `{{campaign.discountCode}}` - GOLDUPGRADE30
- `{{campaign.endDate}}` - Offer expiration date

### BASIC Users Email
- `{{user.subscriptionEnd}}` - Current subscription expiry
- `{{user.monthlyPrice}}` - Current monthly price (€19.99)

### GOLD+ Users Email
- `{{user.aiUsageCount}}` - Number of AI features used
- `{{user.memberSince}}` - Membership start date

---

## Support Preparation

### Expected Support Volume

**115-205 tickets over 7 days**

Common questions:
1. "Why am I losing features?" - FREE users
2. "Discount code not working" - All segments
3. "What tier do I need?" - Feature clarification
4. "Cancel my subscription" - Small churn

### Pre-Written Responses

See `EMAIL_CAMPAIGN_GUIDE.md` (section: Customer Support Preparation) for:
- FAQ responses
- Troubleshooting steps
- Escalation paths

---

## Monitoring & Analytics

### Track These Metrics

**Primary:**
- Email open rate (target: 30-50% depending on segment)
- Click-through rate (target: 10-25%)
- Conversion rate (target: 10-25% depending on segment)
- Revenue impact (MRR increase)

**Secondary:**
- Discount code usage
- Time to conversion
- Unsubscribe rate (< 0.5%)
- Support ticket volume

### Tools

- Email analytics: SendGrid Dashboard
- Conversion tracking: Stripe webhooks
- Landing page analytics: Google Analytics
- Support metrics: Help desk system

---

## Contingency Plans

### If Churn > 5% (GOLD+ users)
1. Pause FREE/BASIC campaigns immediately
2. Send apology email to premium users
3. Review RBAC implementation for bugs
4. Offer compensation (free month extension)

### If Conversion < 5% (FREE users)
1. Increase discount to 40% OFF
2. Extend deadline to 14 days
3. Add bonus (free onboarding call)
4. Adjust messaging focus

### If Support Overwhelmed (>300 tickets)
1. Activate auto-responder with FAQs
2. Adjust SLA to 8 hours
3. Bring in backup support team
4. Pause outbound emails

---

## Legal & Compliance

### GDPR Checklist
- [x] Unsubscribe link in all emails
- [x] Privacy policy link in footer
- [x] User consent verified (emailVerified = true)
- [x] No emails to deleted accounts
- [x] Right to data portability

### Discount Terms
- Applies to first month only
- Auto-renews at regular price
- One use per customer
- Cannot be combined with other offers
- 7-day expiration
- Cancel anytime, no refunds

---

## Testing Checklist

### Before Launch
- [ ] Test all HTML templates in multiple email clients
- [ ] Verify mobile responsiveness
- [ ] Test discount codes in Stripe
- [ ] Verify personalization variables populate correctly
- [ ] Check all links (no broken links)
- [ ] Test unsubscribe functionality
- [ ] Verify UTM tracking parameters
- [ ] Send test emails to internal team

### Launch Day
- [ ] Monitor first 100 opens for errors
- [ ] Check support ticket volume (first 2 hours)
- [ ] Verify conversions tracking correctly
- [ ] Monitor Stripe webhook alerts
- [ ] Check for bounce/spam complaints

---

## Post-Campaign Analysis

### Day 8 Checklist
- [ ] Pull conversion report (all upgrades)
- [ ] Calculate MRR increase
- [ ] Analyze A/B test winners
- [ ] Review support ticket themes
- [ ] Monitor GOLD+ retention
- [ ] Calculate ROI (revenue vs cost)
- [ ] Document learnings for next campaign

### Report Template

See `EMAIL_CAMPAIGN_GUIDE.md` (section: Post-Campaign Analysis) for full report template.

---

## Next Steps: New User Onboarding

After users upgrade, send a 5-email onboarding sequence:

1. **Welcome to GOLD** (Immediate) - Quick start guide
2. **SmartScout Tutorial** (Day 2) - Feature deep dive
3. **Performance Predictor** (Day 4) - Case study
4. **Advanced Tips** (Day 7) - Power user tips
5. **Feedback Request** (Day 14) - Survey + testimonial

---

## File Structure

```
/email-templates/
├── README.md (this file)
├── EMAIL_CAMPAIGN_GUIDE.md (complete playbook)
├── email-free-users-upgrade.html
├── email-free-users-upgrade.txt
├── email-basic-users-upsell.html
├── email-basic-users-upsell.txt
├── email-gold-users-retention.html
└── email-gold-users-retention.txt
```

---

## Contact & Support

**Campaign Manager:** marketing@arcane-football.com
**Technical Support:** premium-support@arcane-football.com
**Slack Channel:** #rbac-campaign

---

## Quick Reference: Campaign Timeline

```
Day -2: Complete pre-launch checklist
Day 0 (Mon): Launch - Send to GOLD+ and BASIC users
Day 1 (Tue): Send to FREE users (all variants)
Day 4 (Thu): Resend to non-openers (winning variant)
Day 7 (Sun): Final urgency email, codes expire at midnight
Day 8 (Mon): Pull analytics and analyze results
Day 14: Complete onboarding for new users
Day 30: Monitor first renewal cycle
```

---

**Ready to launch? Start with `EMAIL_CAMPAIGN_GUIDE.md` for the complete playbook.**

**Good luck with the campaign!**
