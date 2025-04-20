# Use Node base image and install Python
FROM node:20-bullseye

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Set working directory
WORKDIR /app

# Copy package files and install node dependencies
COPY package.json yarn.lock* ./
RUN yarn install

# Copy python requirements and install
# Copy python requirements and create virtual environment
COPY requirements.txt ./
RUN python3 -m venv .venv && \
  . .venv/bin/activate && \
  pip install --no-cache-dir -r requirements.txt


# Copy the rest of the code
COPY . .
RUN yarn nuxi build

# Expose ports (adjust as needed)
EXPOSE 3000 5000

# Default command
CMD ["yarn", "serve"]
