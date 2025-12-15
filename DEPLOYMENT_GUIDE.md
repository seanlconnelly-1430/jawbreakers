# Azure Static Web Apps Deployment Guide

This guide will help you deploy your Jawbreakers game collection to Azure Static Web Apps.

## Prerequisites

- An Azure account (free tier available)
- Your code pushed to a Git repository (GitHub, Azure DevOps, or Bitbucket)

## Deployment Methods

### Method 1: Deploy via Azure Portal (Easiest)

1. **Create Azure Static Web App Resource**
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

2. **Configure Basic Settings**
   - **Subscription**: Choose your subscription
   - **Resource Group**: Create new or use existing
   - **Name**: e.g., `jawbreakers-games`
   - **Plan type**: Free (for testing) or Standard (for production)
   - **Region**: Choose closest to your users

3. **Configure Deployment**
   - **Source**: Choose your Git provider (GitHub, Azure DevOps, or Bitbucket)
   - **Organization**: Your GitHub username/organization
   - **Repository**: `Jawbreakers` (or your repo name)
   - **Branch**: `main` (or your default branch)
   - **Build Presets**: `Custom`
   - **App location**: `/` (root directory)
   - **Api location**: Leave empty (no API)
   - **Output location**: `/` (all files are in root)

4. **Review and Create**
   - Review settings
   - Click "Create"
   - Azure will automatically set up GitHub Actions (if using GitHub)

5. **Access Your Site**
   - After deployment completes (5-10 minutes), go to your Static Web App resource
   - Click on "Overview"
   - Find the "URL" field - this is your live site!

### Method 2: Deploy via Azure CLI

1. **Install Azure CLI**
   ```bash
   # Windows (PowerShell)
   winget install -e --id Microsoft.AzureCLI
   
   # Or download from: https://aka.ms/installazurecliwindows
   ```

2. **Login to Azure**
   ```bash
   az login
   ```

3. **Create Resource Group** (if needed)
   ```bash
   az group create --name jawbreakers-rg --location eastus
   ```

4. **Create Static Web App**
   ```bash
   az staticwebapp create \
     --name jawbreakers-games \
     --resource-group jawbreakers-rg \
     --location eastus \
     --sku Free
   ```

5. **Deploy from Local Directory**
   ```bash
   # Navigate to your project directory
   cd C:\Users\seanl\repos\Jawbreakers
   
   # Deploy files
   az staticwebapp deploy \
     --name jawbreakers-games \
     --resource-group jawbreakers-rg \
     --source .
   ```

### Method 3: GitHub Actions (Automatic)

If you've already connected your GitHub repo in Method 1, Azure automatically creates a GitHub Actions workflow. You can also create it manually:

1. **Create `.github/workflows/azure-static-web-apps-<app-name>.yml`**
   ```yaml
   name: Azure Static Web Apps CI/CD
   
   on:
     push:
       branches:
         - main
     pull_request:
       types: [opened, synchronize, reopened, closed]
       branches:
         - main
   
   jobs:
     build_and_deploy_job:
       if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
       runs-on: ubuntu-latest
       name: Build and Deploy Job
       steps:
         - uses: actions/checkout@v3
           with:
             submodules: true
         - name: Build And Deploy
           id: builddeploy
           uses: Azure/static-web-apps-deploy@v1
           with:
             azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
             repo_token: ${{ secrets.GITHUB_TOKEN }}
             action: "upload"
             app_location: "/"
             api_location: ""
             output_location: "/"
     close_pull_request_job:
       if: github.event_name == 'pull_request' && github.event.action == 'closed'
       runs-on: ubuntu-latest
       name: Close Pull Request Job
       steps:
         - name: Close Pull Request
           id: closepullrequest
           uses: Azure/static-web-apps-deploy@v1
           with:
             azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
             action: "close"
   ```

2. **Get Deployment Token**
   - Go to your Static Web App in Azure Portal
   - Click "Manage deployment token"
   - Copy the token

3. **Add Secret to GitHub**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: Paste the token from step 2

## Custom Domain (Optional)

1. Go to your Static Web App in Azure Portal
2. Click "Custom domains"
3. Click "Add"
4. Enter your domain name
5. Follow DNS configuration instructions

## Cost

- **Free Tier**: 
  - 100 GB bandwidth/month
  - Custom domains supported
  - SSL certificates included
  - Perfect for personal projects

- **Standard Tier**: 
  - Starts at $9/month
  - More bandwidth and features
  - Better for production apps

## Troubleshooting

- **404 Errors**: Check `staticwebapp.config.json` routing rules
- **Files not updating**: Clear browser cache or wait a few minutes
- **Build failures**: Check GitHub Actions logs (if using GitHub)

## Useful Commands

```bash
# List all Static Web Apps
az staticwebapp list

# Get Static Web App details
az staticwebapp show --name jawbreakers-games --resource-group jawbreakers-rg

# Delete Static Web App
az staticwebapp delete --name jawbreakers-games --resource-group jawbreakers-rg
```

## Next Steps

1. Push your code to GitHub (if not already done)
2. Follow Method 1 (Azure Portal) for easiest setup
3. Your site will be live at: `https://<your-app-name>.azurestaticapps.net`

## Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Pricing](https://azure.microsoft.com/pricing/details/app-service/static/)
- [Azure Free Account](https://azure.microsoft.com/free/)

