FROM node:20

WORKDIR /app

RUN apt-get update && \
    apt-get install -y acl expect sudo libpam0g-dev build-essential python3

# Create a non-root user (for backend)
ARG APP_UID=1001
ARG APP_GID=1001
RUN groupadd -g $APP_GID appgroup && \
    useradd -m -u $APP_UID -g appgroup -s /bin/bash appuser

# Create a sudo-capable user (for root-backend)
ARG SUDO_UID=1002
ARG SUDO_GID=1002
RUN groupadd -g $SUDO_GID sudogroup && \
    useradd -m -u $SUDO_UID -g sudogroup -s /bin/bash sudoer && \
    echo "sudoer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Copy source code
COPY . .

# Copy and install backend dependencies
RUN cd /app/backend && npm install

# Copy and install root-backend dependencies
RUN cd /app/root-backend && npm install

# Make start script executable
RUN chmod +x start.sh

CMD ["./start.sh"]
