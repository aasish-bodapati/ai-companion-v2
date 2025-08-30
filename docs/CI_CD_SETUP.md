# 🚀 CI/CD Pipeline Setup Guide

This guide will help you set up the automated testing and deployment pipeline for the AI Companion project.

## 📋 Prerequisites

- GitHub repository with push access
- AWS account with appropriate permissions
- EC2 instance for deployment
- Docker installed locally (for testing)

## 🔧 GitHub Actions Setup

### 1. Create GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions, and add these secrets:

#### AWS Credentials
```
AWS_ACCESS_KEY_ID          # Your AWS access key
AWS_SECRET_ACCESS_KEY      # Your AWS secret key
AWS_REGION                 # Your AWS region (e.g., us-east-1)
```

#### EC2 Deployment
```
EC2_HOST                   # Your EC2 instance public IP or domain
EC2_USERNAME               # SSH username (usually 'ubuntu' or 'ec2-user')
EC2_SSH_KEY                # Your private SSH key for EC2 access
```

#### API Keys (Optional)
```
OPENAI_API_KEY             # OpenAI API key for testing
PRODUCTION_URL             # Your production URL for health checks
```

### 2. Verify Workflow Files

Ensure these files are in your repository:
- `.github/workflows/backend-tests.yml`
- `.github/workflows/frontend-tests.yml`
- `.github/workflows/deploy.yml`

### 3. Test the Pipeline

1. **Push a change** to trigger the workflows
2. **Check GitHub Actions** tab for execution
3. **Verify test results** and coverage reports
4. **Download artifacts** for detailed analysis

## 🐳 Docker Setup

### 1. Test Docker Builds Locally

```bash
# Backend
cd backend
docker build -t ai-companion-backend .

# Frontend
cd frontend
docker build -t ai-companion-frontend .
```

### 2. Verify Docker Compose

```bash
# Test production compose
docker-compose -f docker-compose.prod.yml config

# Test local compose
docker-compose -f docker-compose.yml up -d
```

## ☁️ AWS Setup

### 1. ECR Repository

```bash
# Create ECR repository
aws ecr create-repository --repository-name ai-companion

# Get login token
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account.dkr.ecr.your-region.amazonaws.com
```

### 2. EC2 Instance

```bash
# SSH to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Clone repository
git clone https://github.com/your-username/ai-companion-v2.git
cd ai-companion-v2

# Test deployment
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Security Groups

Ensure your EC2 security group allows:
- SSH (port 22) from your IP
- HTTP (port 80) from anywhere
- HTTPS (port 443) from anywhere
- Custom ports for your application

## 🧪 Test the Complete Pipeline

### 1. Make a Small Change

```bash
# Edit a file
echo "# Test change" >> README.md

# Commit and push
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main
```

### 2. Monitor Execution

1. **Backend Tests**: Should run first with matrix builds
2. **Frontend Tests**: Should run in parallel
3. **Deployment**: Should trigger after all tests pass
4. **Health Check**: Should verify deployment success

### 3. Verify Results

- **Test Results**: Check GitHub Actions artifacts
- **Coverage Reports**: Download and review coverage
- **Deployment**: Verify your changes are live
- **Logs**: Check application logs for errors

## 🔍 Troubleshooting

### Common Issues

#### Workflow Failures
```bash
# Check GitHub Actions logs
# Look for specific error messages
# Verify secrets are correct
# Check file paths and permissions
```

#### Docker Build Failures
```bash
# Test locally first
docker build -t test-image .

# Check Dockerfile syntax
docker build --no-cache -t test-image .

# Verify context and paths
```

#### Deployment Failures
```bash
# Check EC2 connectivity
ssh -i your-key.pem ubuntu@your-ec2-ip

# Verify Docker is running
sudo systemctl status docker

# Check application logs
docker-compose -f docker-compose.prod.yml logs
```

#### Test Failures
```bash
# Run tests locally
cd backend && python run_tests.py --all
cd frontend && npm run test:all

# Check environment variables
echo $DATABASE_URL
echo $MEMORY_ENABLED
```

### Debug Commands

```bash
# Check workflow status
gh run list --workflow=backend-tests

# View workflow logs
gh run view --log

# Rerun failed workflow
gh run rerun <run-id>
```

## 📊 Monitoring

### 1. GitHub Actions Dashboard

- **Workflow Status**: Monitor all workflows
- **Test Results**: Track test success/failure rates
- **Execution Times**: Monitor performance trends
- **Artifacts**: Download test results and coverage

### 2. Application Monitoring

- **Health Checks**: Verify application availability
- **Logs**: Monitor application and error logs
- **Metrics**: Track performance and usage
- **Alerts**: Set up failure notifications

### 3. AWS Monitoring

- **EC2 Metrics**: Monitor instance performance
- **ECR Usage**: Track Docker image usage
- **CloudWatch**: Set up custom metrics and alarms

## 🚀 Next Steps

### 1. Optimize the Pipeline

- **Parallel Execution**: Optimize test parallelization
- **Caching**: Improve dependency caching
- **Artifacts**: Optimize artifact storage and retention
- **Notifications**: Add Slack/email notifications

### 2. Advanced Features

- **Blue-Green Deployment**: Implement zero-downtime deployments
- **Rollback**: Add automatic rollback on failures
- **Canary Deployments**: Test with subset of users
- **Performance Testing**: Add automated performance tests

### 3. Security Enhancements

- **Secret Rotation**: Implement automatic secret rotation
- **Vulnerability Scanning**: Add security scanning to pipeline
- **Compliance**: Add compliance checks and reporting
- **Audit Logging**: Enhance deployment audit trails

## 📞 Support

### Getting Help

1. **Check this guide** for common solutions
2. **Review GitHub Actions logs** for specific errors
3. **Test locally** to isolate issues
4. **Consult team members** for complex problems

### Useful Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Docker Documentation](https://docs.docker.com/)
- [Pytest Documentation](https://docs.pytest.org/)

---

## ✅ Checklist

- [ ] GitHub repository configured
- [ ] GitHub Actions workflows added
- [ ] GitHub secrets configured
- [ ] AWS ECR repository created
- [ ] EC2 instance configured
- [ ] Docker builds tested locally
- [ ] First pipeline run successful
- [ ] Deployment verified
- [ ] Monitoring configured
- [ ] Team notified of new process

---

*Congratulations! You now have a production-ready CI/CD pipeline! 🎉*

