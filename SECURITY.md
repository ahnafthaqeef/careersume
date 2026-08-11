# Security Policy

## Reporting a vulnerability

Please report security issues privately, not in a public issue. Use GitHub's private reporting: go to the [Security tab](https://github.com/ahnafthaqeef/careersume/security/advisories/new) and open a draft security advisory. Include what you found, how to reproduce it, and what an attacker could do with it.

You will get an acknowledgement within a few days. Once a fix ships, you get credit in the advisory unless you would rather stay anonymous.

Careersume is maintained by one person on a best-effort basis. There is no bug bounty, and there is no support commitment beyond fixing what is reported.

## How AI keys are handled

Your provider key is encrypted with AES-256-GCM before it is written to the database, under a 32-byte key derived from the server's `BYOK_ENCRYPTION_KEY` via HKDF-SHA256. It is decrypted on the server only for the request that needs it, and the plaintext never leaves that request. No API route ever returns the key to the browser, so all the client can learn is which provider you connected and whether a key is connected at all. Deleting your key in `/account/byok` deletes the row outright, and you can additionally revoke the key in your provider's console at any time, which stops it working everywhere immediately.

Two notes for self-hosters. `BYOK_ENCRYPTION_KEY` is the single secret protecting every stored key, so generate it with `openssl rand -base64 48`, keep it out of version control, and treat a leak of it as a compromise of every key in your database. Rotating it invalidates every saved key, and your users will need to reconnect theirs.

## Scope

In scope: anything that exposes one user's key, profile, or documents to another user or to the client; authentication and session handling; row-level security gaps; injection into the AI prompts that leads to data access.

Out of scope: findings against `univa.my/careersume` that require an account you do not control, denial of service by volume, missing hardening headers with no demonstrated impact, and vulnerabilities in third-party AI providers rather than in this code.
