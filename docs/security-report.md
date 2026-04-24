# Security Assessment Report

## UNCW Room & Equipment Booking System

---

## Executive Summary

A comprehensive security assessment was conducted on the UNCW Room & Equipment Booking System, a web-based application built using a React frontend, Node.js/Express backend, and MariaDB database.

The purpose of this assessment was to identify vulnerabilities related to authentication, authorization, API security, and data exposure. Testing revealed several critical weaknesses, primarily in access control mechanisms, which could allow attackers to impersonate users, access sensitive data, and manipulate system functionality.

The most significant risks identified include Broken Authorization and Insecure Direct Object References (IDOR), both of which enable unauthorized access and actions within the system.

---

## Scope

The following components were included in the assessment:

* Frontend application (React UI)
* Backend API endpoints (`/api/*`)
* Database interaction through API
* Local development environment

---

## Methodology

Testing was conducted using a structured, manual penetration testing approach.

### 1. Reconnaissance

* Opened the application in the browser
* Used Developer Tools (F12) to inspect:

  * Network requests
  * API endpoints
  * Request/response structure
* Identified key endpoints:

  * `/api/users`
  * `/api/bookings`
  * `/api/rooms`
  * `/api/blocks`

---

### 2. API Enumeration

* Observed API calls in the Network tab
* Replayed requests using **Edit and Resend**
* Identified parameters such as:

  * `user_id`
  * `uncw_id`
  * `room_id`

---

### 3. Manual Request Manipulation

* Modified query parameters:

  * `user_id=1 → user_id=2`
* Modified request bodies:

  * Changed `uncw_id`
  * Injected additional fields
* Sent crafted requests using:

  * Browser DevTools
  * `curl`

---

### 4. Input Testing

* Tested input fields for:

  * Injection attempts
  * Invalid values
  * HTML/JavaScript payloads

Example payload:

```json
"notes":"<img src=x onerror=alert(1)>"
```

---

### 5. Business Logic Testing

* Attempted repeated bookings
* Tested booking conflicts
* Attempted impersonation via ID manipulation

---

## Findings Overview

| ID | Vulnerability                        | Severity | OWASP |
| -- | ------------------------------------ | -------- | ----- |
| 1  | Broken Authorization (Impersonation) | High     | A01   |
| 2  | IDOR (Bookings)                      | High     | A01   |
| 3  | CORS Misconfiguration                | Medium   | A05   |
| 4  | Excessive Data Exposure              | Medium   | A02   |
| 5  | Information Disclosure               | Low      | A05   |

---

## 1. Broken Authorization – User Impersonation

**Severity:** High
**Endpoint:** `POST /api/bookings`

### Description

The application allows the client to specify the `uncw_id` when creating a booking. The backend does not verify that the requester is authorized to act on behalf of that user.

This results in a failure of access control, allowing any user to impersonate another.

---

### Proof of Concept

```http
POST /api/bookings
Content-Type: application/json
```

```json
{
  "uncw_id": "850600010",
  "booking_type": "room",
  "start_time": "2026-04-24 20:30:00",
  "end_time": "2026-04-24 21:00:00",
  "notes": "impersonation test",
  "room_id": 11,
  "group_size": 5,
  "is_joinable": false
}
```

### Result

```json
{
  "message": "Booking created successfully"
}
```

---

### Steps to Reproduce

1. Open DevTools → Network tab
2. Create a booking in the UI
3. Intercept the POST request
4. Modify `uncw_id` to another valid user
5. Send request
6. Observe successful booking creation

---

### Attacker Scenario

An attacker submits booking requests using another user’s identifier. By doing so, the attacker can create reservations under that user’s account. This may lead to fraudulent bookings, disruption of legitimate reservations, and reputational damage.

---

### Impact

* User impersonation
* Unauthorized booking creation
* Data integrity compromise

---

### Fix

* Do not trust client-supplied identity
* Use authenticated session data

---

## 2. IDOR – Bookings Endpoint

**Severity:** High
**Endpoint:** `GET /api/bookings?user_id=...`

---

### Description

The API exposes booking data based on a user-controlled parameter without verifying authorization.

---

### Proof of Concept

```http
GET /api/bookings?user_id=2
```

---

### Steps to Reproduce

1. Open DevTools → Network tab
2. Locate request to `/api/bookings`
3. Use "Edit and Resend"
4. Change `user_id` value
5. Send request
6. Observe data returned

---

### Attacker Scenario

An attacker iterates through possible user IDs to retrieve booking data for all users. This allows the attacker to gather sensitive scheduling information and monitor system usage.

---

### Impact

* Unauthorized access to user data
* Privacy violations

---

### Fix

* Enforce ownership validation
* Reject unauthorized requests

---

## 3. CORS Misconfiguration

**Severity:** Medium

---

### Description

The API allows all origins:

```http
Access-Control-Allow-Origin: *
```

---

### Steps to Identify

1. Inspect API response headers in DevTools
2. Observe wildcard origin

---

### Attacker Scenario

An attacker hosts a malicious website that sends API requests from a victim’s browser. Because all origins are allowed, the attacker can retrieve sensitive data through the victim’s session.

---

### Impact

* Cross-origin data exposure
* Data exfiltration

---

### Fix

Restrict allowed origins.

---

## 4. Excessive Data Exposure

**Severity:** Medium
**Endpoint:** `GET /api/users`

---

### Description

The API returns full user records without authentication.

---

### Proof of Concept

```bash
curl http://localhost:5000/api/users
```

---

### Steps to Reproduce

1. Send GET request to `/api/users`
2. Observe response data

---

### Attacker Scenario

An attacker retrieves all users and identifies administrators or targets. This information can be used for phishing or targeted attacks.

---

### Impact

* User enumeration
* Exposure of sensitive data

---

### Fix

* Require authentication
* Limit returned fields

---

## 5. Information Disclosure

**Severity:** Low

---

### Description

The server exposes implementation details:

```http
X-Powered-By: Express
```

---

### Steps to Identify

1. Inspect response headers in DevTools

---

### Attacker Scenario

An attacker identifies the backend technology and researches known vulnerabilities, enabling more targeted attacks.

---

### Impact

* Technology fingerprinting

---

### Fix

Disable header exposure.

---

## Additional Testing

### XSS Testing

* Injected HTML/JS payload into notes field
* Payload was stored but not executed

### Conclusion

No exploitable XSS vulnerability was identified.

---

## Overall Risk

**High**

Due to multiple access control vulnerabilities.

---

## Recommendations

* Implement authentication (JWT/session)
* Enforce authorization checks
* Validate all inputs
* Restrict CORS
* Minimize exposed data
* Remove unnecessary headers

---

## Conclusion

The system demonstrates significant weaknesses in access control and API design. Addressing these issues will greatly improve security and reduce risk of exploitation.
