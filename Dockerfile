# Use the official Node.js image as the base image
FROM node:18

# # Set the working directory in the container
WORKDIR /app

# # Copy the application files into the working directory
COPY . /app
# # Install the application dependencies

RUN npm config set registry https://registry.npmmirror.com

RUN npm install cnpm -g

RUN cnpm install

# # Define the entry point for the container
CMD ["node", "./app/app.js"]