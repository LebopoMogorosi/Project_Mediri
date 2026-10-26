# MEDIRI API

The Express API is available at `http://localhost:4000/api` during local development. JSON requests use `Content-Type: application/json`. Protected requests require `Authorization: Bearer <token>`. Login issues an eight-hour JWT; the API validates its signature before applying role-based permissions.

## Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Validate email and password; return a JWT and user profile. |
| `GET` | `/auth/demo-accounts` | Public | Return demo account names, emails and roles (never passwords or hashes). |
| `GET` | `/auth/me` | Signed-in user | Return the caller’s profile. |
| `GET` | `/health` | Public | Service health response. |

Login request:

```json
{ "email": "patient@mediri.co.bw", "password": "Password123" }
```

Successful login response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Boitumelo Motsumi",
    "email": "patient@mediri.co.bw",
    "role": "Patient",
    "city": "Gaborone"
  }
}
```

## Care operations

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/dashboard` | Signed-in user | Summary metrics; patient prescription/order counts are scoped to their own account. |
| `GET` | `/prescriptions` | Signed-in user | List recent prescriptions; patients only receive their own records. |
| `POST` | `/prescriptions` | Patient | Multipart prescription intake. Fields: `prescription` (JPEG/PNG/PDF, max 10 MB), `pharmacyId`, `medication`, optional `dosage`, `address`, `notes`. Creates a prescription, pending order and delivery record in a transaction. |
| `PATCH` | `/prescriptions/:id/status` | Doctor, Pharmacist, Administrator | Set `status` to `Approved`, `Rejected` or `Medication Prepared`; optional `notes`. |
| `PATCH` | `/prescriptions/:id/notes` | Doctor, Pharmacist, Administrator | Save review notes without changing the prescription status. |
| `GET` | `/orders` | Signed-in user | List recent orders; patient results are scoped to their account. |
| `GET` | `/deliveries` | Delivery Agent, Pharmacist, Administrator | List assigned delivery work; delivery agents only receive their own assignments. |
| `GET` | `/delivery-agents` | Pharmacist, Administrator | List active delivery agents and availability. |
| `PATCH` | `/deliveries/:id/status` | Assigned Delivery Agent, Administrator | Advance through `Accepted`, `Out for Delivery` and `Delivered`; pharmacy preparation is required before acceptance. Agents may update only their assigned deliveries. |
| `PATCH` | `/deliveries/:id/assign` | Pharmacist, Administrator | Assign a pending delivery to an available agent using `{ "agentId": 8 }`. |
| `GET` | `/pharmacies` | Signed-in user | List active pharmacies. |
| `GET` | `/reminders` | Patient, Doctor, Pharmacist, Administrator | List a patient’s medication reminders. Patients are automatically scoped to themselves; privileged callers must provide `?patientId=`. |
| `GET` | `/analytics` | Administrator, Doctor, Pharmacist | Return monthly series, city/medication demand, totals, forecast demo values and patient segments. |

## Roles

| Role | Intended access |
| --- | --- |
| Patient | Own care dashboard, prescription submission, orders and reminders. |
| Doctor | Prescription review actions and operational/research summaries. |
| Pharmacist | Prescription review/preparation, pharmacy and delivery assignment operations. |
| Delivery Agent | Update only deliveries assigned to the authenticated agent. |
| Administrator | Platform operations, assignment and research analytics. |

## Errors

Errors return a JSON object such as `{ "error": "Authentication required." }`. The API uses `400` for invalid input, `401` for missing/invalid credentials, `403` for role or ownership violations, `404` for missing records, `413` for oversized uploads, `415` for unsupported prescription file types and `500` for unexpected server failures.

## Security and scope

The API hashes seeded and submitted passwords with bcryptjs, stores prescription files under `uploads/`, checks upload MIME type and size, applies role guards and uses parameterized SQLite statements. For a real healthcare deployment, add a managed secrets store, HTTPS, durable encrypted file storage, audit/access logs, backup/recovery, consent and retention rules, malware scanning, clinician/pharmacist licensing verification, robust rate limiting and a formal Botswana privacy/regulatory review. Demo data and the UI mock interactions are not production clinical workflows.
