# Kubernetes 

## ReplicaSet Fundamentals

### What is a ReplicaSet?
**Definition:**
- Controller that maintains a stable set of identical Pod replicas
- Ensures that a specified number of Pods are running at all times
- Creates/deletes Pods to match desired state

**Core Responsibility:**
- "Keep exactly N copies of this Pod running"
- If a Pod fails → ReplicaSet creates a new one
- If too many Pods → ReplicaSet deletes extra ones
- Watches Pods using label selectors (not ownership initially)

**Key Point:** ReplicaSet DOES NOT handle application updates. It only maintains desired replica count.

---

### ReplicaSet Architecture

```
┌─────────────────────────────────────┐
│     ReplicaSet Controller           │
│   (in kube-controller-manager)      │
└─────────────────────────────────────┘
              ↓
  Watches Pods with matching labels
              ↓
  ┌──────────┬──────────┬──────────┐
  ↓          ↓          ↓          ↓
┌────┐    ┌────┐    ┌────┐   [Empty slot]
│Pod1│    │Pod2│    │Pod3│   - If one dies, 
│    │    │    │    │    │   create new
│    │    │    │    │    │
└────┘    └────┘    └────┘
  app:    app:     app:
  web     web      web
```

---

### ReplicaSet YAML Structure

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: webapp-rs
  namespace: default
spec:
  replicas: 3                    # ← Desired number of Pods
  selector:                      # ← Label selector (critical!)
    matchLabels:
      app: webapp
      tier: frontend
  template:                      # ← Pod template (blueprint)
    metadata:
      labels:
        app: webapp
        tier: frontend
        version: v1
    spec:
      containers:
      - name: webapp
        image: nginx:1.14.2
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

**Key Sections:**
1. **replicas**: Target number of Pods to maintain
2. **selector**: Identifies which Pods belong to this ReplicaSet (uses matchLabels or matchExpressions)
3. **template**: Pod specification used to create new Pods

---

### Label Selectors (How ReplicaSet Finds Pods)

**matchLabels (Simple):**
```yaml
selector:
  matchLabels:
    app: webapp
    tier: frontend
```
Matches Pods with BOTH labels (AND logic)


---

### ReplicaSet Lifecycle

**1. Creation:**
```bash
kubectl apply -f replicaset.yaml
# → API Server validates → etcd stores config
# → ReplicaSet controller sees new RS
# → Counts Pods with matching labels
# → Currently 0 Pods → Creates 3 new Pods
```

**2. Running State:**
```bash
kubectl get rs
# NAME        DESIRED   CURRENT   READY   AGE
# webapp-rs   3         3         3       2m
# DESIRED = 3 (spec.replicas)
# CURRENT = 3 (actually running)
# READY = 3 (passed readiness probe)
```

**3. Scaling Up:**
```bash
kubectl scale rs webapp-rs --replicas=5
# ReplicaSet controller sees mismatch (desired 5, current 3)
# Creates 2 new Pods
```

**4. Pod Failure:**
```
One Pod crashes
  ↓
Kubelet detects failure
  ↓
Reports to API Server
  ↓
ReplicaSet controller sees 2 Pods (desired 3)
  ↓
Creates replacement Pod
```

**5. Deletion:**
```bash
kubectl delete rs webapp-rs
# By default, also deletes dependent Pods
# To keep Pods: kubectl delete rs webapp-rs --cascade=orphan
```

---

### Common ReplicaSet Commands

```bash
# View ReplicaSets
kubectl get rs
kubectl get rs -o wide
kubectl describe rs webapp-rs

# Scaling
kubectl scale rs webapp-rs --replicas=5
kubectl scale rs webapp-rs --replicas=1

# Logs from all Pods
kubectl logs -f rs/webapp-rs

# Edit ReplicaSet
kubectl edit rs webapp-rs
# Edit template.spec.containers[0].image
# Save → Does NOT update running Pods (need delete + recreate)

# Delete ReplicaSet
kubectl delete rs webapp-rs
kubectl delete rs webapp-rs --cascade=orphan  # Keep Pods
```

---

## Deployment - Higher-Level Abstraction

### What is a Deployment?

**Definition:**
- Higher-level controller that manages ReplicaSets
- Enables declarative application updates
- Handles rolling updates, rollbacks, and revision history
- Recommended way to deploy stateless applications

**Deployment ↔ ReplicaSet ↔ Pods hierarchy:**
```
┌──────────────────────────┐
│   Deployment (You create)│
│  "I want 3 nginx:1.14"   │
└──────────────────────────┘
           ↓
    ┌──────────────────────────────┐
    │  ReplicaSet (Auto-created)   │
    │  "Maintain 3 Pods of v1.14"  │
    └──────────────────────────────┘
           ↓
    ┌────────┬────────┬────────┐
    ↓        ↓        ↓        ↓
  ┌───┐   ┌───┐   ┌───┐
  │Pod│   │Pod│   │Pod│  (You don't create these)
  └───┘   └───┘   └───┘
```

**Key Advantage:** When you update image, Deployment creates NEW ReplicaSet (keeping old one) and gradually shifts traffic.

---

### Deployment YAML Structure

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-deploy
  namespace: default
  labels:
    app: webapp
spec:
  replicas: 3                    # ← Pod replica count
  strategy:                      # ← Update strategy (CRITICAL)
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                # Max extra Pods during update
      maxUnavailable: 0          # Max Pods allowed down
  selector:
    matchLabels:
      app: webapp
  template:                      # ← Same as ReplicaSet template
    metadata:
      labels:
        app: webapp
        version: v1
    spec:
      containers:
      - name: webapp
        image: nginx:1.14.2      # ← Update this to trigger update
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

**New Sections vs ReplicaSet:**
- **strategy**: How to perform updates (RollingUpdate, Recreate)
- **livenessProbe**: Is Pod alive? (restart if fails)
- **readinessProbe**: Is Pod ready for traffic? (remove from Service if fails)

---

### Deployment Update Strategies

**Strategy Type 1: RollingUpdate (DEFAULT - RECOMMENDED)**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1                # Allow 1 extra Pod (4 total, target 3)
    maxUnavailable: 0          # Allow 0 Pods down (always 3 running)
```

**Process:**
```
Initial:    [Pod-v1] [Pod-v1] [Pod-v1]  (3 replicas)

Step 1:     [Pod-v1] [Pod-v1] [Pod-v2]  (1 new, 2 old)
Step 2:     [Pod-v1] [Pod-v2] [Pod-v2]  (2 new, 1 old)
Step 3:     [Pod-v2] [Pod-v2] [Pod-v2]  (3 new, 0 old) ✓ Complete

→ Zero downtime
→ Immediate rollback possible (old RS still exists)
```

**Strategy Type 2: Recreate**
```yaml
strategy:
  type: Recreate
```

**Process:**
```
Initial:    [Pod-v1] [Pod-v1] [Pod-v1]

Recreate:   [DELETE] [DELETE] [DELETE]   (downtime here!)

After:      [Pod-v2] [Pod-v2] [Pod-v2]

→ Downtime during update
→ Faster than rolling (all at once)
→ Use for: Development, one-off tasks
```

---

### Rolling Update Parameters

**maxSurge: Exceeding desired replicas**
```yaml
replicas: 3
maxSurge: 1      # Can temporarily have 3 + 1 = 4 Pods
```
Values:
- `1` = 1 extra Pod
- `25%` = 25% of replicas (3 × 0.25 = 1)
- `0` = Exactly replicas count (no temporary increase)

**maxUnavailable: Pods allowed down**
```yaml
replicas: 3
maxUnavailable: 1    # Can have as few as 3 - 1 = 2 Pods
```
Values:
- `1` = 1 Pod can be down
- `50%` = 50% of replicas down
- `0` = Always maintain full replicas (requires CPU budget)

**Example Scenario:**
```yaml
replicas: 5
maxSurge: 2
maxUnavailable: 1
```
→ Update can have 5 + 2 = 7 Pods temporarily
→ Can go down to 5 - 1 = 4 Pods
→ More aggressive update = faster rollout, more resource usage

---

### Deployment Lifecycle

**1. Creation:**
```bash
kubectl apply -f deployment.yaml

# Behind the scenes:
# ✓ Deployment created
# ✓ New ReplicaSet created (name: webapp-deploy-<hash>)
# ✓ ReplicaSet creates 3 Pods
```

**2. Status Check:**
```bash
kubectl get deploy
# NAME            READY   UP-TO-DATE   AVAILABLE   AGE
# webapp-deploy   3/3     3            3           2m

kubectl get rs
# NAME                    DESIRED   CURRENT   READY   AGE
# webapp-deploy-abc123    3         3         3       2m

kubectl get pods
# NAME                              READY   STATUS    RESTARTS   AGE
# webapp-deploy-abc123-xyz789       1/1     Running   0          2m
# webapp-deploy-abc123-uvw456       1/1     Running   0          2m
# webapp-deploy-abc123-rst012       1/1     Running   0          2m
```

**3. Update (Image Change):**
```bash
kubectl set image deployment/webapp-deploy webapp=nginx:1.16.0

# OR edit directly:
kubectl edit deployment webapp-deploy
# Change .spec.template.spec.containers[0].image = nginx:1.16.0
# Save and exit → Deployment detects change → Rolling update starts
```

**4. Rolling Update in Progress:**
```bash
kubectl get deploy
# NAME            READY   UP-TO-DATE   AVAILABLE   AGE
# webapp-deploy   4/5     2            4           3m
# 4 available (some v1, some v2)
# 2 up-to-date (v1.16.0)
# 5 desired
```

**Watch progress:**
```bash
kubectl rollout status deployment/webapp-deploy
# Waiting for deployment "webapp-deploy" to successfully roll out...
# deployment "webapp-deploy" successfully rolled out
```

**5. After Update Complete:**
```bash
kubectl get rs
# NAME                    DESIRED   CURRENT   READY   AGE
# webapp-deploy-abc123    0         0         0       5m  ← Old RS (scaled down)
# webapp-deploy-def456    3         3         3       2m  ← New RS (active)

# View revision history:
kubectl rollout history deployment/webapp-deploy
# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         <none>
```

---

### Rollback - Key Advantage of Deployment

**Scenario:** Update goes wrong (memory leak in new version)

```bash
# See what happened:
kubectl rollout history deployment/webapp-deploy
# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         <none>
# 3         <none>

# Rollback to previous:
kubectl rollout undo deployment/webapp-deploy
# deployment.apps/webapp-deploy rolled back

# Behind scenes:
# ✓ Old ReplicaSet (v2) scaled back up
# ✓ New ReplicaSet (v3) scaled down
# ✓ Pods gradually replaced

# Rollback to specific revision:
kubectl rollout undo deployment/webapp-deploy --to-revision=1
```

**Deployment ReplicaSets are Saved:**
```
After Rev1: webapp-deploy-abc123  (3 Pods) → Created for v1
After Rev2: webapp-deploy-def456  (3 Pods) → Created for v1.16
   Old:     webapp-deploy-abc123  (0 Pods) → Scaled down (kept for history)
After Rev3: webapp-deploy-ghi789  (3 Pods) → Created for v1.17
   Old:     webapp-deploy-def456  (0 Pods) → Scaled down

Undo from 3: Scale up def456, scale down ghi789 → Back to v1.16!
```

**Revision History Retention:**
```yaml
spec:
  revisionHistoryLimit: 10  # Keep last 10 ReplicaSets (default)
```

---

## ReplicaSet vs Deployment - Comprehensive Comparison

| Aspect | ReplicaSet | Deployment |
|--------|-----------|-----------|
| **Purpose** | Maintain Pod count | Manage updates + Pod count |
| **Direct Usage** | Rarely (managed by Deployment) | Primary way to deploy apps |
| **Update Handling** | Manual (scale old down, new up) | Automatic rolling updates |
| **Rollback Support** | Not built-in (manual process) | `kubectl rollout undo` |
| **Revision History** | Only current state | Keeps all ReplicaSets (configurable) |
| **Update Strategy** | N/A | RollingUpdate, Recreate |
| **Downtime on Update** | Yes (if manual replacement) | No (with RollingUpdate) |
| **Use Case** | Rarely direct | Stateless apps (web servers, APIs) |
| **Pod Replacement** | Yes (on failure) | Yes (on failure) |
| **Ownership Chain** | Owns Pods directly | Owns ReplicaSets → Pods |

---

## ReplicaSet Ownership & Adoption

**Important Concept:** ReplicaSets don't "own" Pods initially; they adopt them via selectors

```bash
# Create Pod with label
kubectl run test-pod --image=nginx --labels="app=webapp"

# Create ReplicaSet with matching selector
kubectl apply -f replicaset.yaml
# ReplicaSet selector: app=webapp

# Result:
kubectl get pods
# NAME              LABELS
# test-pod          app=webapp    ← Adopted by RS
# replicaset-12345  app=webapp    ← Created by RS

# ReplicaSet sees 2 Pods (desired 3)
# Creates 1 more Pod
```

**Pod Ownership Markers:**
```bash
kubectl describe pod test-pod | grep ownerReferences
# ownerReferences:
#   - apiVersion: apps/v1
#     kind: ReplicaSet
#     name: webapp-rs
#     uid: <uid>
```

---

## Common Deployment Patterns

### Pattern 1: Canary Deployment (Manual)
```yaml
# Deploy v2 with 1 replica
replicas: 1
# Old v1 still running (multiple replicas)
# Route 10% traffic to v2 (via Service with weighted logic)
# Monitor for errors
# If good: gradual rollout
```

### Pattern 2: Blue-Green Deployment
```yaml
# Keep two full deployments
# Deployment-blue: v1.0 (3 replicas) - receiving traffic
# Deployment-green: v2.0 (3 replicas) - warming up
# Switch Service selector from blue → green
# If issues: switch back (no rolling update needed)
```

### Pattern 3: Staged Rollout
```yaml
maxSurge: 1
maxUnavailable: 0
# Slow, controlled update
# Each Pod replaces one-by-one
# Less resource spike, more time to detect issues
```

---

## Practical Examples

### Deploy and Update

```bash
# 1. Create initial deployment
kubectl apply -f deployment.yaml

# 2. Check status
kubectl get deploy -w  # Watch mode

# 3. Scale up
kubectl scale deploy webapp-deploy --replicas=5

# 4. Update image
kubectl set image deployment/webapp-deploy \
  webapp=nginx:1.17.0 \
  --record  # Record in rollout history

# 5. Watch update
kubectl rollout status deployment/webapp-deploy

# 6. Check history
kubectl rollout history deployment/webapp-deploy

# 7. Rollback if needed
kubectl rollout undo deployment/webapp-deploy
```

### ReplicaSet Only (Direct Usage - Rare)

```bash
# Create ReplicaSet
kubectl apply -f replicaset.yaml

# Check pods
kubectl get pods -l app=webapp

# Manual scaling (you do it, not controller if desired replicas mismatch)
kubectl scale rs webapp-rs --replicas=2

# Note: No history tracking, no automatic rollback
```

---

## Interview Expected Knowledge

### ReplicaSet
✓ What is it? → Maintains N copies of Pod
✓ How does it find Pods? → Label selectors (matchLabels, matchExpressions)
✓ What happens on Pod failure? → Creates replacement
✓ Manual update process? → Change image in template, delete old Pods (they restart with new image)
✓ When use directly? → Almost never (use Deployment instead)

### Deployment
✓ What is it? → Higher-level manager of ReplicaSets
✓ Advantages? → Automatic rolling updates, rollback, revision history
✓ Rolling update process? → Progressive Pod replacement (maxSurge, maxUnavailable)
✓ Rollback how? → `kubectl rollout undo`
✓ Revision history? → Keeps old ReplicaSets (configurable with revisionHistoryLimit)
✓ Update strategies? → RollingUpdate (default) vs Recreate

### Tricky Questions
- **Q:** "What happens when you change Pod template in ReplicaSet?"  
  **A:** Running Pods NOT affected. Only NEW Pods get new template. Need manual recreation.

- **Q:** "What happens with Deployment image change?"  
  **A:** New ReplicaSet created. Rolling update. Old Pods gradually replaced. Old RS kept for history.

- **Q:** "Can ReplicaSet own Pods created before it?"  
  **A:** Yes! If labels match selector, RS adopts them.

- **Q:** "How many ReplicaSets in a Deployment?"  
  **A:** Multiple (one per update). Kept for history (default: 10). Only one active (non-zero replicas).

---

## Hands-On Practice Commands

```bash
# Create and manage Deployments
kubectl create deployment nginx --image=nginx:1.14.0 --replicas=3
kubectl get deploy
kubectl describe deploy nginx
kubectl logs deploy/nginx

# Update
kubectl set image deploy/nginx nginx=nginx:1.16.0
kubectl rollout status deploy/nginx

# Rollback
kubectl rollout history deploy/nginx
kubectl rollout undo deploy/nginx --to-revision=1

# ReplicaSet inspection
kubectl get rs -l app=nginx
kubectl describe rs <rs-name>
kubectl delete rs <rs-name> --cascade=orphan

# Scaling
kubectl scale deploy nginx --replicas=5
kubectl autoscale deploy nginx --min=2 --max=10 --cpu-percent=80
```

---

## Key Takeaways

### ReplicaSet
- **Purpose:** Maintain desired number of identical Pods
- **Mechanism:** Label selectors to find and adopt Pods
- **Update:** Manual (change template → delete old Pods → new ones created)
- **Usage:** Rarely direct; managed by Deployments
- **Good for:** When you only need scaling, no updates

### Deployment
- **Purpose:** Manage ReplicaSets for declarative application updates
- **Mechanism:** Creates new RS on update, gradually shifts traffic
- **Update:** Automatic rolling update (no manual Pod recreation)
- **Rollback:** Built-in via old ReplicaSets
- **Usage:** Standard way to deploy stateless apps in production

### Mental Model
**ReplicaSet:** "Keep this many Pods running"  
**Deployment:** "Keep this many Pods running AND update them smoothly"
