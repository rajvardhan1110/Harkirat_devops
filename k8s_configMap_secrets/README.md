
# ConfigMaps

## What is a ConfigMap?

A **ConfigMap** is a Kubernetes API object used to store **non-confidential configuration data** in key-value pairs.

It helps you:

* Separate configuration from application code
* Make container images reusable across environments
* Change configuration without rebuilding images

ConfigMaps can be consumed by Pods as:

* Environment variables
* Command-line arguments
* Configuration files (mounted as volumes)

---

##  Creating a ConfigMap

### Example Manifest

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ecom-backend-config
data:
  database_url: "mysql://ecom-db:3306/shop"
  cache_size: "1000"
  payment_gateway_url: "https://payment-gateway.example.com"
  max_cart_items: "50"
  session_timeout: "3600"
```

Apply it:

```bash
kubectl apply -f cm.yml
```

View it:

```bash
kubectl describe configmap ecom-backend-config
```

---

##  Using ConfigMap in a Deployment (Environment Variables)

```yaml
env:
- name: DATABASE_URL
  valueFrom:
    configMapKeyRef:
      name: ecom-backend-config
      key: database_url
```

This injects the value from ConfigMap into the container as an environment variable.

---

##  Why ConfigMaps Are Important

Without ConfigMaps:

❌ You hardcode values inside application code
❌ Need to rebuild Docker image for config change

With ConfigMaps:

✅ Change configuration without rebuilding image
✅ Different configs for dev / staging / prod
✅ Clean separation of concerns

---

# Secrets

## What is a Secret?

A **Secret** is a Kubernetes API object used to store **sensitive data** such as:

* Passwords
* API keys
* Database credentials
* TLS certificates

Secrets prevent confidential data from being stored directly in application code.

---

##  Creating a Secret

⚠️ Secret values must be **base64 encoded**.

Example:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
data:
  username: YWRtaW4=   # 'admin'
  password: cGFzc3dvcmQ=  # 'password'
```

Apply it:

```bash
kubectl apply -f secret.yml
```

---

##  Why Base64 Encoding?

* Provides a standard format for storing data
* Supports binary content (like TLS certificates)
* NOT true encryption

Important:

Base64 can be decoded easily.
It is encoding — not encryption.

---

##  Using Secret as Environment Variables

```yaml
env:
- name: USERNAME
  valueFrom:
    secretKeyRef:
      name: my-secret
      key: username
```

This injects secret values as environment variables inside the container.

---

##  Using Secret as Volume (Mount as File)

```yaml
volumes:
- name: env-file
  secret:
    secretName: dotfile-secret
```

Mounted inside container:

```yaml
volumeMounts:
- name: env-file
  mountPath: "/etc/secret-volume"
```

The secret becomes a file inside the container.

---

#  ConfigMap vs Secret

| Feature  | ConfigMap          | Secret                 |
| -------- | ------------------ | ---------------------- |
| Used for | Non-sensitive data | Sensitive data         |
| Encoding | Plain text         | Base64 encoded         |
| Security | Not secure         | Slightly safer storage |
| Example  | URLs, limits       | Passwords, API keys    |

---

#  Best Practices

✅ Use ConfigMaps for non-sensitive configuration
✅ Use Secrets for credentials
✅ Never hardcode secrets in Docker images
✅ Use RBAC to restrict secret access
✅ Rotate secrets periodically

---

#  Final Architecture Concept

```
Application Container
        ↓
Reads ConfigMap → Non-sensitive config
Reads Secret     → Sensitive credentials
```

This ensures:

* Clean architecture
* Secure deployments
* Environment flexibility


