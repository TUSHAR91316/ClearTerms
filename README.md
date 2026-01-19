# ClearTerms - Privacy Policy Analysis Agent

ClearTerms is a full-stack Generative AI application that helps users understand complex privacy policies and terms of service. 
By pasting a URL, the Pydantic AI agent analyzes the text, assigns a transparency score, identifies red flags, and summarizes user rights.

## Features
-   **AI Agent**: Powered by Pydantic AI to scrape, parse, and analyze legal text.
-   **Glassmorphism UI**: A stunning, modern interface built with Next.js, Tailwind CSS, and Framer Motion.
-   **Structured Analysis**: Returns a clear "Transparency Score", specific risk flags (e.g., Data Selling), and positive user rights.
-   **Live Deployment**: Designed for Vercel (Next.js + Python Serverless).

## Tech Stack
-   **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Lucide React.
-   **Backend**: Python 3.9+, Pydantic AI, FastAPI (Serverless), Trafilatura (Scraping).
-   **AI Model**: OpenRouter (compatible with OpenAI/Gemini/Anthropic).

## Project Structure
```
/
├── api/                # Python Serverless Functions
│   └── index.py        # FastAPI entry point
├── backend/            # Core AI Logic
│   └── agent.py        # Pydantic AI Agent & Models
├── frontend/           # Next.js Application
│   ├── app/            # App Router Pages
│   └── components/     # UI Components
├── requirements.txt    # Python Dependencies
└── vercel.json         # Deployment Config
```

## How It Was Built
1.  **Agent Design**: We used `Pydantic AI` to define strict output models (`PolicyAnalysis`, `RiskFlag`) ensuring the LLM handles unstructured legal text reliably.
2.  **Scraping**: `Trafilatura` is used to extract clean text from URLs.
3.  **Frontend**: Built with a mobile-first, premium aesthetic using "Glassmorphism" principles (blur effects, gradients).
4.  **Integration**: The frontend communicates with the Python backend via `/api/analyze`.

## Deployment Instructions (Vercel)
1.  Push this repository to GitHub.
2.  Import the project into Vercel.
3.  **Environment Variables**: Add `OPENROUTER_API_KEY` in Vercel Project Settings.
4.  The `vercel.json` file handles the build configuration for both Python and Next.js.

## Local Development
1.  Install Python dependencies: `pip install -r requirements.txt`.
2.  Install Frontend dependencies: `cd frontend && npm install`.
3.  Set `OPENROUTER_API_KEY` in a `.env` file.
4.  Run Backend: `uvicorn api.index:app --reload`.
5.  Run Frontend: `cd frontend && npm run dev`.
