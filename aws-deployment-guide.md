# AWS Deployment Guide for AI Companion Backend

## Quick Start (Recommended for $120 Credits)

### Phase 1: Basic Infrastructure (Week 1) - FREE TIER!
1. **EC2 Instance Setup**
   - Instance Type: `t2.micro` (1 vCPU, 1GB RAM) - **FREE for 12 months!**
   - OS: Ubuntu 22.04 LTS
   - Storage: 20GB GP3 (free tier eligible)
   - Estimated Cost: $0/month (months 1-12), $8/month (after)

2. **RDS PostgreSQL**
   - Instance: `db.t3.micro` (1 vCPU, 1GB RAM) - **FREE for 12 months!**
   - Storage: 20GB GP3
   - Multi-AZ: Disabled (cost savings)
   - Estimated Cost: $0/month (months 1-12), $20/month (after)

3. **ElastiCache Redis**
   - Instance: `cache.t3.micro` (1 vCPU, 0.5GB RAM) - **FREE for 12 months!**
   - Estimated Cost: $0/month (months 1-12), $18/month (after)

### Phase 2: Production Ready (Week 2)
1. **Load Balancer**: Application Load Balancer
2. **Auto Scaling**: Scale between 1-3 instances
3. **Monitoring**: CloudWatch + CloudWatch Logs
4. **Backup**: Automated RDS snapshots

## Deployment Commands

### 1. Launch EC2 Instance (FREE TIER!)
```bash
# Using AWS CLI - t2.micro is FREE for 12 months!
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ai-companion-backend}]'
```

### 2. Security Group Configuration
```bash
# Backend Security Group
aws ec2 create-security-group \
  --group-name ai-companion-backend \
  --description "Security group for AI Companion backend"

# Allow HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
  --group-name ai-companion-backend \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name ai-companion-backend \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow SSH (restrict to your IP)
aws ec2 authorize-security-group-ingress \
  --group-name ai-companion-backend \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP_ADDRESS/32
```

### 3. RDS Database Setup
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier ai-companion-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name your-subnet-group
```

## Environment Configuration

### Production .env
```bash
# Database (RDS)
DATABASE_URL=postgresql://postgres:postgres@your-rds-endpoint:5432/ai_companion

# Redis (ElastiCache)
REDIS_URL=redis://your-elasticache-endpoint:6379

# CORS (Update with your Vercel domain)
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app", "https://your-domain.com"]

# Memory System (Enable for production)
MEMORY_ENABLED=true
MEMORY_PROVIDER=faiss
FAISS_DATA_DIR=/app/data/faiss

# Rate Limiting (Enable with Redis)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_SEND_PER_WINDOW=100
RATE_LIMIT_REPLY_PER_WINDOW=100
```

## Cost Optimization Tips

### 1. Instance Scheduling
- Use AWS Instance Scheduler to stop non-production instances during off-hours
- Estimated savings: 40-60% of compute costs

### 2. Reserved Instances
- Consider 1-year reserved instances for predictable workloads
- Estimated savings: 30-40% of on-demand costs

### 3. Storage Optimization
- Use GP3 instead of GP2 (better performance, lower cost)
- Enable RDS storage auto-scaling with reasonable limits

### 4. Data Transfer
- Keep backend and database in same AZ to avoid data transfer costs
- Use CloudFront for static assets if serving from backend

## Monitoring and Scaling

### 1. CloudWatch Alarms
```bash
# CPU Utilization > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name "ai-companion-cpu-high" \
  --alarm-description "CPU utilization is high" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:region:account:topic-name
```

### 2. Auto Scaling
```bash
# Create launch template
aws autoscaling create-launch-template \
  --launch-template-name ai-companion-template \
  --version-description "v1" \
  --launch-template-data '{"ImageId":"ami-xxxxxxxxx","InstanceType":"t3.small"}'

# Create auto scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name ai-companion-asg \
  --launch-template LaunchTemplateName=ai-companion-template \
  --min-size 1 \
  --max-size 3 \
  --desired-capacity 1 \
  --vpc-zone-identifier "subnet-xxxxxxxxx,subnet-yyyyyyyyy"
```

## Estimated Monthly Costs

### Months 1-12 (FREE TIER! 🎉)
| Service | Instance Type | Monthly Cost | Free Tier Status |
|---------|---------------|--------------|------------------|
| EC2 | t2.micro | $0.00 | ✅ FREE for 12 months |
| RDS | db.t3.micro | $0.00 | ✅ FREE for 12 months |
| ElastiCache | cache.t3.micro | $0.00 | ✅ FREE for 12 months |
| Load Balancer | None | $0.00 | ✅ Not needed initially |
| Data Transfer | ~15GB | $0.00 | ✅ FREE for 12 months |
| **Total** | | **$0.00** | 🎉 **COMPLETELY FREE!** |

### Months 13+ (After Free Tier)
| Service | Instance Type | Monthly Cost |
|---------|---------------|--------------|
| EC2 | t2.micro | $8.00 |
| RDS | db.t3.micro | $20.00 |
| ElastiCache | cache.t3.micro | $18.00 |
| Load Balancer | ALB | $18.00 |
| Data Transfer | ~100GB | $9.00 |
| **Total** | | **$73.00** |

**Your $120 credits will last approximately 15+ months! 🚀**

## Next Steps

1. **Immediate**: Deploy basic infrastructure (EC2 + RDS + Redis)
2. **Week 1**: Configure security, deploy backend, test connectivity
3. **Week 2**: Add load balancer, monitoring, and auto-scaling
4. **Week 3**: Performance testing and optimization
5. **Week 4**: Production deployment and monitoring setup

## Support and Troubleshooting

- **AWS Support**: Basic support included (free tier)
- **Documentation**: Check AWS Well-Architected Framework
- **Community**: AWS Developer Forums and Stack Overflow
- **Monitoring**: Use CloudWatch for proactive issue detection
