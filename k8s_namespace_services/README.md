
# Kubernetes: Namespaces & Services



---

## 1. Namespace in Kubernetes

### What is a Namespace?
A **Namespace** is a logical separation inside a Kubernetes cluster.
It helps you **organize**, **isolate**, and **manage** resources.

Think of a namespace like a *folder* inside your cluster.

---

### Why use Namespaces?
Namespaces are useful when:
- Multiple teams use the same cluster
- You want isolation between environments (dev / test / prod)
- You want better access control and resource limits

---

### Example from your YAML
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: backend-team
```

This creates a namespace called **backend-team**.

All resources created with:
```yaml
namespace: backend-team
```
will live **only inside this namespace**.

---

### Important Points about Namespaces
- Namespaces are **cluster-wide**, but resources inside them are isolated
- Some resources are **NOT namespaced**:
  - Nodes
  - PersistentVolumes
  - Namespaces themselves
- Default namespaces:
  - `default`
  - `kube-system`
  - `kube-public`

---

### How Services work across Namespaces
To access a service from another namespace, use:

```
<service-name>.<namespace>.svc.cluster.local
```

Example:
```
node-backend-service.backend-team.svc.cluster.local
```

---

## 2. Service in Kubernetes

### What is a Service?
A **Service** is a stable network endpoint to access Pods.

Pods:
- are temporary
- have changing IPs

Services:
- provide **stable DNS + IP**
- load balance traffic to Pods

---

### Why Services are Needed
Without services:
- You cannot reliably connect to Pods
- Pod restarts break connections

With services:
- Traffic is automatically load-balanced
- Pods can scale up/down safely

---

## Types of Services

### 1. ClusterIP (Internal Access)
- Default service type
- Accessible **only inside the cluster**

Example:
```yaml
spec:
  type: ClusterIP
```

Used by:
- Frontend → Backend
- Ingress → Backend

---

### 2. NodePort
- Exposes service on a static port on each node
- Mostly for testing

---

### 3. LoadBalancer
- Exposes service externally using cloud load balancer
- Used for public access

Example from your YAML:
```yaml
spec:
  type: LoadBalancer
```

---

## Service Example (Backend)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: node-backend-service
  namespace: backend-team
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 3000
```

### How this works:
- Service listens on **port 80**
- Forwards traffic to container **port 3000**
- Selects Pods with label `app: backend`
- Load balances traffic between backend Pods

---

## Service Example (Frontend)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
```

- Frontend Pods exposed internally
- Used by NGINX reverse proxy

---

## Real Flow in Your Architecture

```
User
  ↓
LoadBalancer Service (manual-nginx-service)
  ↓
NGINX Pod
  ↓
┌───────────────┬──────────────────┐
│ /frontend     │ / (default)      │
│ frontend svc  │ backend svc      │
└───────────────┴──────────────────┘
```

- NGINX routes traffic using **Services**
- Backend service is accessed across namespace
- Frontend service is in default namespace

---

## Key Takeaways

### Namespace
- Logical isolation
- Same cluster, different environments/teams
- DNS requires namespace name

### Service
- Stable network access to Pods
- Load balancing built-in
- Decouples Pods from consumers

---

## One-Line Summary
> **Namespace organizes resources, Service connects them reliably.**