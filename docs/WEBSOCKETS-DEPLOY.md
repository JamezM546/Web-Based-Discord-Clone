WebSocket API deployment guide (short)

This document shows the minimal steps to deploy the WebSocket infra described in docs/WEBSOCKETS-IMPLEMENTATION-PLAN.md. It assumes you have AWS CLI + SAM CLI configured and permissions to create Lambda / API Gateway / DynamoDB resources.

1) Prepare environment

- Ensure `simple-server/ws/connect.js` and `simple-server/ws/disconnect.js` are present (they are in this repo).
- Set these env vars locally or in your deployment pipeline:
  - `CONNECTIONS_TABLE` (DynamoDB table name; SAM will create `WebSocketConnections` by default)
  - `WS_API_STAGE` (e.g. `prod`)
  - `WS_API_DOMAIN` will be populated after deployment (see outputs)

2) Package and deploy with SAM (example)

```bash
# from repo root
sam build --template-file infra/aws/websocket-sam-snippet.yml
sam deploy --guided --template-file .aws-sam/build/template.yaml
```

During `sam deploy --guided` choose a stack name (e.g. `discord-websocket`) and accept creating an S3 bucket for artifacts if prompted.

3) After deploy

- The SAM outputs will include the WebSocket API id and URL. The frontend needs `VITE_WS_API_DOMAIN` set to `{api-id}.execute-api.{region}.amazonaws.com` and `VITE_WS_API_STAGE` set to the stage name (e.g. `prod`).
- The HTTP Lambda that persists messages must have permission to call `execute-api:ManageConnections` and know the `WS_API_DOMAIN` and `WS_API_STAGE` to call `postToConnection`. Use IAM policy like `infra/aws/iam-websocket-policy.json`.

4) Local testing

- For local development without deploying, you can run a small node `ws` server and point `VITE_WS_API_DOMAIN` to `localhost:PORT` with `wss://` not required for local dev. Implement a dev-only adapter in `src/app/services/websocketService.ts`.
  - To run the local dev WebSocket server included in this repo:
    ```bash
    cd simple-server
    npm install
    npm run dev-ws
    # In another terminal, set DEV_WS_URL and run backend
    # e.g. DEV_WS_URL=http://localhost:8081 node server.js
    # Or add DEV_WS_URL to .env for the simple-server process
    ```
  - Set `DEV_WS_URL` to `http://localhost:8081` so `publishToRoom` will POST to the local server during development.

5) Amplify / Frontend

- Add two Amplify environment variables in the Amplify Console for your branch:
  - `VITE_WS_API_DOMAIN` = `{api-id}.execute-api.{region}.amazonaws.com`
  - `VITE_WS_API_STAGE` = `prod`

- Re-deploy frontend. The `useWebSocket` hook uses these env vars to connect.

6) IAM notes

- Ensure the Lambda that calls `postToConnection` is granted `execute-api:ManageConnections` (see `infra/aws/iam-websocket-policy.json`).

7) Production considerations

- Use a GSI `roomId-index` on the connections table for efficient broadcasting.
- Consider storing one item per (roomId, connectionId) for efficient queries.
- Harden `$connect` to validate tokens (Cognito / JWT) and populate a user's rooms or memberships if you want server-side filtering.
