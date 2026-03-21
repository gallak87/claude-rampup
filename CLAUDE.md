# Project: Vite 8 React App

## Stack
- Vite 8
- React 19
- TypeScript

## Conventions
- Use React 19 patterns (use(), server components where applicable)
- Follow Vercel React best practices skill (`/react-best-practices`) — especially CRITICAL rules around waterfall elimination and bundle optimization
- Prefer named exports over default exports
- Co-locate component styles (CSS modules or Tailwind — TBD)

## Vite 8 Notes
- Vite 8 ships with Rolldown as the default bundler (Rust-based, replaces Rollup)
- Environment API is stable in Vite 8 — prefer it over Vite-specific workarounds
- `vite.config.ts` uses the new `environments` key for SSR/client splits

## Agent Behavior
- Do not add boilerplate comments or obvious JSDoc
- Keep components small and composable
- Ask before adding new dependencies
- Full compiled React best practices available at: ~/.claude/skills/react-best-practices/AGENTS.md
