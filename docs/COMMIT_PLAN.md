# Git Commit Planı (Conventional Commits)

İlk açık kaynak yayını için önerilen, mantıksal olarak gruplanmış commit sırası.

```text
chore: initialize repository with license and community docs
docs: add README, RELEASE, CHANGELOG, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT
build: configure Next.js 15, TypeScript, Tailwind 4, ESLint, Prettier
feat(design-system): add tokens, theme provider, light/dark mode
feat(auth): add domain, repositories and session-based auth service
feat(auth): add password hashing, tokens, CSRF, TOTP and RBAC
feat(auth): add server actions and production-quality auth screens
feat(auth): add device session management
test(auth): add unit and integration tests for auth core
feat(feed): add feed domain, cursor pagination and repositories
feat(feed): add feed service, API routes and server actions
feat(feed): add post card, media carousel, stories and comments UI
feat(feed): add optimistic like/save with rollback and infinite scroll
test(feed): add feed service and cursor pagination tests
perf(feed): memoize post card and guard carousel re-renders
feat(feed): rate-limit comment creation
test(db): add real PostgreSQL runtime tests via PGlite (migration, CRUD, tx, constraints)
ci: add GitHub Actions pipeline (lint, types, test, build, e2e, security)
build(docker): add production and development Dockerfiles and compose
feat(observability): add health check, structured logging, Sentry and OpenTelemetry
test(e2e): add Playwright specs for auth, feed and responsive
fix(security): upgrade Next.js to 15.5.20 (CVE-2025-29927 and related advisories)
fix(edge): prevent node:crypto leaking into edge middleware bundle
chore: remove dead code (feed store, unused skeleton)
feat(a11y): add skip link, aria-live toast and focus-visible styles
feat(seo): add metadataBase, Open Graph/Twitter, robots and sitemap
docs: add deployment guide, env reference and release notes
chore(release): prepare v0.1.0-rc.1
```

**Kurallar:** her commit atomik ve yeşil (lint/tsc/test geçen). `BREAKING CHANGE:` footer'ı kırıcı değişikliklerde. Tag: `git tag v0.1.0-rc.1`.
