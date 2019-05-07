FROM node:11-stretch

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY follower.js .

CMD ["npm", "start"]
