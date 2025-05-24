FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y acl expect libpam0g-dev build-essential python3

COPY . .
RUN npm install

CMD ["npm", "start"]