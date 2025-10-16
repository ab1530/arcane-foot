# 🚀 GitHub Repository Setup Guide

This guide will help you create the GitHub repository and push your Arcane project.

## Step 1: Configure Git User (if needed)

```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Fix the current commit author (optional)
git commit --amend --reset-author --no-edit
```

## Step 2: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Login
gh auth login

# Create repository
gh repo create arcane-platform --public --source=. --remote=origin --description="⚽ Football Agency Management Platform - NestJS + Flutter + PostgreSQL"

# Push code
git push -u origin main
```

### Option B: Using GitHub Web UI

1. Go to https://github.com/new
2. Fill in the details:
   - **Repository name:** `arcane-platform`
   - **Description:** `⚽ Football Agency Management Platform - NestJS + Flutter + PostgreSQL`
   - **Visibility:** Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have them)

3. Click "Create repository"

4. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/arcane-platform.git
git branch -M main
git push -u origin main
```

## Step 3: Configure Repository Settings

### A. Branch Protection (Recommended for teams)

Go to `Settings > Branches > Add branch protection rule`:

- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
  - Select: `Lint & Test Backend`, `Analyze & Test Flutter`
- ✅ Require branches to be up to date before merging

### B. GitHub Actions Secrets

Go to `Settings > Secrets and variables > Actions > New repository secret`:

Add these secrets for deployment:

```
# Railway (if using)
RAILWAY_TOKEN=your_railway_token
RAILWAY_PROJECT_ID=your_project_id

# Render (alternative)
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=your_service_id

# Vercel (for Flutter Web)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Mobile App Stores
APP_STORE_CONNECT_API_KEY=your_app_store_key
GOOGLE_PLAY_SERVICE_ACCOUNT=your_service_account_json

# Notifications (optional)
SLACK_WEBHOOK=your_slack_webhook_url
```

### C. GitHub Pages (Optional - for docs)

Go to `Settings > Pages`:
- Source: Deploy from a branch
- Branch: `main` / `docs` (if you create a docs folder)

## Step 4: Create Development Branch

```bash
# Create and push develop branch
git checkout -b develop
git push -u origin develop

# Set develop as default branch in GitHub:
# Settings > Branches > Default branch > Switch to 'develop'
```

## Step 5: Add Repository Topics

Go to repository main page, click the gear icon next to "About":

Add topics:
```
football, soccer, sports, agency, scouting, nestjs, flutter,
postgresql, prisma, typescript, dart, mobile-app, web-app,
stripe, firebase, docker, github-actions
```

## Step 6: Enable GitHub Features

### A. Issues
- Go to `Settings > Features`
- ✅ Issues
- Create issue templates:

```bash
mkdir -p .github/ISSUE_TEMPLATE
```

Create bug report template:
`.github/ISSUE_TEMPLATE/bug_report.md`

Create feature request template:
`.github/ISSUE_TEMPLATE/feature_request.md`

### B. Projects (Optional)
- Go to `Projects` tab
- Create project: "Arcane Development Roadmap"
- Use the "Board" template

### C. Wiki (Optional)
- Enable Wiki in Settings
- Add documentation pages

## Step 7: Add Badges to README

Update README.md badges with your actual repository URL:

```markdown
[![Backend CI](https://github.com/YOUR_USERNAME/arcane-platform/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/arcane-platform/actions/workflows/backend-ci.yml)
[![Mobile CI](https://github.com/YOUR_USERNAME/arcane-platform/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/arcane-platform/actions/workflows/mobile-ci.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/arcane-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/arcane-platform)
```

## Step 8: Set Up Codecov (Optional)

1. Go to https://codecov.io/
2. Sign in with GitHub
3. Enable Codecov for `arcane-platform`
4. Add `CODECOV_TOKEN` to GitHub Secrets

## Step 9: Invite Collaborators

Go to `Settings > Collaborators and teams`:
- Add team members
- Set appropriate permissions

## Step 10: Create Initial Release

```bash
# Create a tag
git tag -a v0.1.0 -m "Initial project setup"
git push origin v0.1.0

# Or use GitHub CLI
gh release create v0.1.0 --title "v0.1.0 - Initial Setup" --notes "Project initialization with CI/CD pipelines"
```

## Verification Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed to `main` branch
- [ ] `develop` branch created and set as default
- [ ] Branch protection enabled
- [ ] GitHub Actions workflows running
- [ ] Secrets configured for deployment
- [ ] Repository topics added
- [ ] Badges updated in README
- [ ] Issue templates created
- [ ] Collaborators invited (if applicable)

## Next Steps

After completing this setup:

1. **Initialize Backend:** Follow instructions in README to set up NestJS backend
2. **Initialize Mobile:** Set up Flutter project
3. **Deploy Infrastructure:** Set up Supabase, Railway/Render
4. **Configure Stripe:** Set up payment processing
5. **Set up Firebase:** Configure FCM for push notifications

---

## Quick Reference Commands

```bash
# Check remote
git remote -v

# View branches
git branch -a

# Check GitHub CLI status
gh auth status

# View GitHub Actions runs
gh run list

# Create pull request
gh pr create --base main --head develop --title "Feature: XYZ"
```

---

**Need help?** Check GitHub Docs: https://docs.github.com/
