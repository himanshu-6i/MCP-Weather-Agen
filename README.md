# MCP Weather Agent - Vercel Deployment Guide

This project is a React SPA built with Vite and Tailwind CSS. It uses the Gemini API to provide real-time weather information.

## Deployment Steps

1.  **Push to GitHub**: Push your code to a GitHub repository.
2.  **Connect to Vercel**:
    -   Go to [vercel.com](https://vercel.com) and sign in.
    -   Click **Add New** > **Project**.
    -   Import your GitHub repository.
3.  **Configure Environment Variables**:
    -   In the **Environment Variables** section, add:
        -   `GEMINI_API_KEY`: Your Google AI Studio API Key.
4.  **Deploy**: Click **Deploy**.

## Project Configuration

-   **Framework Preset**: Vite (Automatically detected)
-   **Build Command**: `npm run build`
-   **Output Directory**: `dist`
-   **Routing**: Handled by `vercel.json` to support SPA routing (redirecting all requests to `index.html`).

## Security Note

The Gemini API is called directly from the frontend as per the project requirements. Ensure your API key is restricted to your domain in the Google AI Studio console if possible.
