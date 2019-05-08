FROM node:12-stretch

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY follower.js .

CMD ["npm", "start"]
