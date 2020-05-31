FROM node:12-alpine

ENV NODE_ENV=prod HOST=0.0.0.0

COPY ./ /app

RUN cd /app && npm install pm2 -g && yarn && npm run build

EXPOSE 3000
WORKDIR /app/
CMD ["pm2-runtime", "start", "npm", "--name", "howgersay", "--", "start"]