# API Test Automation – Maintenance Guide

Project: hackcamp-2026 · Tooling: Postman, Postman CLI, GitHub Actions

## 1. Overview

The API test suite is a Postman collection ("New Collection") that runs automatically in GitHub Actions through the Postman CLI. It covers five requests and 32 assertions:

- GET /api/profile – authenticated (200)
- GET /api/profile – no token (401)
- PUT /api/profile – valid body (200)
- GET /api/activities – valid query (200)
- GET /api/schools (200)

Base URL: https://hackcamp-2026.vercel.app

## 2. How It Works

1. The GitHub Actions workflow installs the Postman CLI and logs in with a Postman API key.
2. It runs the **cloud-hosted** collection by its collection ID. Local-only edits in Postman are not seen by CI.
3. The JWT is injected from a GitHub Secret as the variable `JWT_FROM_CI`:

```yaml
postman collection run "<COLLECTION_ID>" \
  --env-var "JWT_FROM_CI=${{ secrets.JWT_TOKEN }}"
```

4. A collection-level pre-request script adds the header `Authorization: Bearer <token>` to every request, except "GET /api/profile – 401 no token", which must be sent without a token.
5. Individual requests use Authorization = Inherit auth from parent, and the collection itself uses No Auth, so Postman does not try to resolve any Vault secrets.

## 3. Required Configuration

| Item | Location | Value |
| --- | --- | --- |
| JWT\_TOKEN | GitHub repo → Settings → Secrets and variables → Actions | A valid JWT (starts with eyJ, without the word Bearer) |
| POSTMAN\_API\_KEY | GitHub repo secrets (used by the login step) | Postman API key |
| BASE\_URL | Postman collection variables | https://hackcamp-2026.vercel.app |
| JWT\_FROM\_CI | Postman collection variables (local runs only) | Same JWT, Current value only, type default |

## 4. Routine Maintenance

### 4.1 Rotate an expired JWT

Symptom: tests that passed before now fail with 401.

1. Log in to the app, open browser DevTools → Network, and copy the token from the Authorization header of a /api/profile request (or copy it from Postman).
2. GitHub → Settings → Secrets and variables → Actions → JWT\_TOKEN → Update.
3. Re-run the workflow (Actions → Run workflow).

### 4.2 Add a new test request

1. Edit the collection in Postman (web version, so it saves to the cloud).
2. Set Authorization to Inherit auth from parent.
3. If the request must be sent without a token, add its exact name to the exclusion check in the collection pre-request script.
4. Add assertions in the Tests tab. Keep the request name stable, because the script matches on it.
5. Run locally, then trigger the workflow.

### 4.3 Renaming requests

The pre-request script compares the request name as text. If "GET /api/profile – 401 no token" is renamed, update the script, or the no-token test will start sending a token and fail.

### 4.4 Request order

Tests have a data dependency: PUT /api/profile must run before GET /api/profile – authenticated, because the CI account has no profile until it is created. Do not reorder these.

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Log shows "Failed to resolve N vault secret(s)" and 401s | Vault references or secret-type variables remain in the cloud collection | Remove all {{vault:...}} references and secret-type variables; use JWT\_FROM\_CI only |
| Passes locally, fails in CI | CI runs the cloud collection, which may differ from local edits | Edit in the web version or sync changes to the cloud |
| 401 on all authenticated requests | Expired or wrong JWT, or wrong Secret name | Rotate the token; check the Secret is named JWT\_TOKEN |
| GET /api/profile returns 200 but data is null | The account has no profile yet | Make sure PUT runs first |
| "Request could not be sent", URL still shows {{BASE\_URL}} | BASE\_URL variable has no value | Set it in collection variables |
| Response time assertion fails occasionally | Vercel cold start | Raise the threshold (for example 3000 ms) or re-run |
| 401-no-token test fails | The script is adding a token to it | Check the request name in the pre-request script |

## 6. Security Notes

- Never commit a real token. Keep the Initial value of any token variable empty and use Current value only.
- Do not paste tokens into screenshots, chats, or issues.
- Use a dedicated test account with a school email (UBC, SFU, or UVic) and no real personal data.
- Rotate the Postman API key and the JWT if either is ever exposed.

## 7. Known Limitations and Next Steps

- The JWT is static and expires, so CI needs manual token updates. **Improvement:** fetch a token in the pre-request script through the Auth0 client credentials or password grant, storing client\_id and client\_secret in GitHub Secrets.
- Tests share state (the profile). **Improvement:** add a setup step so each test prepares its own data, and a teardown step to clean up.
- Response-time assertions depend on Vercel cold starts. **Improvement:** add a warm-up request or loosen the threshold.
- Consider adding a scheduled trigger (cron) so the suite also runs daily, not only on push or manual runs.

## 8. Quick Checklist Before a Release or Demo

- [ ] JWT\_TOKEN secret is valid (not expired)
- [ ] Latest collection changes are saved in the cloud
- [ ] Request order is correct (PUT before authenticated GET)
- [ ] Workflow run is green on the main branch
- [ ] No token appears in the repository or collection files
