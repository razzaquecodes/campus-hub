# Campus Hub Backend

Lightweight Express server powering the MAKAUT student verification flow.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| POST | `/verify-student` | MAKAUT credential verification + student data extraction |

## Setup

```bash
cd backend
npm install
npm run dev       # nodemon (auto-reload)
# or
npm start         # plain node
```

## POST /verify-student

**Request body:**
```json
{
  "rollNumber": "12345678",
  "password": "yourPassword"
}
```

**Success response (`200`):**
```json
{
  "verified": true,
  "student": {
    "fullName": "Aryan Razzaque",
    "rollNumber": "12345678",
    "registrationNumber": "242760110064",
    "email": "student@example.com",
    "mobile": "9876543210",
    "instituteName": "Budge Budge Institute of Technology",
    "courseName": "Bachelor of Technology in Computer Science & Engineering",
    "abcId": "476183106112"
  }
}
```

**Failure response (`401`):**
```json
{
  "verified": false,
  "message": "Invalid MAKAUT credentials"
}
```

## Security

- Passwords are **never** logged, stored, or forwarded.
- The `password` variable is explicitly nulled after the login HTTP request completes.
- Only the verified `StudentModel` data is returned.

## How it works

1. **Fetch login page** — establishes a cookie jar session, extracts the CSRF `<meta>` token.
2. **Fetch login form** — GET `/get-login-form?typ=5` returns the form HTML with a fresh `_token`.
3. **Submit credentials** — POST to `/checkLogin` with `_token`, `typ=5`, `username`, `password`.
4. **Detect outcome** — inspects response body for error indicators or success markers.
5. **Fetch student details** — GET `/student/student-basic-details` using the authenticated session.
6. **Parse HTML** — cheerio extracts `fullName`, `rollNumber`, `registrationNumber`, `email`, `mobile`, `instituteName`, `courseName`, `abcId` from the rendered table.
