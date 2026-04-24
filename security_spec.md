# Security Specification - Revelation Seminar Registrations

## Data Invariants
- A registration must have a valid name, email, and phone.
- `createdAt` must be set to the server time.
- Documents are "write-once" (no updates allowed by users).
- Registrations can only be created, not listed or read by the public (to protect PII).

## The "Dirty Dozen" Payloads
1. **Missing Name**: `{ email: "test@test.com", phone: "+238 9550168", createdAt: "request.time" }` -> DENIED
2. **Invalid Email Format**: `{ name: "John Doe", email: "invalid-email", phone: "+238 9550168", createdAt: "request.time" }` -> DENIED
3. **Missing Phone**: `{ name: "John Doe", email: "test@test.com", createdAt: "request.time" }` -> DENIED
4. **Incorrect createdAt**: `{ name: "John Doe", email: "test@test.com", phone: "+238 9550168", createdAt: "2020-01-01" }` -> DENIED
5. **Unauthorized Update**: `{ name: "New Name" }` on existing doc -> DENIED
6. **Unauthorized Delete**: Admin only or denied -> DENIED
7. **Unauthorized List**: Public cannot list registrations -> DENIED
8. **Unauthorized Get**: Public cannot read individual registrations -> DENIED
9. **Identity Spoofing**: Setting an ID that is too long or contains junk -> DENIED
10. **Shadow Fields**: `{ name: "John Doe", email: "...", phone: "...", createdAt: "...", isVerified: true }` -> DENIED
11. **Resource Exhaustion**: Sending 1MB string in name -> DENIED
12. **Incomplete Keys**: Missing required fields completely -> DENIED
