# 🚀 GitOps

GitOps is a way to manage infrastructure and applications using Git as the single source of truth.

👉 Whatever is written in Git = system should look like that

## Core Concepts

1. Git as Source of Truth
- All configs stored in Git
- No manual changes in cluster

2. Declarative Approach
- Define desired state (example: replicas = 3)
- System ensures it matches

3. Automated Reconciliation
- Tool compares Git state and cluster state
- If mismatch → auto fix

4. Pull-Based Deployment
- Cluster pulls changes from Git
- Not pushed by CI/CD

5. Easy Rollback
- Revert Git commit
- System rolls back automatically

# 📦 Argo CD

Argo CD is a GitOps tool for Kubernetes.

👉 It continuously deploys applications from Git to Kubernetes.

## Features
- Continuous Deployment
- Auto sync with Git
- UI dashboard
- Rollback support
- Drift detection

## How it Works
1. Connects to Git repo
2. Reads YAML configs
3. Compares desired vs actual state
4. Applies changes automatically

## Installation

kubectl create namespace argocd

kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

## Access UI

kubectl port-forward svc/argocd-server -n argocd 8080:443

## Get Password

kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"

## Debug

kubectl logs -n argocd deployment/argocd-application-controller

# 💡 GitOps Implementation Flow

## Step 1: Developer
- Write code
- Push to GitHub

## Step 2: CI/CD (GitHub Actions)
- Build Docker image
- Push image to registry
- Update Kubernetes YAML (image version)

Example:
image: myapp:v2

## Step 3: Git Repository
- Stores deployment.yaml
- Acts as single source of truth

## Step 4: Argo CD
- Watches Git repo
- Detects changes
- Pulls updates
- Syncs with Kubernetes

## Important Rule

Wrong:
CI/CD → deploy directly to Kubernetes

Correct:
CI/CD → update Git
Argo CD → deploy to Kubernetes

## Final Flow

Code → CI/CD → Update Git → Argo CD → Kubernetes