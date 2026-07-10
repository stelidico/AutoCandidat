FROM node:18-slim

# Build tools required for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
# Force rebuild from source to match the exact runtime environment
RUN npm rebuild better-sqlite3 --build-from-source
# Chromium + OS deps for Playwright (form-filling fallback for offers without email)
RUN npx playwright install --with-deps chromium

COPY . .

RUN mkdir -p /data /app/uploads /app/logs

EXPOSE 8080

CMD ["node", "index.js"]
