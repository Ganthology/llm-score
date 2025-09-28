# LLMScore

Get your website's LLM friendliness score by analyzing its structure and content.

## Features

- **User Authentication**: Secure login system with user-specific data isolation
- **Website Mapping**: Uses Firecrawl to map all URLs on your website
- **LLM Score Evaluation**: AI-powered scoring using OpenAI analysis
- **Search Performance Analysis**: Real search ranking analysis using Firecrawl search API
- **SEO Optimization Analysis**: Identifies HTML pages missing titles or meta descriptions (excludes static assets)
- **AI Optimization Check**: Checks for AI-friendly files (`/agents.txt`, `/agent.txt`, `/llm.txt`, `/llms.txt`)
- **Persistent Storage**: All evaluations saved to Convex database per user
- **Dashboard**: View your analysis history and track improvements
- **Clean UI**: Simple black and white design with monospace font
- **Fast Analysis**: Quickly get all links and structure of your website

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Get API keys**:
   - **Firecrawl**: Sign up at [Firecrawl.dev](https://firecrawl.dev) and get your API key
   - **OpenAI**: Sign up at [OpenAI Platform](https://platform.openai.com/api-keys) and get your API key
   - **Google OAuth**: Create credentials at [Google Cloud Console](https://console.cloud.google.com/)
   - **Convex**: Sign up at [Convex.dev](https://convex.dev) for database persistence

3. **Configure environment**:
   - Copy `.env.local` and add your API keys:
   ```
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   BETTER_AUTH_SECRET=your_secure_random_string_here
   ```

4. **Set up Convex database**:
   ```bash
   npx convex dev
   ```
   Follow the prompts to create/connect to a Convex project, then deploy the schema:
   ```bash
   npx convex deploy
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Usage

1. **Sign In**: Click the "Sign In" button to authenticate
2. **Enter Website**: Enter your website domain (e.g., `example.com` - no need for `https://`)
3. **Analyze**: Click "Analyze Website" to run comprehensive evaluation
4. **View Results**: See your LLM Score with detailed breakdown:
   - Overall score (1-10 scale)
   - Search visibility analysis
   - Content quality assessment
   - Technical SEO evaluation
   - AI optimization status
5. **Check History**: Visit `/dashboard` to view all your past analyses
6. **Track Progress**: Monitor improvements over time with persistent storage

## How it works

The app provides **user-authenticated, comprehensive LLM compatibility analysis**:

### Website Mapping & SEO Analysis
Uses Firecrawl's `/map` endpoint to:
- Crawl your website and find all URLs
- Include sitemap data when available
- Return up to 100 links for analysis
- **Analyze SEO metadata**: Identify HTML pages missing titles or meta descriptions (excludes static assets like .css, .js, images, etc.)

### AI Optimization Files Check
Checks for AI-friendly configuration files:
- `/agents.txt` - Instructions for AI agents
- `/agent.txt` - Alternative agent instructions
- `/llm.txt` - LLM-specific instructions
- `/llms.txt` - Multiple LLM instructions

### LLM Score Evaluation
Uses OpenAI's advanced AI models to evaluate:
- **Search Visibility**: How well the site appears in AI-powered search results
- **Content Quality**: Structure and metadata completeness
- **Technical SEO**: Overall technical foundation
- **AI Optimization**: Presence of AI-friendly configurations

### Search Performance Analysis
Uses Firecrawl's search API to perform real-world search analysis:
- **Content-Based Keywords**: AI analyzes actual website content to generate relevant search terms
- **Website Scraping**: Scrapes the landing page content for accurate keyword generation
- **Search Rankings**: Checks actual search result positions for each keyword
- **Performance Metrics**: Appearance rate, top 10 rankings, average position
- **Detailed Insights**: Shows where the site ranks for specific search queries

The evaluation provides a weighted overall score and actionable recommendations for improving LLM compatibility and search visibility.

### User Data Management
- **Authentication Required**: All analyses require user login
- **Data Isolation**: Each user's evaluations are stored separately
- **Persistent Storage**: Results saved to Convex database for long-term access
- **History Tracking**: View and compare past analyses in the dashboard
- **Secure Access**: User-specific data protection and privacy

## Next Steps

Future enhancements could include:
- LLM scoring algorithm based on content analysis
- SEO optimization suggestions
- Accessibility checks
- Performance metrics