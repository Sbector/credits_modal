# credits_modal

Badge de créditos estilo keygen (CRT monocromo) para sitios Astro. Sin frameworks de runtime, sin dependencias en el componente.

## Uso

```astro
---
import CreditsBadge from './components/credits/CreditsBadge.astro';
---
<CreditsBadge />
```

Por defecto lee `src/config/credits.ts`:

```ts
export const CREDITS = {
  name: 'TU NOMBRE',
  href: 'https://tu-sitio.com',
  label: 'sitio elaborado por',
  role: 'diseño y desarrollo',
};
```

Props disponibles (todas opcionales): `name`, `href`, `label`, `role`, `position` (`bottom-right` | `bottom-left` | `top-right` | `top-left`).

## Desarrollo

- `pnpm dev` — demo en http://localhost:4321
- `pnpm build` — build de producción en `dist/`
- `pnpm check` — type checking
