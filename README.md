# credits_modal

Bloque de créditos estilo keygen (CRT monocromo) para sitios Astro. Sin frameworks de runtime, sin dependencias en el componente.

## Uso

Colócalo al final de la página (flujo normal, alineado a la derecha):

```astro
---
import CreditsBadge from './components/credits/CreditsBadge.astro';
---
<footer>
  <CreditsBadge />
</footer>
```

Por defecto lee `src/config/credits.ts`:

```ts
export const CREDITS = {
  name: 'sbector.com',
  href: 'https://tu-sitio.com',
  label: 'desarrollado por',
  author: 'NOMBRE2',
};
```

El modal muestra: `CRÉDITOS`, el label, el nombre grande (enlace a `href`) y `UNA CREACIÓN DE <author>`. Si `author` está vacío, la línea se omite.

Props opcionales: `name`, `href`, `label`, `author`, `trigger` (texto del bloque, por defecto “créditos”).

## Desarrollo

- `pnpm dev` — demo en http://localhost:4321
- `pnpm build` — build de producción en `dist/`
- `pnpm check` — type checking
