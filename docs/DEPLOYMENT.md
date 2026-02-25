# Deployment Guide

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

## Production Build

1. Build the project:
   ```bash
   npm run build
   ```

2. The build output will be in the `dist/` folder.

## Deployment Options

### Static Hosting (Vercel, Netlify, etc.)
1. Run `npm run build`
2. Deploy the `dist/` folder to your hosting provider

### GitHub Pages
1. Build the project
2. Push the `dist/` folder to the `gh-pages` branch

## Environment Variables

Create a `.env.local` file for environment-specific variables.
