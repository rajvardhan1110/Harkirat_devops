# Kubernetes Part 1 

## Kubernetes Overview
**Key Concepts:**
- What is Kubernetes?
  - Container orchestration engine
  - Automates deployment, scaling, and management of containerized applications
  - Open-source project originally developed by Google
  
**Why Kubernetes?**
- Automatic scheduling and resource allocation
- Self-healing (auto-restart failed containers)
- Horizontal scaling
- Rolling updates without downtime
- Load balancing

**Prerequisites:**
- Understanding of Docker and containers
- Familiarity with Linux/command line
- Basic networking concepts

---

## Evolution of Container Management
**Evolution:**
1. **Single Server Era** → Manual deployment, hard to scale
2. **Multiple Servers** → Docker created, but management was manual
3. **Container Orchestration Need** → Kubernetes solves:
   - Where to place containers?
   - How to scale containers?
   - What happens when a container fails?
   - Load balancing between containers
   - Rolling updates

**Real-world Problems Kubernetes Solves:**
- Container placement optimization
- Resource utilization
- High availability
- Disaster recovery

---

## Kubernetes Architecture Overview 
**High-Level Components:**

```
┌─────────────────────────────────────────┐
│         CONTROL PLANE (Master)          │
│  - API Server                           │
│  - Scheduler                            │
│  - Controller Manager                   │
│  - etcd (State Store)                   │
└─────────────────────────────────────────┘
              ↓    ↓    ↓
    ┌──────────┴────┴────┴──────────┐
    │    WORKER NODES (Compute)     │
    │  ┌─────────┐  ┌─────────┐     │
    │  │Node 1   │  │Node 2   │ ... │
    │  │(Pods)   │  │(Pods)   │     │
    │  └─────────┘  └─────────┘     │
    └──────────────────────────────┘
```

**Key Distinction:**
- **Control Plane** = Brain (decision maker, state management)
- **Worker Nodes** = Workers (actual execution)

---

## Master Node (Control Plane) Components 
**API Server:**
- Entry point for all kubectl commands
- RESTful interface for cluster management
- Validates and processes requests
- Gateway between user and cluster

**Scheduler (Kube-Scheduler):**
- Watches for newly created Pods without assigned nodes
- Selects best node for Pod placement based on:
  - Resource requirements (CPU, Memory)
  - Node capacity
  - Affinity/Anti-affinity rules
  - Taints and tolerations

**Analogy:** Scheduler = Restaurant host deciding which table to seat customers


**Controller Manager (kube-controller-manager):**
- Runs multiple controller processes
- Watches cluster state and responds to changes
- Key controllers:
  - **ReplicaSet Controller** - Maintains desired number of Pod replicas
  - **Deployment Controller** - Manages rolling updates
  - **Service Controller** - Manages load balancing
  - **Node Controller** - Monitors node health

**etcd (State Store):**
- Distributed key-value database
- Single source of truth for cluster state
- Stores:
  - Pod configurations
  - Node information
  - ReplicaSets, Deployments
  - Secrets, ConfigMaps
  - All cluster metadata

**Critical:** Loss of etcd = loss of cluster state

---

##  Worker Node Components
**Kubelet:**
- Agent running on every worker node
- Ensures containers run in Pods as specified
- Communicates with Control Plane API Server
- Mounts volumes, starts containers
- Reports node and Pod status back to API Server

**Container Runtime:**
- Docker, containerd, CRI-O, etc.
- Actually runs and manages containers

**kube-proxy:**
- Network proxy running on each node
- Maintains network rules
- Enables Pod-to-Pod communication across nodes
- Implements Services (load balancing)

**Analogy:** 
- Kubelet = Supervisor on factory floor
- kube-proxy = Internal communication system

---

## Pod Concept (Fundamental Unit)
**What is a Pod?**
- Smallest deployable unit in Kubernetes
- Wrapper around one or more containers
- Usually one container per Pod (but can have multiple)
- Containers in a Pod share:
  - Network namespace (same IP address)
  - Storage volumes
  - Other specifications (labels, environment variables)

**Pod Characteristics:**
- **Ephemeral**: Pods are temporary, can be created and destroyed frequently
- **Atomic Unit**: You don't deploy containers; you deploy Pods
- **Immutable**: Can't modify running Pod directly (must delete and recreate)

**Single-Container vs Multi-Container Pods:**
- **Single-Container Pod** (most common): One app container
- **Multi-Container Pod** (special cases): Main app + logging sidecar, or main app + observability agent

**Important:** Pods are not directly created by users in production; they're created by Controllers (ReplicaSets, Deployments)

---

## Pod Networking & Communication
**Within a Pod (Localhost):**
- Containers share network interface
- Communicate via localhost:port
- Example: App on :3000 talks to DB on :5432 via localhost:5432

**Pod-to-Pod Communication (Same Node):**
- Each Pod has unique IP address (CNI plugin assigns)
- Pods communicate directly via their IPs
- kube-proxy handles routing

**Pod-to-Pod Communication (Different Nodes):**
- Network plugin (Flannel, Calico, Weave, etc.) creates overlay network
- Pods behave as if on same flat network regardless of physical location
- Transparent to applications

**DNS in Kubernetes:**
- Each Pod gets DNS entry: `pod-name.namespace.pod.cluster.local`
- Services also get DNS: `service-name.namespace.svc.cluster.local`
- Applications can discover each other by service name

---

##  Pod Lifecycle & States
**Pod States:**

1. **Pending**
   - Pod created but not yet scheduled
   - Scheduler finding suitable node
   - Image pull in progress

2. **Running**
   - Containers successfully started
   - At least one container is running

3. **Succeeded**
   - All containers terminated successfully
   - Pods that ran to completion (jobs, one-time tasks)

4. **Failed**
   - One or more containers terminated with non-zero exit code
   - Pod won't restart automatically

5. **Unknown**
   - Status couldn't be determined (communication lost with node)

**Pod Restart Policy:**
- **Always** (default): Restart containers on failure (suitable for services)
- **OnFailure**: Restart only on non-zero exit code (suitable for jobs)
- **Never**: Never restart containers

**Container Restart Mechanism:**
- kubelet monitors running containers
- On failure, kubelet restarts container on same node
- Note: Pod IP remains same during container restart

---

## Key Takeaways 

### Architecture Understanding
✓ Control Plane (master) makes decisions
✓ Worker Nodes execute decisions
✓ Each component has specific responsibility

### Pod Fundamentals
✓ Pod = smallest unit = usually 1 container
✓ Pods are ephemeral and replaceable
✓ Pods have IP addresses for networking

### Kubernetes Philosophy
✓ Declarative (tell what you want, not how)
✓ Self-healing (auto-restart, auto-reschedule)
✓ Distributed (multi-node coordination)


---

## Important Commands to Know Early

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes

# Pod operations
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl exec -it <pod-name> -- /bin/bash
kubectl port-forward <pod-name> 8080:8080

# Create resources
kubectl create -f <file.yaml>
kubectl apply -f <file.yaml>

# Delete resources
kubectl delete pod <pod-name>
kubectl delete -f <file.yaml>
```

---

