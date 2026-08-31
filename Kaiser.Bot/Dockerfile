FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
ENV BOT_TOKEN=8992025570:AAHsMAOG5_UbZXMW_CrkmufBq-4IW4I31zI
ENV API_ID=36814355
ENV API_HASH=1138b0ad3caf2d93a315cf9be02293b0
ENV WEBHOOK_URL=https://botrohamapi.goodino24.ir
EXPOSE 3000
CMD ["npm", "start"]
