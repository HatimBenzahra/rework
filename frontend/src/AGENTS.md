# FRONTEND SOURCE

## OVERVIEW

React 19 SPA with role-based routing. Admin/Director sees sidebar dashboard; Commercial/Manager sees mobile-first interface.

## STRUCTURE

```
src/
├── pages-ADMIN-DIRECTEUR/   # Dashboard pages (sidebar layout)
│   ├── {feature}/
│   │   ├── {Feature}.jsx        # Page component
│   │   └── use{Feature}Logic.jsx # Logic hook
│   └── {feature}/components/    # Page-specific components
├── pages-COMMERCIAL-MANAGER/    # Mobile interface (bottom nav)
├── pages-AUTH/                  # Login, Unauthorized
├── components/
│   ├── ui/                      # Radix primitives (shadcn pattern)
│   └── *.jsx                    # Shared business components
├── contexts/                    # React contexts
├── hooks/
│   ├── metier/api/             # Domain-specific API hooks
│   ├── utils/                  # Utility hooks
│   └── ui/                     # UI-related hooks
├── services/
│   ├── api/{entity}/           # GraphQL queries/mutations per entity
│   ├── auth/                   # JWT handling
│   ├── audio/                  # LiveKit client
│   └── core/                   # GraphQL client setup
└── types/                      # TypeScript .d.ts definitions
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add admin page | `pages-ADMIN-DIRECTEUR/{name}/` - create dir + {Name}.jsx + use{Name}Logic.jsx |
| Add commercial page | `pages-COMMERCIAL-MANAGER/{name}/` - mobile-first, bottom nav |
| New shared component | `components/` for business, `components/ui/` for primitives |
| New API hook | `hooks/metier/api/` - follows TanStack Query pattern |
| GraphQL query/mutation | `services/api/{entity}/` - queries.ts + mutations.ts + types.ts |
| Role check | `contexts/RoleContext.jsx` or `contexts/userole.jsx` |

## CONVENTIONS

- **use*Logic pattern**: Page logic separated into hooks (e.g., `Dashboard.jsx` + `useDashboardLogic.jsx`)
- **Lazy loading**: ALL pages use `React.lazy()` in App.jsx
- **Path alias**: `@/` resolves to `src/`
- **TanStack Query**: 5min staleTime, no refetchOnWindowFocus
- **Radix + CVA**: UI components use class-variance-authority for variants

## ROUTING LOGIC

```jsx
// App.jsx decides layout by role
if (isCommercial || isManager) → CommercialLayout (mobile, light mode forced)
else → AdminLayout (sidebar, dark/light toggle)
```

## ANTI-PATTERNS

- **DO NOT** use TSX - this project uses JSX intentionally
- **DO NOT** create pages without use*Logic companion hook
- **DO NOT** skip lazy loading for new pages
- **DO NOT** hardcode API URLs - use services layer
