# Vercel Deployment Setup Guide

## Environment Variables Configuration

### Add Environment Variables via Vercel CLI

```bash
cd UI

# Set Production environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-api-gateway-url.amazonaws.com/prod

vercel env add NEXT_PUBLIC_COGNITO_USER_POOL_ID production
# Enter: us-east-1_XXXXXXXXX

vercel env add NEXT_PUBLIC_COGNITO_CLIENT_ID production
# Enter: your-actual-client-id

vercel env add NEXT_PUBLIC_COGNITO_REGION production
# Enter: us-east-1

# Redeploy
vercel --prod
```

---

## For Local Development (Using Placeholder Values)

If you don't have AWS Cognito set up yet, use these placeholder values for local testing:

Create `.env.local` file in `UI/` directory:

```env
# Backend API (use localhost for local testing)
NEXT_PUBLIC_API_URL=http://localhost:8000

# AWS Cognito (placeholder values - won't work for actual auth)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=local-dev-pool
NEXT_PUBLIC_COGNITO_CLIENT_ID=local-dev-client
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

**Note:** With these placeholder values:
- ✅ The app will build and deploy successfully
- ❌ Admin login will not work (requires real Cognito)
- ✅ User registration form will work (no auth required)

---

## Setting Up AWS Cognito (Production)

### 1. Create Cognito User Pool

```bash
# Install AWS CLI
pip install awscli
aws configure

# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name atelier-production \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}" \
  --auto-verified-attributes email

# Note the UserPoolId from output
```

### 2. Create App Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name atelier-web-client \
  --no-generate-secret \
  --explicit-auth-flows ADMIN_NO_SRP_AUTH USER_PASSWORD_AUTH

# Note the ClientId from output
```

### 3. Create Admin User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@ashishpatelatelier.com \
  --user-attributes Name=email,Value=admin@ashishpatelatelier.com \
  --temporary-password TempPass123!

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@ashishpatelatelier.com \
  --password YourSecurePassword123! \
  --permanent
```

### 4. Update Vercel Environment Variables

Use the UserPoolId and ClientId from above in Vercel settings.

---

## Deploy to Vercel

### First Time Deployment

```bash
cd UI

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Subsequent Deployments

```bash
# Just push to GitHub - Vercel auto-deploys
git push origin main

# Or manual deploy
vercel --prod
```

---

## Troubleshooting

### Error: Missing Environment Variables

**Solution:** Add all 4 required environment variables in Vercel dashboard under Settings → Environment Variables.

### Error: Build Failed

Check build logs in Vercel dashboard. Common issues:
- Missing dependencies: Run `npm install` locally first
- TypeScript errors: Check `npm run build` locally
- Environment variables not set

### Error: 404 on API Calls

**Solution:** 
1. Check `NEXT_PUBLIC_API_URL` is set correctly
2. Ensure your API Gateway is deployed
3. Check CORS settings in backend

### Error: Admin Login Not Working

**Solution:**
1. Verify Cognito User Pool ID and Client ID are correct
2. Check user exists in Cognito
3. Verify password is correct
4. Check browser console for errors

---

## Quick Deploy Checklist

- [ ] All source code pushed to GitHub
- [ ] Environment variables set in Vercel
- [ ] AWS Cognito User Pool created
- [ ] Admin user created in Cognito
- [ ] Backend API deployed to AWS Lambda
- [ ] API Gateway URL configured
- [ ] CORS origins include Vercel domain
- [ ] Deployment successful on Vercel
- [ ] Test user registration form
- [ ] Test admin login

---

## URLs After Deployment

- **Frontend:** https://your-project.vercel.app
- **API:** https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
- **Cognito:** Managed in AWS Console

---

## Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for frontend errors
3. Check CloudWatch logs for backend errors
4. Review DEPLOYMENT.md for detailed setup
