# Security policy

Please **do not report vulnerabilities in public issues or pull requests.**

Use GitHub's private vulnerability reporting for this repository (Security tab → _Report a vulnerability_). If that option is unavailable, open a public issue that says only
that you need a private security contact, with no technical details, and a maintainer will arrange a private channel.

Include the affected package and version, a minimal reproduction and the impact you observed. Reports are handled best-effort; there is no guaranteed response time or bounty.

Supported for security fixes: the latest published `0.x` release of `@quartz-headless/core` and `@quartz-headless/primitives`. Published npm versions are immutable, so a fix is released as a new
version and older versions may be deprecated with `npm deprecate`. The unscoped `quartz-headless` package is frozen and receives no fixes.
