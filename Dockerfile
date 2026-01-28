FROM node:20-alpine

WORKDIR /app

# Install dependencies for systeminformation
RUN apk add --no-cache procps

COPY package*.json ./
RUN npm install --production

COPY backend ./backend
COPY frontend ./frontend

EXPOSE 3000

CMD ["node", "backend/index.js"]
