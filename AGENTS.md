## Package manager

- Use `sfw` before any `pnpm` command that installs, adds, updates, or removes dependencies so package-manager network traffic stays behind Socket Firewall.
- Examples: `sfw pnpm install`, `sfw pnpm add <pkg>`, `sfw pnpm remove <pkg>`, `sfw pnpm update <pkg>`.
