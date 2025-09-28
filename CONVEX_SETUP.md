# Convex Database Integration Setup

This guide will help you set up Convex database integration for persistent storage of LLMScore evaluations.

## Prerequisites

- A Convex account (sign up at [convex.dev](https://convex.dev))
- Your LLMScore app running locally

## Step 1: Initialize Convex

1. Make sure you're in the LLMScore project directory
2. Run the Convex initialization command:

```bash
npx convex dev
```

3. Follow the interactive prompts:
   - Choose "Create a new project"
   - Enter a project name (e.g., "llmscore")
   - Select your preferred region
   - Choose "Next.js" as your framework

4. Convex will create your project and provide a deployment URL.

## Step 2: Get Your Convex URL

After initialization, Convex will show you your deployment URL. It will look something like:
```
https://your-project-name.convex.cloud
```

Copy this URL - you'll need it for the next step.

## Step 3: Configure Environment Variables

1. Open your `.env.local` file
2. Replace the placeholder with your actual Convex URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
```

## Step 4: Restore Convex Code

The Convex integration code is commented out by default. To enable it:

1. **Restore Convex files** (if you removed them):
   ```bash
   # If you have the files backed up, restore them
   # Otherwise, recreate the schema and functions as shown below
   ```

2. **Uncomment Convex imports** in these files:
   - `app/layout.tsx`
   - `app/dashboard/page.tsx`
   - `app/api/map/route.ts`
   - `app/api/check-files/route.ts`
   - `app/api/evaluate/route.ts`

3. **Uncomment Convex functionality** in the API routes

## Step 5: Push Schema to Convex

Once your code is uncommented, push the schema to Convex:

```bash
npx convex deploy
```

This will create the database tables and functions in your Convex deployment.

## Step 6: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000` and analyze a website
3. Check the dashboard at `http://localhost:3000/dashboard` - you should now see stored evaluations

## Database Schema

The integration creates three main tables:

### `evaluations`
- Stores complete evaluation results
- Includes overall scores, category scores, and recommendations
- Indexed by URL and domain

### `website_maps`
- Stores website structure data from Firecrawl
- Includes links, total counts, and metadata
- Indexed by URL and domain

### `ai_files`
- Stores AI optimization file checks
- Includes file existence and content
- Indexed by URL and domain

## Available Queries

### Evaluations
- `getEvaluation(url)` - Get evaluation by URL
- `getEvaluationsByDomain(domain)` - Get all evaluations for a domain
- `getRecentEvaluations(limit?)` - Get recent evaluations
- `getEvaluationsByScore(minScore?, maxScore?, limit?)` - Filter by score range

### Website Maps
- `getWebsiteMap(url)` - Get website map by URL
- `getWebsiteMapsByDomain(domain)` - Get maps for a domain

### AI Files
- `getAIFiles(url)` - Get AI files check by URL
- `getAIFilesByDomain(domain)` - Get AI files for a domain

## Troubleshooting

### Build Errors
If you get TypeScript errors, make sure all Convex imports are properly uncommented.

### Database Connection Issues
- Check that your `NEXT_PUBLIC_CONVEX_URL` is correct
- Verify your Convex project is deployed with `npx convex deploy`

### Data Not Appearing
- Check the Convex dashboard at [dashboard.convex.dev](https://dashboard.convex.dev)
- Look at the function logs for any errors
- Ensure all API routes are saving data correctly

## Next Steps

Once Convex is set up, you can:
- View historical evaluations in the dashboard
- Compare scores across different websites
- Track improvements over time
- Build analytics and reporting features

The dashboard will automatically display all stored evaluations with filtering and search capabilities.