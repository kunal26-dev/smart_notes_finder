# StudySpace frontend

Responsive React + Vite client for the Smart Notes Finder API. This application lives entirely in the `frontend` folder.

## Run locally

1. Install Node.js 18 or newer.
2. From this folder, install dependencies and create your local environment file:

   ```powershell
   npm install
   Copy-Item .env.example .env
   ```

3. By default, the frontend proxies `/api` requests to `http://localhost:5000`, avoiding local browser CORS issues. If your backend uses another host or port, set `VITE_PROXY_TARGET` in `.env` (for example, `http://localhost:5001`).
4. If the deployed frontend and API are on different origins, set `VITE_API_URL` to the full API URL (for example, `https://api.example.com/api`).
5. Start the development server:

   ```powershell
   npm run dev
   ```

   Open `http://localhost:5173`. The backend must also be running. From `backend\Min\server`, start it with `npm run dev`.

## Build

```powershell
npm run build
npm run preview
```

## Included

- Sign-in and Student/Teacher registration, with persistent JWT sessions
- Resource discovery with keyword search, subject/category/semester/file filters, and pagination
- Dashboard, saved resources, personal uploads, authenticated downloads, and multipart uploads
- Admin resource review with approve/reject actions
- Responsive layout for desktop, tablet, and mobile

The client uses the existing API routes and does not provide mock data when the API is unavailable.
