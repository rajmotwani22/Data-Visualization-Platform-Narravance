#!/bin/bash

# Redis Setup Script for Data Visualization Platform
# This script automates the installation and configuration of Redis

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Redis Setup Script for Data Visualization Platform ===${NC}"
echo "This script will install and configure Redis for your application."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Please run as root (use sudo).${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo -e "${RED}Unsupported operating system. Please install Redis manually.${NC}"
    exit 1
fi

# Install Redis based on OS
install_redis() {
    echo -e "${GREEN}Installing Redis...${NC}"
    
    case $OS in
        "Ubuntu" | "Debian GNU/Linux")
            apt-get update
            apt-get install -y redis-server
            ;;
        "CentOS Linux" | "Red Hat Enterprise Linux")
            yum install -y epel-release
            yum install -y redis
            ;;
        "Fedora")
            dnf install -y redis
            ;;
        "Amazon Linux")
            amazon-linux-extras install -y redis4.0
            ;;
        *)
            echo -e "${RED}Unsupported OS: $OS. Please install Redis manually.${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}Redis installation completed.${NC}"
}

# Configure Redis
configure_redis() {
    echo -e "${GREEN}Configuring Redis...${NC}"
    
    # Backup the original config
    cp /etc/redis/redis.conf /etc/redis/redis.conf.bak
    
    # Configure Redis to listen on all interfaces (only for development)
    sed -i 's/bind 127.0.0.1/bind 0.0.0.0/g' /etc/redis/redis.conf
    
    # Set password (optional)
    echo -n "Do you want to set a Redis password? (y/n): "
    read set_password
    
    if [ "$set_password" = "y" ] || [ "$set_password" = "Y" ]; then
        echo -n "Enter password: "
        read -s redis_password
        echo ""
        
        # Update redis.conf
        if grep -q "^requirepass" /etc/redis/redis.conf; then
            sed -i "s/^requirepass.*/requirepass $redis_password/g" /etc/redis/redis.conf
        else
            echo "requirepass $redis_password" >> /etc/redis/redis.conf
        fi
        
        echo "Redis password has been set."
        echo "IMPORTANT: Update your application's REDIS_URL environment variable to include the password."
        echo "Example: redis://:<password>@localhost:6379/0"
    fi
    
    # Increase memory limit
    echo -n "Redis memory limit in MB (default: 256): "
    read memory_limit
    
    if [ -z "$memory_limit" ]; then
        memory_limit=256
    fi
    
    if grep -q "^maxmemory" /etc/redis/redis.conf; then
        sed -i "s/^maxmemory.*/maxmemory ${memory_limit}mb/g" /etc/redis/redis.conf
    else
        echo "maxmemory ${memory_limit}mb" >> /etc/redis/redis.conf
    fi
    
    # Set memory policy
    if grep -q "^maxmemory-policy" /etc/redis/redis.conf; then
        sed -i "s/^maxmemory-policy.*/maxmemory-policy allkeys-lru/g" /etc/redis/redis.conf
    else
        echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
    fi
    
    echo -e "${GREEN}Redis configuration completed.${NC}"
}

# Start and enable Redis
start_redis() {
    echo -e "${GREEN}Starting Redis service...${NC}"
    
    systemctl start redis
    systemctl enable redis
    
    # Check if Redis is running
    if systemctl is-active --quiet redis; then
        echo -e "${GREEN}Redis service is running.${NC}"
    else
        echo -e "${RED}Failed to start Redis service. Please check the logs.${NC}"
        exit 1
    fi
}

# Main flow
if command -v redis-server >/dev/null 2>&1; then
    echo -e "${YELLOW}Redis is already installed.${NC}"
    echo -n "Do you want to reconfigure it? (y/n): "
    read reconfigure
    
    if [ "$reconfigure" = "y" ] || [ "$reconfigure" = "Y" ]; then
        configure_redis
        systemctl restart redis
        echo -e "${GREEN}Redis has been reconfigured and restarted.${NC}"
    fi
else
    install_redis
    configure_redis
    start_redis
fi

# Set up environment variables
echo -e "${GREEN}Setting up environment variables...${NC}"
echo "REDIS_ENABLED=true" > .env
echo "REDIS_URL=redis://localhost:6379/0" >> .env

if [ "$set_password" = "y" ] || [ "$set_password" = "Y" ]; then
    sed -i "s|REDIS_URL=.*|REDIS_URL=redis://:$redis_password@localhost:6379/0|g" .env
fi

echo -e "${GREEN}Environment variables have been set up in .env file.${NC}"
echo -e "${GREEN}Redis setup completed successfully!${NC}"