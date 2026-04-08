# RAG Frontend

React web interface for the RAG Research API.

## Run locally

```bash
npm install
npm start
```

Opens at http://localhost:3000

## Connect to your backend

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:8000        # local
REACT_APP_API_URL=https://your-app.onrender.com  # after deployment
```

## Deploy to Netlify (free)

1. Push this folder to GitHub
2. Go to netlify.com → "Add new site" → "Import from Git"
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Add environment variable: `REACT_APP_API_URL=https://your-render-url.onrender.com`
6. Deploy

## Features
- **Query tab** — ask questions with chat history, see cited sources
- **Ingest tab** — paste URLs to scrape and embed
- **Settings tab** — tune top-k and similarity threshold, clear database
