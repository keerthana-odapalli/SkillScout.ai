SkillScout.ai 🎓
A dual-agent curriculum generator that creates a personalized roadmap and curates verified resources tailored to users' specific goals.

📖 Introduction
This project contains the core logic for SkillScout.ai, a dual-agent system designed to assist users in generating personalized, resource-rich learning curriculums. The system is built using Google Gemini 1.5 Flash and the Google Search Grounding tool, following a modular orchestration architecture that separates structural planning from content curation.

## Run Locally
Prerequisites :
1. Node.js (v18+)
2. A Google Cloud Project with the Gemini API enabled.

Installation :
1. Clone the repository
2. Install dependencies:
   `npm install`
3. Configure Environment: Create a .env file in the root directory and add your API key. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
4. Run the app:
   `npm run dev`
