# Kubernetes Volumes

**Reference:** https://kubernetes.io/docs/concepts/storage/volumes/

---

# What is a Volume?

In Kubernetes, a **Volume** is a directory that containers inside a **Pod** can access and use as part of their filesystem.

Volumes allow containers to:

- Store data
- Share data
- Persist data

Kubernetes supports many types of volumes such as:

- `emptyDir`
- `ConfigMap`
- `Secret`
- `PersistentVolumeClaim`
- `hostPath`
- Cloud provider storage systems

---

# Why Do We Need Volumes?

Containers are **ephemeral**. When a container restarts, any data stored inside it is lost.

Volumes solve this problem.

---

## 1. Share Data Between Containers

Two containers inside the same **Pod** can share files.

Example:

One container writes data and another container reads the data.

```
Container A  ---> writes file
       |
       v
     Volume
       |
       v
Container B  ---> reads file
```

---

## 2. Persist Application Data

Databases like:

- MongoDB
- MySQL
- PostgreSQL

require **persistent storage**.

Without volumes:

```
Pod Restart → Data Lost
```

With volumes:

```
Pod Restart → Data Still Exists
```

---

## 3. Temporary Storage (Caching)

Sometimes an application needs **temporary storage while running**.

Examples:

- caching
- temporary files
- intermediate processing

If the Pod dies, this data can safely disappear.

---

# Types of Volumes

There are two major categories:

```
Volumes
│
├── Ephemeral Volumes
│
└── Persistent Volumes
```

---

# 1. Ephemeral Volumes

Ephemeral volumes are **temporary volumes**.

- Created when a Pod starts
- Deleted when the Pod is removed

These are useful for **sharing data between containers inside the same Pod**.

Examples:

- `emptyDir`
- `ConfigMap`
- `Secret`

---

# Example: emptyDir Volume

Two containers share a **temporary volume**.

## Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shared-volume-deployment

spec:
  replicas: 1

  selector:
    matchLabels:
      app: shared-volume-app

  template:
    metadata:
      labels:
        app: shared-volume-app

    spec:
      containers:

      - name: writer
        image: busybox
        command: ["/bin/sh", "-c", "echo 'Hello from Writer Pod' > /data/hello.txt; sleep 3600"]
        volumeMounts:
        - name: shared-data
          mountPath: /data

      - name: reader
        image: busybox
        command: ["/bin/sh", "-c", "cat /data/hello.txt; sleep 3600"]
        volumeMounts:
        - name: shared-data
          mountPath: /data

      volumes:
      - name: shared-data
        emptyDir: {}
```

### Apply the manifest

```bash
kubectl apply -f kube.yml
```

### Check the shared data

```bash
kubectl exec -it <pod-name> --container reader sh
```

Inside the container:

```bash
cat /data/hello.txt
```

Output:

```
Hello from Writer Pod
```

---

# 2. Persistent Volumes

A **Persistent Volume (PV)** is storage in the Kubernetes cluster that exists **independently of Pods**.

Even if a Pod is deleted, the **data remains stored**.

Example storage backends:

- NFS
- AWS EBS
- Google Persistent Disk
- Azure Disk
- iSCSI

---

# Persistent Volume (PV)

A **PV** represents actual storage in the cluster.

It contains information like:

- storage capacity
- access mode
- storage type

Example:

```
Cluster Storage
      │
      ▼
Persistent Volume (PV)
```

---

# Persistent Volume Claim (PVC)

A **PVC** is a request for storage made by a user.

Similar to how:

- Pod requests **CPU & Memory**

PVC requests:

- Storage Size
- Access Mode

Example relationship:

```
Pod → PVC → PV
```

---

# Static Persistent Volume

In **static provisioning**, the administrator manually creates the **PV**.

---

## Step 1: Create an NFS Server

Example using Docker:

```yaml
version: '3.7'

services:
  nfs-server:
    image: itsthenetwork/nfs-server-alpine:latest
    container_name: nfs-server
    privileged: true

    environment:
      SHARED_DIRECTORY: /exports

    volumes:
      - ./data:/exports:rw

    ports:
      - "2049:2049"

    restart: unless-stopped
```

Important:

- Port **2049** must be open.

---

## Step 2: Create PV and PVC

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv

spec:
  capacity:
    storage: 10Gi

  accessModes:
    - ReadWriteMany

  storageClassName: nfs

  nfs:
    path: /exports
    server: 52.66.197.168
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-pvc

spec:
  accessModes:
    - ReadWriteMany

  resources:
    requests:
      storage: 10Gi

  storageClassName: nfs
```

---

## Step 3: Create a Pod Using PVC

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mongo-pod

spec:
  containers:
  - name: mongo
    image: mongo:4.4
    command: ["mongod", "--bind_ip_all"]

    ports:
    - containerPort: 27017

    volumeMounts:
    - mountPath: "/data/db"
      name: nfs-volume

  volumes:
  - name: nfs-volume
    persistentVolumeClaim:
      claimName: nfs-pvc
```

---

# Test Data Persistence

Insert some data:

```bash
kubectl exec -it mongo-pod -- mongo
```

Inside MongoDB:

```javascript
use mydb

db.mycollection.insert({
  name: "Test",
  value: "This is a test"
})
```

Exit MongoDB.

---

## Restart the Pod

```bash
kubectl delete pod mongo-pod
kubectl apply -f mongo.yml
```

Check if data still exists:

```bash
kubectl exec -it mongo-pod -- mongo

use mydb
db.mycollection.find()
```

You will see the inserted data, meaning **storage persisted**.

---

# Dynamic Persistent Volumes

Instead of manually creating PVs, Kubernetes can create them automatically.

This is called **dynamic provisioning**.

It uses **Storage Classes**.

---

## Example PVC (Dynamic Provisioning)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: csi-pvc

spec:
  accessModes:
    - ReadWriteOnce

  resources:
    requests:
      storage: 40Gi

  storageClassName: vultr-block-storage-hdd
```

---

## Pod Using Dynamic PVC

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mongo-pod

spec:
  containers:
  - name: mongo
    image: mongo:4.4
    command: ["mongod", "--bind_ip_all"]

    ports:
    - containerPort: 27017

    volumeMounts:
    - name: mongo-storage
      mountPath: /data/db

  volumes:
  - name: mongo-storage
    persistentVolumeClaim:
      claimName: csi-pvc
```

---

# Check Resources

```bash
kubectl get pv
kubectl get pvc
kubectl get pods
```

---

# Summary

| Concept | Description |
|-------|-------------|
| Volume | Storage mounted inside a container |
| Ephemeral Volume | Temporary storage removed when Pod dies |
| Persistent Volume (PV) | Cluster storage resource |
| Persistent Volume Claim (PVC) | Request for storage |
| Static Provisioning | Admin manually creates PV |
| Dynamic Provisioning | Kubernetes automatically creates PV |




# harkirat notes
https://projects.100xdevs.com/tracks/kubernetes-part-2/k8s-3-5