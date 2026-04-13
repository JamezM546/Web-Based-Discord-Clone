# Frontend: Amplify deployment + local mock

This file describes how to deploy the frontend to AWS Amplify and how to run a lightweight local mock while the backend is paused.

## Local mock (quick, minimal)

1. Install json-server (global or dev):

```bash
npm install -g json-server
```

2. Start the mock from the project root (serves `db.json`):

```bash
json-server --watch db.json --port 4000
```

3. The included `.env.local` is set to `VITE_API_URL=http://localhost:4000/api` so the app will call the mock endpoints at `/api/*`.

Mock endpoints provided in `db.json`:

- `GET /api/health` → { ok: true }
- `GET /api/messages`

## Amplify deployment (summary)

1. In the target AWS account open AWS Amplify Console → Host Web App → Connect repository and branch.
2. Amplify will detect build settings; this repo already contains an `amplify.yml` in the project root which runs `npm ci` then `npm run build` and publishes `dist`.
3. In Amplify Console > App settings > Environment variables add:

- `VITE_API_URL` = `https://z5ptd31eoa.execute-api.us-east-1.amazonaws.com/prod/api` (or the base your frontend expects).

4. Deploy. Verify network calls in the browser devtools target the API Gateway invoke URL and that CORS is allowed.

## Useful docs

- Amplify docs: https://docs.amplify.aws/

## Notes

- `VITE_` prefix is required for Vite to expose env vars to client code.
- If your frontend app appends `/api` itself, set `VITE_API_URL` to the base (`https://.../prod`) instead.
