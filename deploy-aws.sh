#!/bin/bash

# AWS Deployment Script for AI Companion Backend
# This script sets up the basic infrastructure and deploys your backend

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting AWS Deployment for AI Companion Backend${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first:${NC}"
    echo "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not authenticated. Please run:${NC}"
    echo "aws configure"
    exit 1
fi

# Get current region
CURRENT_REGION=$(aws configure get region)
echo -e "${GREEN}📍 Using AWS Region: ${CURRENT_REGION}${NC}"

# Configuration
PROJECT_NAME="ai-companion"
STACK_NAME="${PROJECT_NAME}-stack"
VPC_CIDR="10.0.0.0/16"
SUBNET_CIDR="10.0.1.0/24"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Project Name: ${PROJECT_NAME}"
echo "  Stack Name: ${STACK_NAME}"
echo "  VPC CIDR: ${VPC_CIDR}"
echo "  Subnet CIDR: ${SUBNET_CIDR}"

# Create VPC and basic infrastructure
echo -e "${GREEN}🏗️  Creating VPC and basic infrastructure...${NC}"

# Create VPC
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block ${VPC_CIDR} \
    --query 'Vpc.VpcId' \
    --output text)

echo "  ✅ VPC created: ${VPC_ID}"

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)

aws ec2 attach-internet-gateway \
    --vpc-id ${VPC_ID} \
    --internet-gateway-id ${IGW_ID}

echo "  ✅ Internet Gateway attached: ${IGW_ID}"

# Create Subnet
SUBNET_ID=$(aws ec2 create-subnet \
    --vpc-id ${VPC_ID} \
    --cidr-block ${SUBNET_CIDR} \
    --availability-zone ${CURRENT_REGION}a \
    --query 'Subnet.SubnetId' \
    --output text)

echo "  ✅ Subnet created: ${SUBNET_ID}"

# Create Route Table
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
    --vpc-id ${VPC_ID} \
    --query 'RouteTable.RouteTableId' \
    --output text)

aws ec2 create-route \
    --route-table-id ${ROUTE_TABLE_ID} \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id ${IGW_ID}

aws ec2 associate-route-table \
    --subnet-id ${SUBNET_ID} \
    --route-table-id ${ROUTE_TABLE_ID}

echo "  ✅ Route table configured: ${ROUTE_TABLE_ID}"

# Create Security Group
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "${PROJECT_NAME}-sg" \
    --description "Security group for ${PROJECT_NAME}" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text)

# Allow HTTP
aws ec2 authorize-security-group-ingress \
    --group-id ${SECURITY_GROUP_ID} \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Allow HTTPS
aws ec2 authorize-security-group-ingress \
    --group-id ${SECURITY_GROUP_ID} \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Allow SSH (restrict to your IP later)
aws ec2 authorize-security-group-ingress \
    --group-id ${SECURITY_GROUP_ID} \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

# Allow backend port
aws ec2 authorize-security-group-ingress \
    --group-id ${SECURITY_GROUP_ID} \
    --protocol tcp \
    --port 8000 \
    --cidr 0.0.0.0/0

echo "  ✅ Security group created: ${SECURITY_GROUP_ID}"

# Create EC2 Instance
echo -e "${GREEN}🖥️  Creating EC2 instance...${NC}"

# Get latest Ubuntu AMI
AMI_ID=$(aws ssm get-parameters \
    --names /aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id \
    --query 'Parameters[0].Value' \
    --output text)

# Create key pair (if it doesn't exist)
KEY_NAME="${PROJECT_NAME}-key"
if ! aws ec2 describe-key-pairs --key-names ${KEY_NAME} &> /dev/null; then
    aws ec2 create-key-pair \
        --key-name ${KEY_NAME} \
        --query 'KeyMaterial' \
        --output text > ${KEY_NAME}.pem
    chmod 400 ${KEY_NAME}.pem
    echo "  ✅ Key pair created: ${KEY_NAME}.pem"
else
    echo "  ℹ️  Key pair already exists: ${KEY_NAME}"
fi

# Launch EC2 instance (using free tier t2.micro)
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ${AMI_ID} \
    --instance-type t2.micro \
    --key-name ${KEY_NAME} \
    --security-group-ids ${SECURITY_GROUP_ID} \
    --subnet-id ${SUBNET_ID} \
    --associate-public-ip-address \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}-backend}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "  ✅ EC2 instance created: ${INSTANCE_ID}"

# Wait for instance to be running
echo -e "${YELLOW}⏳ Waiting for instance to be running...${NC}"
aws ec2 wait instance-running --instance-ids ${INSTANCE_ID}

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids ${INSTANCE_ID} \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "  ✅ Instance is running with IP: ${PUBLIC_IP}"

# Create RDS Subnet Group
echo -e "${GREEN}🗄️  Creating RDS subnet group...${NC}"

aws rds create-db-subnet-group \
    --db-subnet-group-name "${PROJECT_NAME}-subnet-group" \
    --db-subnet-group-description "Subnet group for ${PROJECT_NAME}" \
    --subnet-ids ${SUBNET_ID}

echo "  ✅ RDS subnet group created"

# Create RDS Security Group
RDS_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "${PROJECT_NAME}-rds-sg" \
    --description "Security group for ${PROJECT_NAME} RDS" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text)

# Allow PostgreSQL from EC2
aws ec2 authorize-security-group-ingress \
    --group-id ${RDS_SECURITY_GROUP_ID} \
    --protocol tcp \
    --port 5432 \
    --source-group ${SECURITY_GROUP_ID}

echo "  ✅ RDS security group created: ${RDS_SECURITY_GROUP_ID}"

# Create RDS Instance
echo -e "${GREEN}🗄️  Creating RDS PostgreSQL instance...${NC}"

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

RDS_INSTANCE_ID=$(aws rds create-db-instance \
    --db-instance-identifier "${PROJECT_NAME}-db" \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username postgres \
    --master-user-password "${DB_PASSWORD}" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --vpc-security-group-ids ${RDS_SECURITY_GROUP_ID} \
    --db-subnet-group-name "${PROJECT_NAME}-subnet-group" \
    --backup-retention-period 7 \
    --query 'DBInstance.DBInstanceIdentifier' \
    --output text)

echo "  ✅ RDS instance created: ${RDS_INSTANCE_ID}"

# Wait for RDS to be available
echo -e "${YELLOW}⏳ Waiting for RDS to be available...${NC}"
aws rds wait db-instance-available --db-instance-identifier ${RDS_INSTANCE_ID}

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier ${RDS_INSTANCE_ID} \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "  ✅ RDS endpoint: ${RDS_ENDPOINT}"

# Create ElastiCache Subnet Group
echo -e "${GREEN}🔴 Creating ElastiCache subnet group...${NC}"

aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name "${PROJECT_NAME}-cache-subnet-group" \
    --cache-subnet-group-description "Subnet group for ${PROJECT_NAME} ElastiCache" \
    --subnet-ids ${SUBNET_ID}

echo "  ✅ ElastiCache subnet group created"

# Create ElastiCache Security Group
CACHE_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "${PROJECT_NAME}-cache-sg" \
    --description "Security group for ${PROJECT_NAME} ElastiCache" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text)

# Allow Redis from EC2
aws ec2 authorize-security-group-ingress \
    --group-id ${CACHE_SECURITY_GROUP_ID} \
    --protocol tcp \
    --port 6379 \
    --source-group ${SECURITY_GROUP_ID}

echo "  ✅ ElastiCache security group created: ${CACHE_SECURITY_GROUP_ID}"

# Create ElastiCache Instance
echo -e "${GREEN}🔴 Creating ElastiCache Redis instance...${NC}"

CACHE_INSTANCE_ID=$(aws elasticache create-cache-cluster \
    --cache-cluster-id "${PROJECT_NAME}-cache" \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1 \
    --vpc-security-group-ids ${CACHE_SECURITY_GROUP_ID} \
    --cache-subnet-group-name "${PROJECT_NAME}-cache-subnet-group" \
    --query 'CacheCluster.CacheClusterId' \
    --output text)

echo "  ✅ ElastiCache instance created: ${CACHE_INSTANCE_ID}"

# Wait for ElastiCache to be available
echo -e "${YELLOW}⏳ Waiting for ElastiCache to be available...${NC}"
aws elasticache wait cache-cluster-available --cache-cluster-id ${CACHE_INSTANCE_ID}

# Get ElastiCache endpoint
CACHE_ENDPOINT=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id ${CACHE_INSTANCE_ID} \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text)

echo "  ✅ ElastiCache endpoint: ${CACHE_ENDPOINT}"

# Generate production environment file
echo -e "${GREEN}📝 Generating production environment file...${NC}"

cat > .env.production << EOF
# AI Companion V2 - Production Environment Configuration
# Generated by AWS deployment script

# LLM Configuration
LLM_PROVIDER=openrouter
LLM_DEV_MODE=false
LLM_API_KEY=your-openrouter-api-key-here
LLM_BASE_URL=https://openrouter.ai/api/v1
CLAUDE_API_KEY=your-claude-api-key-here

# Model Configuration
LLM_MODEL_DEFAULT=mistralai/mistral-7b-instruct
LLM_MODEL_FAST=mistralai/mistral-7b-instruct
LLM_MODEL_VISION=mistralai/mistral-7b-instruct
LLM_MODEL_SUMMARY=mistralai/mistral-7b-instruct

# Database Configuration (AWS RDS)
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/ai_companion

# Redis Configuration (AWS ElastiCache)
REDIS_URL=redis://${CACHE_ENDPOINT}:6379

# JWT Settings
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# CORS Origins (Update with your Vercel domain)
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app", "https://your-domain.com"]

# Memory System Configuration
MEMORY_ENABLED=true
MEMORY_PROVIDER=faiss
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
FAISS_DATA_DIR=/app/data/faiss
RETRIEVAL_TOP_K=12
RETRIEVAL_RECENT_MESSAGES=5

# Feature Flags
MEMORY_DECAY_ENABLED=true
PERSONALITY_REFLECTION_ENABLED=true
GOAL_TRACKING_ENABLED=true
AUTO_MEMORY_ENABLED=true
ACTIONS_SUGGESTIONS_ENABLED=true
DIRECT_EXECUTION_ENABLED=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_SEND_PER_WINDOW=100
RATE_LIMIT_REPLY_PER_WINDOW=100

# Production Settings
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
STREAMING_ENABLED=true
WORKERS_PER_CORE=1
MAX_WORKERS=4
LOG_LEVEL=INFO

# AWS Configuration
AWS_REGION=${CURRENT_REGION}
EOF

echo "  ✅ Production environment file created: .env.production"

# Create deployment summary
echo -e "${GREEN}📊 Deployment Summary${NC}"
echo "=================================="
echo "Project: ${PROJECT_NAME}"
echo "Region: ${CURRENT_REGION}"
echo ""
echo -e "${GREEN}🎉 FREE TIER DEPLOYMENT! 🎉${NC}"
echo "All resources are eligible for AWS Free Tier (12 months)"
echo ""
echo "EC2 Instance (FREE for 12 months):"
echo "  ID: ${INSTANCE_ID}"
echo "  Type: t2.micro (1 vCPU, 1GB RAM)"
echo "  IP: ${PUBLIC_IP}"
echo "  SSH: ssh -i ${KEY_NAME}.pem ubuntu@${PUBLIC_IP}"
echo ""
echo "RDS PostgreSQL (FREE for 12 months):"
echo "  ID: ${RDS_INSTANCE_ID}"
echo "  Type: db.t3.micro (1 vCPU, 1GB RAM)"
echo "  Endpoint: ${RDS_ENDPOINT}"
echo "  Username: postgres"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo "ElastiCache Redis (FREE for 12 months):"
echo "  ID: ${CACHE_INSTANCE_ID}"
echo "  Type: cache.t3.micro (1 vCPU, 0.5GB RAM)"
echo "  Endpoint: ${CACHE_ENDPOINT}"
echo ""
echo "Security Groups:"
echo "  EC2: ${SECURITY_GROUP_ID}"
echo "  RDS: ${RDS_SECURITY_GROUP_ID}"
echo "  Cache: ${CACHE_SECURITY_GROUP_ID}"
echo ""
echo -e "${GREEN}💰 Cost Analysis:${NC}"
echo "  Months 1-12: $0/month (FREE TIER!)"
echo "  Months 13+: ~$46/month"
echo "  Your $120 credits will last 15+ months!"
echo ""
echo "Next Steps:"
echo "1. Update .env.production with your LLM API keys"
echo "2. Update BACKEND_CORS_ORIGINS with your Vercel domain"
echo "3. SSH into the EC2 instance and deploy your backend"
echo "4. Test the deployment"
echo ""
echo "Files created:"
echo "  - .env.production (production environment)"
echo "  - ${KEY_NAME}.pem (SSH private key)"

echo -e "${GREEN}🎉 AWS infrastructure deployment complete!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important Security Notes:${NC}"
echo "1. Restrict SSH access to your IP address only"
echo "2. Update the CORS origins with your actual Vercel domain"
echo "3. Keep your .env.production file secure"
echo "4. Consider using AWS Secrets Manager for sensitive data"
echo "5. Set up CloudWatch monitoring and alarms"
