# Kubernetes Ingress & Ingress Controller Notes

##  Overview

This project demonstrates how to use **Ingress** and an **Ingress Controller** in Kubernetes to route traffic to multiple services using a single entry point.

We deploy:

* 🟢 Nginx Application
* 🔵 Apache Application
* 🌐 Ingress Resource (Path-based routing)

---

#  What Is Ingress?

Ingress is a Kubernetes API object that:

* Exposes HTTP/HTTPS routes from outside the cluster
* Routes traffic to different services
* Supports:

  * Host-based routing
  * Path-based routing
  * SSL/TLS termination

Ingress works at **Layer 7 (HTTP level)**.

⚠️ Important:
Ingress alone does nothing. It requires an **Ingress Controller**.

---

#  What Is an Ingress Controller?

An Ingress Controller is a component that:

* Watches Ingress resources
* Configures a reverse proxy (like NGINX)
* Routes traffic to correct services

In this project we use:

## NGINX Ingress Controller

Official GitHub Repository:

[https://github.com/kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx)

---

#  Installing NGINX Ingress Controller

##  For Cloud (AWS / GCP / Azure)

Run:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/cloud/deploy.yaml
```

This will:

* Create `ingress-nginx` namespace
* Deploy controller pods
* Create LoadBalancer service
* Assign external IP

---

##  For Minikube (Local Development)

Option 1:

```bash
minikube addons enable ingress
```

Option 2:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/baremetal/deploy.yaml
```

---

#  Architecture

```
Internet
   ↓
Cloud LoadBalancer
   ↓
NGINX Ingress Controller
   ↓
-----------------------------
|           |               |
nginx-service    apache-service
   ↓               ↓
nginx pods     apache pods
```

---

#  Components in This Setup

## 1️⃣ Nginx Deployment

* 2 replicas
* Exposes port 80
* Service type: ClusterIP

## 2️⃣ Apache Deployment

* 2 replicas
* Exposes port 80
* Service type: ClusterIP

## 3️⃣ Ingress Resource

Routes traffic:

| URL Path  | Service        |
| --------- | -------------- |
| `/nginx`  | nginx-service  |
| `/apache` | apache-service |

---

#  Traffic Flow Example

When user visits:

```
http://your-domain.com/nginx
```

Flow:

```
User
 ↓
LoadBalancer
 ↓
NGINX Ingress Controller
 ↓
nginx-service
 ↓
nginx pod
```

---

#  Why Services Are ClusterIP?

Both services are:

```yaml
type: ClusterIP
```

Reason:

* Only Ingress Controller needs external exposure
* Services are accessed internally
* More secure & scalable

---

#  Ingress YAML Breakdown

## Basic Structure

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
```

Defines an Ingress resource.

---

##  Rewrite Target Annotation

```yaml
nginx.ingress.kubernetes.io/rewrite-target: /
```

If user visits:

```
/nginx
```

Internally rewritten to:

```
/
```

Prevents routing issues inside the container.

---

##  Path-Based Routing

```yaml
- path: /nginx
  pathType: Prefix
```

`Prefix` means:

* `/nginx`
* `/nginx/test`
* `/nginx/anything`

All will match.

---

#  Types of Routing in Ingress

## 1️⃣ Path-Based Routing

```
/nginx  → service A
/apache → service B
```

## 2️⃣ Host-Based Routing

```
nginx.example.com → service A
api.example.com   → service B
```

---

#  Service vs Ingress

| Feature              | Service  | Ingress   |
| -------------------- | -------- | --------- |
| Exposes single app   | ✅        | ❌         |
| Routes multiple apps | ❌        | ✅         |
| Layer                | L4 (TCP) | L7 (HTTP) |
| Routing rules        | ❌        | ✅         |

---

#  How To Check Ingress Controller

```bash
kubectl get pods -n ingress-nginx
```

```bash
kubectl get svc -n ingress-nginx
```

Look for:

```
TYPE: LoadBalancer
```

That’s your public entry point.

---

#  Key Concepts to Remember

* Ingress = Routing configuration
* Ingress Controller = Traffic handler
* Works at Layer 7
* Supports path & host routing
* Requires controller to function
* Usually used with ClusterIP services

---

#  Conclusion

Ingress allows multiple services to be exposed through a single external IP using intelligent routing rules.

It is the standard way to expose HTTP services in production Kubernetes environments.
