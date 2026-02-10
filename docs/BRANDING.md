# Branding ZapCards (Zapiens)

La app comparte la identidad visual de la web Zapiens para consistencia de marca.

## Temas de color (6 opciones)

En Ajustes el usuario elige un **Color Principal** entre 6 temas. Cada tema define el acento (botones, CTAs) y **fondos con tonalidad** en modo oscuro (variaciones de negro que combinan con el tema), y variantes claras en modo light.

| Tema   | Primary (hex) | Dark: fondo / card (tonalidad) | Light: fondo |
|--------|----------------|---------------------------------|--------------|
| Ocean  | `#0074e4`      | Negro azulado `#0a1628` / `#0f2744` | `#f0f7ff` |
| Royal  | `#8624f5`      | Negro violáceo `#1a0a2e` / `#2d1a4a` | `#f5f0ff` |
| Forest | `#4ade80`      | Negro verdoso `#0a1a0a` / `#0f2e0f` | `#f0fff4` |
| Citrus | `#ff6a00`      | Negro anaranjado `#2a1a0a` / `#3d2810` | `#fffbf0` |
| Cherry | `#ff003c`      | Negro rojizo `#2a0a14` / `#401a28` | `#fff0f5` |
| Candy  | `#ff3eb5`      | Negro rosado/magenta `#2a0a1f` / `#401a35` | `#fff0fc` |

- **Modo dark**: `background`, `card`, `border` y `textSecondary` tienen tinte según el tema (ya no es siempre teal).
- **Modo light**: fondos claros con tinte suave; texto oscuro; mismo `primary` por tema.
- Código: `src/services/theme.ts` (`ColorTheme`, `themeColors`, `darkPalette`, `lightPalette`, `createTheme`).

## Colores de referencia (legacy / web)

| Uso        | Hex        | Variable / tema app        |
|-----------|------------|----------------------------|
| Fondo oscuro (teal) | `#003333` | `zapiensBrand.backgroundDark` |
| Card/panel (teal) | `#0a4545` | `zapiensBrand.backgroundCard` |
| Acento naranja neón | `#FF8C00` | `zapiensBrand.primary` (referencia web) |
| Turquesa   | `#40E0D0` | `zapiensBrand.turquoise` (referencia) |
| Texto sobre oscuro | `#FFFFFF` | `zapiensBrand.textOnDark` |
| Texto secundario | `#d1d5db` | `zapiensBrand.textMuted` |

La app ya no usa el teal fijo por defecto: el tema por defecto es **Ocean** (azul). Si el usuario tenía guardado un tema antiguo (default/green/purple/orange), se migra a ocean/forest/royal/citrus en `ThemeContext`.

## Logo

- **App**: `assets/full_logo.png` (copiado de `website/resources/full_logo.png`).
- Se usa en la pantalla de bienvenida (`app/(auth)/welcome.tsx`).
- Si el logo se ve poco visible sobre fondo teal, se puede usar una versión clara del logo en la web o invertir con `style` en la `Image`.

## Fuentes

- **Web**: Inter, Space Grotesk (Google Fonts); Space Mono en algunos estilos.
- **App**: Solo se usan **Space Mono** e **Inter Tight** en toda la app:
  - **Space Mono**: `FONTS.title` (Bold), `FONTS.titleRegular` (Regular) — títulos, encabezados, bloques de código (p. ej. notas en Lands).
  - **Inter Tight**: `FONTS.body` (Regular), `FONTS.bodyBold` (Bold) — subtítulos, cuerpo, botones secundarios.
- Carga en el layout raíz (`app/_layout.tsx`) con `@expo-google-fonts/space-mono` e `@expo-google-fonts/inter-tight`.
- No debe quedar `fontWeight` ni `fontFamily` con fuentes del sistema (p. ej. Menlo); todo debe usar `FONTS.*`.

## Archivos clave

- `src/services/theme.ts`: 6 temas (`ColorTheme`), `themeColors`, `darkPalette`, `lightPalette`, `createTheme`, `zapiensBrand` (referencia).
- `src/context/ThemeContext.tsx`: proveedor, persistencia y migración de temas antiguos a los 6 nuevos.
- `app/(subtabs)/settings.tsx`: selector de tema (modo claro/oscuro + 6 colores con etiquetas Ocean, Royal, Forest, Citrus, Cherry, Candy).
- `app/(auth)/welcome.tsx`: primera pantalla con tema y logo.
