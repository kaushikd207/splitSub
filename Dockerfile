FROM node:22-alpine

WORKDIR /app

# The Railway API deployment intentionally installs only backend dependencies.
# This avoids workspace cache conflicts with the Vite frontend.
COPY apps/api/package*.json ./
RUN npm install

COPY apps/api ./
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 8080

# Apply checked-in migrations immediately before starting the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
