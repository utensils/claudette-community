# Registry signing keys

Public keys used to sign `registry.json`. The matching secret keys live only in
GitHub Actions Secrets on this repository — they are never checked in.

## Files

| File | Purpose |
|---|---|
| `community-registry.pub` | Active minisign public key. CI uses the matching secret to sign `registry.json` after every regeneration. Claudette ships an identical embedded copy and refuses any registry that doesn't verify against it. |

## Trust binding

Claudette's binary embeds the same public key bytes that live here. The copy in
this repository is for transparency — auditors can compare it against the bytes
embedded in a Claudette release to confirm the binding hasn't drifted. The
authoritative copy is the one inside Claudette; rotating the key requires
shipping a new Claudette release.

## Verifying a registry signature

Anyone can verify the registry locally:

```sh
minisign -V -p keys/community-registry.pub -x registry.json.sig -m registry.json
```

(`rsign verify` from `rsign2` works against the same key + signature pair.)

Expected on success:

```
Signature and comment signature verified
Trusted comment: claudette-community registry signed at <ISO-8601> for source.sha=<git-sha>
```

The trusted comment binds the signature to a specific commit SHA, so you can
spot-check that the registry corresponds to a real commit on `main`.

## Rotation

Key rotation requires a coordinated Claudette release:

1. Generate a new keypair with `minisign -G -p keys/community-registry-next.pub -s next.key -W`.
2. Open a Claudette PR that adds the new public key alongside the current one
   so both signatures verify (the verifier accepts ANY embedded key).
3. Release Claudette N+1 with both keys embedded.
4. After most users have upgraded, rotate the GitHub secret to the new key,
   re-sign `registry.json` (CI does this automatically on the next push to
   main), and confirm verification.
5. Open a Claudette PR that removes the old key.
6. Release Claudette N+2 with only the new key embedded.

Today there is one production key. The verifier API takes a slice of public
keys so adding a second one is a one-line change.

## CI secret

`COMMUNITY_REGISTRY_MINISIGN_SECRET_KEY` (repository secret) — full text of
the minisign secret key file (passwordless format), used by `regen.yml` after
every push to `main` to sign the freshly generated `registry.json`.
