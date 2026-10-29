# Stage 1: Build the Vite React App
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Copy the rest of the app files
COPY . .

# Build the project
RUN npm run build

# Stage 2: Setup Apache and Serve the App
FROM httpd:2.4 AS production

# Set environment variables for Apache
ENV APACHE_DOCUMENT_ROOT /usr/local/apache2/htdocs

# Remove default Apache content and copy built files
RUN rm -rf /usr/local/apache2/htdocs/*
COPY --from=build /app/dist /usr/local/apache2/htdocs

# Security headers + no directory listing (VAPT V010-V014, INF002).
# API_ORIGIN is used in the Content-Security-Policy; override with docker run -e API_ORIGIN=...
ENV API_ORIGIN=http://34.47.174.27:8000
COPY apache/bluelive.conf /usr/local/apache2/conf/extra/bluelive.conf
RUN echo "Include conf/extra/bluelive.conf" >> /usr/local/apache2/conf/httpd.conf

# Expose port 80 for the Apache server
EXPOSE 80

# Start Apache in the foreground
CMD ["httpd", "-D", "FOREGROUND"]
