# AWS Cost Optimization Guide for AI Companion Backend

## Current Cost Analysis

### Monthly Costs (Estimated) - FREE TIER OPTIMIZED! 🎉
| Service | Instance Type | Monthly Cost | Free Tier Eligible |
|---------|---------------|--------------|-------------------|
| EC2 | t2.micro | $0.00 | ✅ (12 months FREE!) |
| RDS | db.t3.micro | $0.00 | ✅ (12 months FREE!) |
| ElastiCache | cache.t3.micro | $0.00 | ✅ (12 months FREE!) |
| Load Balancer | None | $0.00 | ✅ (Not needed initially) |
| Data Transfer | ~15GB | $0.00 | ✅ (15GB free) |
| **Total** | | **$0.00** | 🎉 **COMPLETELY FREE!** |

**Your $120 credits will last approximately 15+ months! 🚀**

## Immediate Cost Savings (Week 1)

### 1. Already Using Free Tier Instances! 🎉
```bash
# You're already using the optimal free tier setup:
# EC2: t2.micro (FREE for 12 months)
# RDS: db.t3.micro (FREE for 12 months)  
# ElastiCache: cache.t3.micro (FREE for 12 months)

# No changes needed - you're already optimized!
```

**Current Status: $0/month for 12 months (COMPLETELY FREE!)**

### 2. Remove Load Balancer (Initially)
- Use EC2 public IP directly
- Add load balancer later when scaling is needed
- **Savings: $18/month**

### 3. Optimize Storage
```bash
# RDS: Use GP3 instead of GP2
aws rds modify-db-instance \
    --db-instance-identifier your-db-id \
    --storage-type gp3 \
    --iops 3000 \
    --apply-immediately

# Enable storage auto-scaling with limits
aws rds modify-db-instance \
    --db-instance-identifier your-db-id \
    --max-allocated-storage 50 \
    --apply-immediately
```

**Savings: $2-5/month**

## Medium-term Cost Savings (Month 2-3)

### 1. Reserved Instances
```bash
# Purchase 1-year reserved instances
aws pricing get-products \
    --service-code AmazonEC2 \
    --filters "Type=TERM_MATCH,Field=instanceType,Value=t3.small"

# Expected savings: 30-40% of on-demand costs
```

**Savings: $5-7/month**

### 2. Spot Instances (Advanced)
```bash
# Use spot instances for non-critical workloads
aws ec2 request-spot-instances \
    --spot-price "0.05" \
    --instance-count 1 \
    --type "one-time" \
    --launch-specification file://spot-spec.json

# Expected savings: 60-90% of on-demand costs
```

**Savings: $9-13/month (but requires fallback strategy)**

### 3. Instance Scheduling
```bash
# Stop instances during off-hours (e.g., 10 PM - 8 AM)
aws ec2 stop-instances --instance-ids your-instance-id

# Use AWS Instance Scheduler
aws cloudformation create-stack \
    --stack-name instance-scheduler \
    --template-url https://s3.amazonaws.com/solutions-reference/instance-scheduler/latest/instance-scheduler.template
```

**Savings: 40-60% of compute costs = $6-9/month**

## Long-term Cost Optimization (Month 4+)

### 1. Multi-Account Strategy
- Use separate AWS accounts for development/staging
- Leverage free tier across multiple accounts
- **Savings: $20-30/month**

### 2. Serverless Alternatives
```bash
# Consider AWS Lambda for API endpoints
aws lambda create-function \
    --function-name ai-companion-api \
    --runtime python3.11 \
    --handler app.main.handler \
    --role arn:aws:iam::account:role/lambda-role

# Expected cost for 100K requests: $2-5/month
```

**Savings: $10-15/month (but requires code refactoring)**

### 3. Database Optimization
```bash
# Use Aurora Serverless v2
aws rds create-db-cluster \
    --db-cluster-identifier aurora-cluster \
    --engine aurora-postgresql \
    --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=1

# Expected cost: $10-15/month
```

**Savings: $5-10/month**

## Cost Monitoring and Alerts

### 1. Set Up Budget Alerts
```bash
# Create budget with alerts
aws budgets create-budget \
    --account-id your-account-id \
    --budget '{
        "BudgetName": "ai-companion-monthly",
        "BudgetLimit": {
            "Amount": "50.00",
            "Unit": "USD"
        },
        "TimeUnit": "MONTHLY",
        "BudgetType": "COST"
    }' \
    --notifications-with-subscribers '[
        {
            "Notification": {
                "ComparisonOperator": "GREATER_THAN",
                "NotificationType": "ACTUAL",
                "Threshold": 80.0,
                "ThresholdType": "PERCENTAGE"
            },
            "Subscribers": [
                {
                    "Address": "your-email@example.com",
                    "SubscriptionType": "EMAIL"
                }
            ]
        }
    ]'
```

### 2. Cost Explorer Queries
```bash
# Get daily costs for the last 30 days
aws ce get-cost-and-usage \
    --time-period Start=2024-01-01,End=2024-01-31 \
    --granularity DAILY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE
```

### 3. CloudWatch Alarms
```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "high-cpu-cost" \
    --alarm-description "High CPU utilization may increase costs" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:region:account:topic-name
```

## Recommended Cost-Optimized Architecture

### Phase 1: Free Tier (Months 1-12)
```
EC2: t2.micro (free tier)
RDS: db.t3.micro (free tier)
ElastiCache: cache.t3.micro (free tier)
Load Balancer: None
Estimated Cost: $20-30/month
```

### Phase 2: Optimized (Months 13+)
```
EC2: t3.small with reserved instance
RDS: db.t3.micro with storage optimization
ElastiCache: cache.t3.micro
Load Balancer: ALB (when needed)
Estimated Cost: $40-50/month
```

### Phase 3: Production (Months 18+)
```
EC2: t3.medium with auto-scaling
RDS: db.t3.small with read replicas
ElastiCache: cache.t3.small
Load Balancer: ALB
Monitoring: CloudWatch + X-Ray
Estimated Cost: $80-100/month
```

## Cost Optimization Checklist

### Week 1
- [ ] Switch to free tier instances
- [ ] Remove unnecessary load balancer
- [ ] Set up cost monitoring
- [ ] Configure budget alerts

### Month 1
- [ ] Analyze usage patterns
- [ ] Implement instance scheduling
- [ ] Optimize storage settings
- [ ] Review security group rules

### Month 2
- [ ] Purchase reserved instances
- [ ] Set up auto-scaling policies
- [ ] Implement cost allocation tags
- [ ] Review and optimize database queries

### Month 3
- [ ] Evaluate serverless alternatives
- [ ] Consider multi-region deployment
- [ ] Implement advanced monitoring
- [ ] Plan for production scaling

## Expected Cost Progression

| Month | Architecture | Monthly Cost | Cumulative Cost |
|-------|--------------|--------------|-----------------|
| 1-12 | Free Tier | $0 | $0 (COMPLETELY FREE!) |
| 13-18 | Optimized | $40-50 | $240-300 |
| 19+ | Production | $80-100 | $960-1200/year |

**Your $120 credits will cover approximately 15+ months of deployment! 🚀**

## Emergency Cost Control

### 1. Immediate Actions
```bash
# Stop all non-essential instances
aws ec2 stop-instances --instance-ids instance1 instance2

# Delete unused EBS volumes
aws ec2 delete-volume --volume-id vol-1234567890abcdef0

# Terminate unused load balancers
aws elbv2 delete-load-balancer --load-balancer-arn arn:aws:elasticloadbalancing:...
```

### 2. Cost Control Script
```bash
#!/bin/bash
# Emergency cost control script

# Stop all EC2 instances
aws ec2 describe-instances --query 'Reservations[].Instances[?State.Name==`running`].[InstanceId]' --output text | xargs -I {} aws ec2 stop-instances --instance-ids {}

# Delete all snapshots older than 7 days
aws ec2 describe-snapshots --owner-ids self --query 'Snapshots[?StartTime<`'$(date -d '7 days ago' -u +%Y-%m-%d)'`].[SnapshotId]' --output text | xargs -I {} aws ec2 delete-snapshot --snapshot-id {}

echo "Emergency cost control measures applied"
```

## Conclusion

With FREE TIER optimization, your $120 AWS credits can provide:
- **12 months** of COMPLETELY FREE deployment! 🎉
- **15+ months** total deployment time
- **Professional-grade** infrastructure
- **Scalable architecture** for future growth
- **Maximum value** from your AWS credits

The key is leveraging AWS Free Tier for the first 12 months, then using your credits strategically for months 13+.
