FROM node:carbon

# App home directory
WORKDIR /opt/express-app

# Copy package.json and package-lock.json
COPY package*.json ./

#RUN npm install
# If you are building your code for production
#RUN npm install --only=production
RUN npm install

# Bundle app source
COPY dist/ ./

# Environment Variables
ENV REDIS_HOST='localhost'
ENV REDIS_PORT=6379
ENV SECRET='secret'
ENV NODE_ENV='production'
ENV STATIC_PATH='./public'
ENV SOME_ENDPOINT='http://localhost:1010/v1'
ENV CONTEXT_PATH=/app

EXPOSE 3000

CMD [ "npm", "start" ]