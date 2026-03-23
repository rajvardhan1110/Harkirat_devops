# 📦 Helm – Package Management (Kubernetes Notes)

## 🔹 What is Package Management?
- Helps to install, update, and delete applications easily
- Uses ready-made configurations
- In Kubernetes, packages are called **Helm Charts**

---

## 🔹 Why Package Management in K8s?
- Kubernetes apps require many YAML files
- Hard to manage manually
- Helm makes it:
  - Easy
  - Reusable
  - Fast

---

## 🔹 Benefits of Helm
- Reusable charts
- Easy installation and deletion
- Version control
- Rollback support
- Clean structure

---

## 🔹 What is Helm?
- Helm is a package manager for Kubernetes
- Similar to:
  - npm (Node.js)
  - apt (Linux)

---

## 🔹 Helm Chart Structure
```
my-chart/
 ├── Chart.yaml
 ├── values.yaml
 ├── templates/
 └── charts/
```

---

## 🔹 Chart Repositories
- Store Helm charts
- Examples:
  - ArtifactHub
  - Bitnami

### Install from repo
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-nginx bitnami/nginx
```

---

## 🔹 Go Templates
- Helm uses Go templating
- Dynamic values using `{{ }}`

Example:
```yaml
name: {{ .Values.name }}
```

---

## 🔹 Why Templates?
- Avoid repeating code
- Dynamic configuration
- Easy to update using values.yaml

---

# 🚀 Creating Your Own Postgres Chart

## Step 1: Initialize
```bash
mkdir my-postgres-chart
cd my-postgres-chart
helm create .
```

---

## Step 2: Remove default templates
```bash
rm -rf templates/*
```

---

## Step 3: Update Chart.yaml
```yaml
apiVersion: v2
name: my-postgres
description: A simple PostgreSQL Helm chart
version: 0.1.0
appVersion: "15"
```

---

## Step 4: Create values.yaml
```yaml
name: postgres-app
postgresUser: user
postgresPassword: password
postgresDatabase: mydb
namespace: postgres

image:
  repository: postgres
  tag: "15"

service:
  port: 5432
```

---

## Step 5: Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.name }}
  namespace: {{ .Values.namespace }}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {{ .Values.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.name }}
    spec:
      containers:
        - name: postgres
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          env:
            - name: POSTGRES_USER
              value: {{ .Values.postgresUser }}
            - name: POSTGRES_PASSWORD
              value: {{ .Values.postgresPassword }}
            - name: POSTGRES_DB
              value: {{ .Values.postgresDatabase }}
          ports:
            - containerPort: 5432
```

---

## Step 6: Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: {{ .Values.namespace }}
```

---

## Step 7: Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "my-postgres.fullname" . }}
  namespace: {{ .Values.namespace }}
spec:
  selector:
    app: {{ .Values.name }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.port }}
```

---

## Step 8: Install Chart
```bash
helm install postgres-chart .
```

---

## Step 9: Upgrade Chart
```bash
helm upgrade postgres-chart .
```

---

## Step 10: Debug Chart
```bash
helm template postgres .
```

---

# 📌 Assignment Answers

## 1. name vs fullname
- `fullname` → unique name (recommended)
- `name` → simple name

✔ Use `fullname` for production

---

## 2. Run Two Apps
```bash
helm install app1 .
helm install app2 .
```

---

## 3. Dynamic Ports
```yaml
port: {{ .Values.service.port }}
```

---

# 🚀 Using Any Helm Chart in Kubernetes

## Example: Install NGINX
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm install my-nginx bitnami/nginx
```

---

## Check Resources
```bash
kubectl get pods
kubectl get svc
```

---

## Upgrade
```bash
helm upgrade my-nginx bitnami/nginx
```

---

## Delete
```bash
helm uninstall my-nginx
```

---

# 🧠 English Correction

❌ give me all me md format codeblock  
✅ Give me everything in a Markdown code block