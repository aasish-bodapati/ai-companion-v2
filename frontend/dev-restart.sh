#!/bin/bash

# Development restart script for better hot reloading
echo "🔄 Restarting development server with optimizations..."

# Clear Next.js cache
rm -rf .next

# Clear node_modules cache (optional, only if needed)
# rm -rf node_modules/.cache

# Start development server with turbo mode
npm run dev
