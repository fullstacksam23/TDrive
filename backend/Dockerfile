FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Create dirs for volumes
RUN mkdir -p /app/data /app/uploads

EXPOSE 8080

CMD ["node", "index.js"]
