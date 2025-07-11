# Use the official Node.js image as a base
FROM node:22 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set build argument with a default value
ARG BUILD_ENV=prod


# Build the application
RUN npm run build-${BUILD_ENV}


# Use a lightweight server to serve the build files
FROM nginx:alpine

# # Set the base URL as an environment variable
# ENV BASE_URL=http://34.46.127.84

# # Set environment variables using the base URL
# ENV VITE_QUESTIONS_HOST_URL=$BASE_URL/v1.0
# ENV VITE_QUEUES_HOST_URL=$BASE_URL/v1.0
# ENV VITE_USERS_HOST_URL=$BASE_URL/v1.0
# ENV VITE_AUTH_HOST_URL=$BASE_URL/v1.0

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
