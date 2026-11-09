# Smart Notes & Academic Resources Management System: Backend

REST API (Node.js, Express, MongoDB) that lets students and teachers upload, search, bookmark and download academic resources, with admin moderation. Built to plug into a React (Vite) frontend later.

## 1. Technology stack

Node.js 18+, Express 4, MongoDB + Mongoose 8, JWT (`jsonwebtoken`), `bcryptjs`, Multer 2 (local disk storage), `dotenv`, `cors`, `nodemon` (dev). CommonJS, no TypeScript.

## 2. Features

- Student / Teacher registration, login, JWT auth, profile update, change password
- Admin accounts only via the seed script (public registration cannot create an Admin)
- Role-based authorization (Student, Teacher, Admin) and ownership checks
- Upload PDF / DOC / DOCX / PPT / PPTX / XLS / XLSX / TXT / CSV / ZIP with extension + MIME + size validation
- Admin approval workflow: uploads start as `Pending`; only `Approved` resources are visible/downloadable to others
- Search (title, description, tags, subject name/code), filters (subject, semester, category, file type), sorting, pagination
- Bookmarks (no duplicates, private per user)
- Subjects and categories management (admin)
- User dashboard and admin dashboard statistics
- Centralized error handling with a consistent JSON format

## 3. Folder structure

```
server/
├── config/db.js
├── controllers/   auth, user, resource, bookmark, subject, category, admin, dashboard
├── models/        User, Resource, Subject, Category, Bookmark
├── routes/        one file per route group
├── middleware/    authMiddleware, roleMiddleware, uploadMiddleware, errorMiddleware, validateObjectId
├── utils/         generateToken, fileHelpers, appError, asyncHandler, apiResponse, validators, resourceQuery
├── scripts/seed.js
├── uploads/       uploaded files (git-ignored)
├── .env.example  .gitignore  package.json  server.js  README.md
```

## 4. Installation (Windows / VS Code)

1. Install **Node.js 18 or newer** (https://nodejs.org) and **MongoDB** (local Community Server, or a free MongoDB Atlas cluster).
2. Extract the ZIP and open the `server` folder in VS Code.
3. Open the VS Code terminal in that folder and run:
   ```
   npm install
   copy .env.example .env
   ```
4. Edit `.env` (see next section).

## 5. Environment configuration (`.env`)

| Variable | Meaning |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret used to sign tokens |
| `JWT_EXPIRE` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed frontend origin(s), comma separated (Vite: `http://localhost:5173`) |
| `MAX_FILE_SIZE_MB` | Max upload size (default 20) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used only by the seed script (password min 8 chars) |

Generate a secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## 6. MongoDB connection

- **Local MongoDB:** `MONGO_URI=mongodb://127.0.0.1:27017/smart_notes` (make sure the MongoDB service is running).
- **Atlas:** create a cluster, add a database user, allow your IP under *Network Access*, then use the `mongodb+srv://<user>:<password>@<cluster>/smart_notes?retryWrites=true&w=majority` string. URL-encode special characters in the password.

## 7. Seed script

```
npm run seed
```
Creates the admin from `ADMIN_*` env vars (password hashed), the 8 default categories and 8 sample subjects. It is safe to run repeatedly: existing records are skipped and never overwritten.

## 8. Run the server

```
npm run dev     # development with nodemon
npm start       # production
```
Check it: `GET http://localhost:5000/api/health`

## 9. Authentication

Log in, copy `data.token`, and send it on every protected request:
```
Authorization: Bearer <token>
```
Invalid/expired tokens return `401`. Deactivated accounts get `403`.

## 10. Response format

```json
{ "success": true,  "message": "Resource uploaded successfully", "data": { } }
{ "success": false, "message": "Validation failed", "errors": ["Title is required (3-150 characters)"] }
```
Status codes used: 200, 201, 400, 401, 403, 404, 409, 500.

## 11. API endpoints

Legend: 🔓 public · 🔑 any logged-in user · 🛡️ Admin only.

### `/api/auth`
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/register` | 🔓 | Register as Student (default) or Teacher |
| POST | `/login` | 🔓 | Log in (all roles, including Admin) |
| GET | `/me` | 🔑 | Current user |
| PUT | `/change-password` | 🔑 | Change password |

### `/api/users`
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/profile` | 🔑 | Own profile |
| PUT | `/profile` | 🔑 | Update `name`, `email`, `bio`, `profileImage` |
| GET | `/:id` | 🔑 | Basic public info about a user |

### `/api/resources` (all require login)
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/` | Student, Teacher, Admin | Upload (multipart/form-data) |
| GET | `/` | 🔑 | Approved resources: search, filter, sort, paginate |
| GET | `/my` | 🔑 | Own uploads (`?status=Pending/Approved/Rejected`) |
| GET | `/pending` | 🛡️ | Pending resources for review |
| GET | `/:id` | 🔑 | Details (approved, or own/admin) |
| PUT / PATCH | `/:id` | Owner or Admin | Update title, description, subject, semester, category, tags |
| DELETE | `/:id` | Owner or Admin | Delete resource + file + bookmarks |
| GET | `/:id/download` | 🔑 | Download file (approved, or own/admin) |

**Search/filter query parameters** (all combine with AND): `search` (or `keyword`/`q`), `subject` (id), `category` (id), `semester` (1-12), `fileType` (e.g. `pdf`), `sort` (`newest` default | `oldest`), `page` (default 1), `limit` (default 10, max 50).
Example: `GET /api/resources?search=binary tree&semester=3&fileType=pdf&sort=oldest&page=1&limit=10`

### `/api/bookmarks` (login required)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Own bookmarked resources |
| POST | `/:resourceId` | Bookmark an approved resource (409 if already bookmarked) |
| DELETE | `/:resourceId` | Remove bookmark |

### `/api/subjects` and `/api/categories`
| Method | Path | Access |
|---|---|---|
| GET | `/`, `/:id` | 🔑 |
| POST | `/` | 🛡️ |
| PUT / PATCH | `/:id` | 🛡️ |
| DELETE | `/:id` | 🛡️ (409 if resources still use it) |

### `/api/dashboard`
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | 🔑 | Approved total, recent uploads, my uploads (+status counts), bookmarks, subjects, categories, stats by category and file type |
| GET | `/admin` | 🛡️ | Users (total/students/teachers/admins/inactive) and resources (total/approved/pending/rejected) |

### `/api/admin` (Admin only)
| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard` | Same as `/api/dashboard/admin` |
| GET | `/users` | List users (`role`, `accountStatus`, `search`, `page`, `limit`) |
| GET | `/users/:id` | User details + upload stats |
| PUT | `/users/:id` | Update name/email/bio/profileImage |
| PATCH | `/users/:id/role` | `{ "role": "Student" \| "Teacher" }` |
| PATCH | `/users/:id/status` | `{ "accountStatus": "Active" \| "Inactive" }` |
| DELETE | `/users/:id` | Delete user and their resources, files, bookmarks |
| GET | `/resources` | All resources (`status=Pending\|Approved\|Rejected\|all`, plus the search/filter params) |
| GET | `/resources/pending` | Pending resources |
| GET | `/resources/:id` | Resource details (any status) |
| PATCH | `/resources/:id/approve` | Approve |
| PATCH | `/resources/:id/reject` | Reject, optional `{ "reason": "..." }` |
| DELETE | `/resources/:id` | Remove a resource |

**Business rules worth knowing**
- Uploads by Students/Teachers start as `Pending`; Admin uploads are auto-approved.
- If a non-admin edits an `Approved` or `Rejected` resource, it returns to `Pending` for re-review.
- Admin cannot deactivate, delete or change the role of their own account; Admin accounts cannot be deleted or demoted via the API, and nobody can be promoted to Admin via the API (seed script only).
- Responses never include `password`, `filePath` or `storedFileName`; clients use each resource's `downloadUrl`.
- `/uploads` is **not** publicly served: files can only be fetched through the authenticated download endpoint.
- When using the download endpoint from React, call it with `fetch`/axios (`responseType: 'blob'`) and the Authorization header, then create an object URL; a plain `<a href>` cannot send the token.

## 12. Sample requests and responses

**Register** `POST /api/auth/register`
```json
{ "name": "Asha Verma", "email": "asha@example.com", "password": "Secret@123", "role": "Student" }
```
```json
{ "success": true, "message": "Registration successful",
  "data": { "user": { "_id": "...", "name": "Asha Verma", "email": "asha@example.com", "role": "Student", "accountStatus": "Active" }, "token": "eyJhbGciOi..." } }
```

**Login** `POST /api/auth/login`
```json
{ "email": "asha@example.com", "password": "Secret@123" }
```

**Create subject (admin)** `POST /api/subjects`
```json
{ "subjectName": "Artificial Intelligence", "subjectCode": "CS402", "description": "Search, ML basics" }
```

**Upload resource**: see section 13. Success response:
```json
{ "success": true, "message": "Resource uploaded successfully and is awaiting admin approval",
  "data": { "resource": { "_id": "...", "title": "DSA Unit 1 Notes", "semester": 3, "tags": ["dsa","trees"],
    "originalFileName": "unit1.pdf", "fileType": "pdf", "fileSize": 182044, "status": "Pending",
    "subject": { "subjectName": "Data Structures", "subjectCode": "CS201" },
    "category": { "categoryName": "Notes" }, "uploadedBy": { "name": "Asha Verma", "role": "Student" },
    "downloadUrl": "/api/resources/<id>/download" } } }
```

**Reject** `PATCH /api/admin/resources/:id/reject`
```json
{ "reason": "Scanned copy is unreadable" }
```

**Error example** (`404`)
```json
{ "success": false, "message": "Resource not found" }
```

## 13. File upload testing

**Postman:** `POST http://localhost:5000/api/resources` → *Authorization* tab: Bearer Token → *Body* → **form-data**:

| Key | Type | Example |
|---|---|---|
| `file` | **File** | choose a .pdf/.docx/... |
| `title` | Text | DSA Unit 1 Notes |
| `description` | Text | Trees and graphs summary |
| `subject` | Text | subject `_id` from `GET /api/subjects` |
| `category` | Text | category `_id` from `GET /api/categories` |
| `semester` | Text | 3 |
| `tags` | Text | dsa, trees, unit1 |

**Thunder Client:** Body → *Form* → add the text fields, then add `file` with the *Files* option. Add the header `Authorization: Bearer <token>`.

**curl (Windows `curl.exe`):**
```
curl.exe -X POST http://localhost:5000/api/resources -H "Authorization: Bearer TOKEN" -F "file=@C:\path\unit1.pdf" -F "title=DSA Unit 1 Notes" -F "description=Trees summary" -F "subject=SUBJECT_ID" -F "category=CATEGORY_ID" -F "semester=3" -F "tags=dsa,trees"
```
Download: `GET /api/resources/<id>/download` with the bearer token (use *Send and Download* in Postman).

## 14. Suggested end-to-end test order

1. `npm run seed`, then log in as the admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
2. `GET /api/subjects` and `/api/categories` to get ids.
3. Register a Student and a Teacher; log in and keep both tokens.
4. Student uploads a file → status `Pending`; the Teacher's `GET /api/resources` must **not** list it, and `GET /api/resources/:id` as Teacher returns 404.
5. Admin: `GET /api/admin/resources/pending` → `PATCH .../approve`.
6. Teacher now sees and downloads it, searches (`?search=...`), bookmarks it (`POST /api/bookmarks/:id`, repeat → 409).
7. Student edits it → returns to `Pending`; try editing as the Teacher → 403.
8. Check `GET /api/dashboard` and `GET /api/admin/dashboard`.
9. Negative tests: no token (401), Student calling `/api/admin/...` (403), bad id `/api/resources/123` (400), `.exe` upload (400), oversized file (400), registering with `"role":"Admin"` (403).

## 15. Notes for the React frontend

CORS is enabled for `CLIENT_URL` (default `http://localhost:5173`) and exposes `Content-Disposition`. All lists are paginated with `{ pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage } }`. To switch to cloud storage later, change `utils/fileHelpers.js` and `middleware/uploadMiddleware.js` only.
