AWS Console deployment steps

1. Build the deployable zip

   From the `simple-server` folder run:

   ```bash
   npm ci
   npm run package:lambda
   ```

   The script produces a `deploy-package-<ts>.zip` file. Upload this zip to the AWS Lambda console.

2. Create the Lambda function (Console)

   - Runtime: `Node.js 18.x`
   - Handler: `simple-server/lambda.handler`
   - Upload the zip produced in step 1.
   - Set `NODE_ENV=production` and the DB env vars (`DATABASE_URL` or `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`).

3. Networking & DB access

   - If your Postgres runs in RDS inside a VPC, attach the Lambda to the same VPC and subnets (configure security groups to allow DB access).
   - Prefer using RDS Proxy when high concurrency is expected.

4. IAM & secrets

   - If using AWS Secrets Manager or SSM Parameter Store for DB credentials, add an IAM policy granting `secretsmanager:GetSecretValue` and/or `ssm:GetParameter` to the Lambda role.

5. API Gateway

   - Create an HTTP API (recommended) and add an integration pointing to the Lambda.
   - Configure routes for your public REST endpoints and enable CORS as needed.

6. Lambda settings

   - Increase timeout (start with 30s) and memory (512MB) to allow DB initialization on cold starts.
   - Set concurrency limits if needed.

7. Logging & monitoring

   - Verify logs in CloudWatch; add meaningful structured logs.
   - Optionally enable X-Ray tracing.

Notes

- Handler used: `simple-server/lambda.handler` — the `lambda.js` file wraps Express with `serverless-http`.
- The `package:lambda` script installs production deps and zips the folder. Build the zip on a Linux/Windows/Mac machine and upload it via Console or use `aws lambda update-function-code`.
