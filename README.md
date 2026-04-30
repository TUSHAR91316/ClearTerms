# 🛡️ ClearTerms - AI Privacy Policy Analyzer

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-blue?style=for-the-badge&logo=vercel)](https://clear-terms.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Powered By](https://img.shields.io/badge/Powered_By-Hugging_Face-e94e77?style=for-the-badge)](https://huggingface.co/)

**ClearTerms** is an advanced, full-stack AI application designed to empower users by analyzing and demystifying complex legal agreements. Leveraging multi-model AI agents (Llama, Qwen, Mixtral via Hugging Face), ClearTerms instantly scans Privacy Policies and Terms of Service, extracting critical insights, highlighting potential risks, and providing a clear summary of user rights.

---

## 🚀 Overview

In today's digital landscape, users often agree to Terms of Service and Privacy Policies without fully understanding the implications. ClearTerms addresses this issue by providing a powerful, intuitive tool that translates dense legal jargon into plain English. 

*   **Deep Contextual Analysis**: Unlike simple keyword search tools, our AI engine understands the nuanced context of legal language, accurately distinguishing between complex clauses (e.g., data sharing for essential services vs. data selling).
*   **Resilient AI Infrastructure**: Built with a robust fallback mechanism, ClearTerms dynamically routes requests across multiple state-of-the-art LLMs (Llama 3.3 → Qwen 2.5 → Mixtral) to ensure high availability and consistent performance.
*   **Modern, Responsive UI**: The application features a sleek, mobile-optimized Glassmorphism interface, providing a premium user experience that makes reviewing legal documents engaging and straightforward.
*   **Privacy-Centric Architecture**: ClearTerms analyzes external policies without storing or tracking your personal data, ensuring your privacy remains protected.

---

## ✨ Core Features

-   **Intelligent Risk Detection**: Automatically identifies and categorizes potential red flags such as unauthorized data selling, aggressive tracking mechanisms, and unfavorable IP ownership clauses.
-   **Transparency Scoring System**: Evaluates and assigns a comprehensive 0-100 Transparency Score to each analyzed policy based on its clarity and user-friendliness.
-   **Automated Multi-Model Fallback**: Ensures uninterrupted service by automatically rotating between top-tier open-source models if a primary model becomes unavailable.
-   **Advanced Web Scraping**: Utilizes a robust hybrid scraping approach (incorporating tools like Jina Reader and fallback strategies) to successfully extract text from complex or dynamically rendered websites.
-   **High-Performance Architecture**: 
    -   Frontend: Next.js App Router for optimized server-side rendering and fast client-side navigation.
    -   Backend: FastAPI for high-concurrency request handling, offloading blocking operations to background threads.

## 🛠️ Technology Stack

-   **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion, Lucide React.
-   **Backend**: Python 3.9+, FastAPI, Hugging Face Hub API.
-   **AI Integration**: Hugging Face Serverless Inference API (integrating Llama, Qwen, and Mixtral models).
-   **Deployment**: Vercel (Hosting both the Next.js frontend and FastAPI serverless functions).

## 📂 Repository Structure

```bash
/
├── api/                # FastAPI application entry points (Serverless Functions)
├── backend/            # Core AI logic, prompt engineering, and agent configurations
│   └── agent.py        # Multi-model AI agent implementation
├── frontend/           # Next.js web application
│   ├── app/            # Next.js App Router pages and layouts
│   └── components/     # Reusable React UI components
├── requirements.txt    # Python backend dependencies
└── vercel.json         # Vercel deployment configuration
```

## ⚡ Getting Started (Local Development)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/yourusername/clearterms.git
    cd clearterms
    ```

2.  **Set Up the Backend (Python)**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set Up the Frontend (Node.js)**:
    ```bash
    cd frontend
    npm install
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the root directory and add your Hugging Face Access Token:
    ```env
    HF_TOKEN=your_hugging_face_token_here
    ```

5.  **Run the Application Locally**:
    *   Start the FastAPI backend: `uvicorn api.index:app --reload`
    *   Start the Next.js frontend (in the `frontend` directory): `npm run dev`

## ☁️ Deployment

ClearTerms is optimized for seamless deployment on [Vercel](https://vercel.com).

1.  Push your code to a GitHub repository.
2.  Import the repository into your Vercel dashboard.
3.  Navigate to **Settings > Environment Variables** in Vercel.
4.  Add the `HF_TOKEN` key with your corresponding Hugging Face Access Token.
5.  Deploy the project. (If updating an existing deployment, trigger a redeploy to apply the new environment variables).
