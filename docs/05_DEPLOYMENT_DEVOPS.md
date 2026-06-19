# Deployment & DevOps Lifecycle

## Overview

Agri-Connect is deployed using modern cloud infrastructure with automated CI/CD pipelines, containerization, and multi-environment setup.

---

## Deployment Architecture

### Overall Infrastructure Diagram

```mermaid
graph TB
    GH["GitHub Repository"]
    
    GH -->|Webhook| GHA["GitHub Actions<br/>CI/CD Pipeline"]
    
    GHA -->|Build & Test| BE["Backend Tests"]
    GHA -->|Build & Test| FE["Frontend Tests"]
    
    BE -->|Build Docker| BEIMG["Backend Image"]
    FE -->|Build & Export| FEARTIFACT["Frontend Build"]
    
    BEIMG -->|Push| ECR["AWS ECR<br/>Container Registry"]
    FEARTIFACT -->|Deploy| VERCEL["Vercel<br/>Frontend Hosting"]
    
    ECR -->|Deploy| HEROKU["Heroku<br/>Backend Server"]
    
    HEROKU -->|Connects| MONGOD["MongoDB Atlas<br/>Cloud Database"]
    HEROKU -->|Uploads| CLOUD["Cloudinary<br/>CDN"]
    
    VERCEL -->|Serves| USERS["End Users<br/>Farmers"]
    HEROKU -->|API| USERS
    
    subgraph "Monitoring"
        LOGS["Heroku Logs"]
        MONITOR["Vercel Analytics"]
        ALERT["Alert System"]
    end
    
    HEROKU --> LOGS
    VERCEL --> MONITOR
    LOGS --> ALERT
    
    style GH fill:#FFE4E1
    style GHA fill:#FFE4B5
    style HEROKU fill:#87CEEB
    style VERCEL fill:#90EE90
    style MONGOD fill:#FFB6C1
```

---

## Environment Configuration

### Multi-Environment Setup

```mermaid
graph TD
    DEV["🖥️ Development<br/>Laptop"]
    STAGING["🧪 Staging<br/>Environment"]
    PROD["🚀 Production<br/>Environment"]
    
    DEV -->|Git Push| GH["GitHub Main<br/>Branch"]
    
    GH -->|Auto Deploy| STAGING
    STAGING -->|Manual Approval| PROD
    
    DEV -.->|.env.local| DB1["Local MongoDB<br/>localhost:27017"]
    STAGING -->|.env.staging| DB2["Staging MongoDB<br/>Atlas Cluster"]
    PROD -->|.env.production| DB3["Production MongoDB<br/>Atlas Cluster"]
    
    subgraph Endpoints
        DEVAPI["localhost:5000<br/>localhost:3000"]
        STAGINGAPI["api-staging.agri-connect<br/>staging.agri-connect"]
        PRODAPI["api.agri-connect.com<br/>agri-connect.com"]
    end
    
    DB1 --> DEVAPI
    DB2 --> STAGINGAPI
    DB3 --> PRODAPI
    
    style DEV fill:#FFE4E1
    style STAGING fill:#FFE4B5
    style PROD fill:#90EE90
```

### Environment Variables

#### Development (.env.local)
```bash
# Backend
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/agriconnect
JWT_SECRET=dev_secret_key_change_this
JWT_REFRESH_SECRET=dev_refresh_secret_change_this
CLIENT_URL=http://localhost:3000

# Cloudinary (optional for local dev)
CLOUDINARY_NAME=dev_cloudinary
CLOUDINARY_API_KEY=dev_api_key
CLOUDINARY_API_SECRET=dev_api_secret

# Frontend
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

#### Staging (.env.staging)
```bash
PORT=5000
NODE_ENV=staging
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agriconnect-staging
JWT_SECRET=${STAGING_JWT_SECRET}
JWT_REFRESH_SECRET=${STAGING_JWT_REFRESH_SECRET}
CLIENT_URL=https://staging.agri-connect.com

CLOUDINARY_NAME=${STAGING_CLOUDINARY_NAME}
CLOUDINARY_API_KEY=${STAGING_CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${STAGING_CLOUDINARY_API_SECRET}
```

#### Production (.env.production)
```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agriconnect-prod
JWT_SECRET=${PROD_JWT_SECRET}
JWT_REFRESH_SECRET=${PROD_JWT_REFRESH_SECRET}
CLIENT_URL=https://agri-connect.com

CLOUDINARY_NAME=${PROD_CLOUDINARY_NAME}
CLOUDINARY_API_KEY=${PROD_CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${PROD_CLOUDINARY_API_SECRET}

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
NEWRELIC_LICENSE_KEY=${NEWRELIC_LICENSE_KEY}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```mermaid
graph LR
    A["Developer<br/>Commits Code"] --> B["Push to<br/>Main Branch"]
    B --> C["GitHub Webhook<br/>Triggered"]
    C --> D["Workflow Start:<br/>.github/workflows/deploy.yml"]
    
    D --> E["Checkout<br/>Repository"]
    E --> F["Setup Node.js<br/>v18"]
    
    F --> G["Install<br/>Dependencies"]
    G --> H["Lint & Format<br/>Check"]
    H --> I{"Lint<br/>Pass?"}
    I -->|No| J["Fail Build<br/>Notify Dev"]
    I -->|Yes| K["Run Tests"]
    
    K --> L{"Tests<br/>Pass?"}
    L -->|No| J
    L -->|Yes| M["Build Docker<br/>Image Backend"]
    
    M --> N["Build Frontend<br/>Artifacts"]
    
    N --> O["Push Backend<br/>to ECR"]
    N --> P["Deploy Frontend<br/>to Vercel"]
    
    O --> Q["Deploy Backend<br/>to Heroku"]
    Q --> R["Run DB<br/>Migrations"]
    
    P --> S["Smoke Tests<br/>Production"]
    Q --> S
    
    S --> T{"Tests<br/>Pass?"}
    T -->|No| U["Rollback<br/>Deployment"]
    U --> J
    T -->|Yes| V["Send Success<br/>Notification"]
    V --> W["Deployment<br/>Complete"]
    
    style A fill:#FFE4E1
    style W fill:#90EE90
    style J fill:#FFB6C1
```

### Workflow File Example

```yaml
name: Deploy to Staging/Production

on:
  push:
    branches:
      - main
      - develop

env:
  NODE_VERSION: '18'
  REGISTRY: ecr.amazonaws.com

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install Backend Dependencies
        run: cd backend && npm install
      
      - name: Run Backend Tests
        run: cd backend && npm test
      
      - name: Lint Backend
        run: cd backend && npm run lint
      
      - name: Install Frontend Dependencies
        run: cd frontend && npm install
      
      - name: Build Frontend
        run: cd frontend && npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
      
      - name: Run Frontend Tests
        run: cd frontend && npm test -- --coverage
      
      - name: Build Backend Docker Image
        run: |
          docker build -t agri-connect-backend:latest ./backend
          docker tag agri-connect-backend:latest ${{ env.REGISTRY }}/agri-connect-backend:latest
      
      - name: Push to ECR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ env.REGISTRY }}
          docker push ${{ env.REGISTRY }}/agri-connect-backend:latest
      
      - name: Deploy Frontend to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          vercel --prod --token ${{ env.VERCEL_TOKEN }}
      
      - name: Deploy Backend to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
        run: |
          heroku container:login
          heroku container:push web -a agri-connect-api
          heroku container:release web -a agri-connect-api
```

---

## Database Migrations

### Migration Lifecycle

```mermaid
graph TD
    A["Developer Creates<br/>Schema Change"] --> B["Create Migration<br/>File"]
    B --> C["Test Migration<br/>Locally"]
    C --> D["Commit Migration<br/>to Git"]
    D --> E["Push to Main<br/>Branch"]
    
    E --> F["CI/CD Pipeline<br/>Runs"]
    F --> G["Deploy to Staging"]
    G --> H["Run Migration<br/>on Staging DB"]
    H --> I{"Migration<br/>Success?"}
    
    I -->|No| J["Rollback<br/>Migration"]
    J --> K["Fix and<br/>Retest"]
    K --> C
    
    I -->|Yes| L["Manual Approval<br/>by Admin"]
    L --> M["Deploy to Prod"]
    M --> N["Run Migration<br/>on Prod DB"]
    N --> O["Backup Prod DB<br/>Pre-migration"]
    O --> P["Execute<br/>Migration"]
    P --> Q["Verify Data<br/>Integrity"]
    Q --> R["Monitor for<br/>Issues"]
    R --> S["Migration<br/>Complete"]
```

---

## Monitoring & Observability

### Monitoring Stack

```mermaid
graph TD
    APP["Agri-Connect<br/>Application"]
    
    APP -->|Logs| HEROKU_LOGS["Heroku<br/>Logs"]
    APP -->|Metrics| NEWRELIC["New Relic<br/>APM"]
    APP -->|Errors| SENTRY["Sentry<br/>Error Tracking"]
    APP -->|Analytics| VERCEL["Vercel<br/>Analytics"]
    
    HEROKU_LOGS -->|Parse| ELK["ELK Stack<br/>Elasticsearch"]
    NEWRELIC -->|Dashboard| DASH1["Performance<br/>Dashboard"]
    SENTRY -->|Alerts| ALERT["Alert System<br/>Slack/Email"]
    VERCEL -->|Reports| DASH2["User Experience<br/>Dashboard"]
    
    DASH1 --> OPS["DevOps Team"]
    ALERT --> OPS
    DASH2 --> OPS
    
    style APP fill:#87CEEB
    style OPS fill:#90EE90
```

### Health Check Endpoints

```javascript
// Backend health check endpoint
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2026-06-19T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": 512,
    "total": 2048
  }
}
```

### Key Metrics to Monitor

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| **CPU Usage** | > 80% | Warning |
| **Memory Usage** | > 85% | Critical |
| **Response Time** | > 2000ms | Warning |
| **Error Rate** | > 1% | Critical |
| **Database Connection Pool** | > 90% | Warning |
| **Disk Usage** | > 80% | Warning |
| **Requests/sec** | > 1000 | Monitor |

---

## Rollback Procedures

### Automatic Rollback

```mermaid
graph TD
    A["New Deployment<br/>Goes Live"] --> B["Run Smoke Tests"]
    B --> C{"Critical<br/>Errors?"}
    
    C -->|Yes| D["Trigger Automatic<br/>Rollback"]
    D --> E["Switch to<br/>Previous Version"]
    E --> F["Notify DevOps<br/>Team"]
    F --> G["Create Incident<br/>Report"]
    G --> H["Rollback<br/>Complete"]
    
    C -->|No| I["Monitor for<br/>24 Hours"]
    I --> J["Mark as<br/>Stable"]
    
    style H fill:#FFB6C1
    style J fill:#90EE90
```

### Manual Rollback Process

```bash
# Heroku Backend Rollback
heroku releases -a agri-connect-api
heroku rollback v42 -a agri-connect-api  # Rollback to version 42

# Vercel Frontend Rollback
vercel rollback agri-connect --prod

# Database Rollback (from backup)
mongorestore --uri "mongodb+srv://..." --drop < backup-2026-06-19.dump
```

---

## Load Testing & Stress Testing

### Load Testing Workflow

```mermaid
graph TD
    A["Identify Peak<br/>Usage Scenario"] --> B["Create Load<br/>Test Script"]
    B --> C["Simulate X<br/>Concurrent Users"]
    C --> D["Ramp Up Over<br/>Time"]
    D --> E["Monitor Metrics"]
    
    E --> F{"Meets<br/>Performance<br/>Goals?"}
    F -->|No| G["Identify<br/>Bottleneck"]
    G --> H["Optimize Code<br/>or Infrastructure"]
    H --> I["Test Again"]
    I --> E
    
    F -->|Yes| J["Load Test<br/>Passed"]
    
    style J fill:#90EE90
```

### Example Load Testing with Apache JMeter

```bash
# Install JMeter
brew install jmeter

# Create test plan for 100 concurrent users
jmeter -n -t load_test.jmx \
  -l results.jtl \
  -j jmeter.log \
  -Jusers=100 \
  -Jrampup=60 \
  -Jduration=300
```

---

## Disaster Recovery

### Backup Strategy

```mermaid
graph TD
    A["Production<br/>Database"] -->|Daily| B["Automated Backup<br/>MongoDB Atlas"]
    B --> C["Point-in-time<br/>Recovery<br/>Enabled"]
    
    A -->|Weekly| D["Export to S3<br/>Long-term Storage"]
    D --> E["Encrypted &<br/>Versioned"]
    
    F["Application Code"] -->|Continuous| G["GitHub<br/>Repository"]
    G --> H["Distributed<br/>Copies"]
    
    I["User Files<br/>Cloudinary"] -->|Automatic| J["Multiple CDN<br/>Nodes"]
    
    K["Configuration<br/>.env Files"] -->|Manual| L["Secrets Manager<br/>AWS Secrets"]
    L --> M["Encrypted<br/>Backup"]
```

### Disaster Recovery Plan

```mermaid
graph TD
    A["Disaster<br/>Detected"] --> B["Assess<br/>Severity"]
    B --> C{"Data<br/>Loss?"}
    
    C -->|No| D["Use Point-in-time<br/>Recovery"]
    C -->|Yes| E["Check S3<br/>Backups"]
    
    D --> F["Restore from<br/>Latest Backup"]
    E --> F
    
    F --> G["Verify Data<br/>Integrity"]
    G --> H["Restart<br/>Services"]
    H --> I["Run Tests"]
    I --> J["Notify Users"]
    J --> K["Post-incident<br/>Review"]
    
    style K fill:#FFE4B5
```

---

## Scaling Strategy

### Horizontal Scaling

```mermaid
graph TD
    LB["Load Balancer<br/>Heroku Dyno Manager"]
    
    LB --> BE1["Backend Instance 1"]
    LB --> BE2["Backend Instance 2"]
    LB --> BE3["Backend Instance 3"]
    
    BE1 --> DB[(MongoDB<br/>Atlas Cluster<br/>Replicated)]
    BE2 --> DB
    BE3 --> DB
    
    FE["Frontend<br/>Vercel CDN<br/>Global Edge<br/>Network"]
    
    FE --> USER1["Users in<br/>North America"]
    FE --> USER2["Users in<br/>Europe"]
    FE --> USER3["Users in<br/>Asia"]
    
    BE1 --> CACHE["Redis Cache<br/>Session Store"]
    BE2 --> CACHE
    BE3 --> CACHE
```

### Auto-scaling Triggers

```
Scale up when:
- CPU usage > 70% for 5 minutes
- Memory usage > 75% for 5 minutes
- Response time > 1500ms for 3 minutes

Scale down when:
- CPU usage < 30% for 10 minutes
- Memory usage < 40% for 10 minutes
- Response time < 500ms for 5 minutes

Min instances: 2
Max instances: 10
```

---

## Release Checklist

Before deploying to production:

- [ ] All tests pass (unit, integration, e2e)
- [ ] Code review completed
- [ ] Database migrations tested on staging
- [ ] Performance metrics reviewed
- [ ] Security scan passed
- [ ] Staging environment validated
- [ ] Team notified of deployment
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] User-facing documentation updated

---

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH

Example: 1.2.3

MAJOR: Breaking changes
MINOR: New features, backward compatible
PATCH: Bug fixes, no functional changes

v1.0.0 - Initial release
v1.1.0 - Added community Q&A feature
v1.1.1 - Fixed search indexing bug
v1.2.0 - Added admin dashboard
v2.0.0 - Redesign UI, API restructuring
```

### Release Timeline

```mermaid
graph LR
    A["Sprint Planning<br/>Day 1"] --> B["Development<br/>Days 1-8"]
    B --> C["Testing & QA<br/>Days 9-10"]
    C --> D["Staging Deploy<br/>Day 11"]
    D --> E["UAT & Review<br/>Days 12-13"]
    E --> F["Production Deploy<br/>Day 14"]
    F --> G["Monitoring<br/>Day 14-21"]
    
    G --> H["Release<br/>Complete"]
    
    style H fill:#90EE90
```

---

*Deployment documentation created for DevOps and production reference.*
*Last updated: 2026-06-19*
