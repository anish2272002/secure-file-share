# Frontend Dockerfile
FROM node:14

# Set the working directory
WORKDIR /app

# Define build-time arguments
ARG REACT_APP_APP_HOST
ARG REACT_APP_APP_PORT

# Set environment variables that React can read during build
ENV REACT_APP_APP_HOST=$REACT_APP_APP_HOST
ENV REACT_APP_APP_PORT=$REACT_APP_APP_PORT

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Install serve to serve the build
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["serve", "-s", "build","-l","3000","--ssl-cert","/app/keys/localhost.crt","--ssl-key","/app/keys/localhost.key"]