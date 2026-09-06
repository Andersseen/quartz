# Diagnóstico de preparación para Quartz Headless 1.0

> Revisión: 2026-09-05 · Commit base: `9a615d9` · Versiones locales: Core/Primitives `0.5.0`.
> Alcance: arquitectura, API pública, muestra de implementaciones, suites, empaquetado,
> documentación y workflow. No constituye una auditoría exhaustiva de cada línea ni una
> certificación de accesibilidad. No se verificó el estado publicado de npm ni la protección remota de ramas.

## Valoración

La base técnica es buena y ya dispone de controles que muchas bibliotecas jóvenes no tienen.
El problema principal para 1.0 es la distancia entre «pasan los tests actuales» y «existe un
contrato estable comprobado en proyectos consumidores». No recomendaría publicar 1.0 todavía.
Recomendaría congelar crecimiento, decidir superficie estable y cerrar las garantías por
familias, según el [roadmap](../../ROADMAP.md).

## Lo que está bien

- **Separación de paquetes real.** Primitives consume Core como peer; Core no depende de
  Primitives. Los aliases a fuentes están limitados a la demo. Hay lint y un test de frontera.
  Evidencia: [manifiesto de Primitives](../../packages/primitives/package.json),
  [arquitectura](../ai/ARCHITECTURE.md), [test de frontera](../../packages/core/src/core-boundary.spec.ts).
- **Dirección técnica coherente.** Standalone, signals, inyección funcional, comportamiento
  headless y dependencias reducidas. La infraestructura común ya evita duplicación significativa.
- **Pruebas de comportamiento reales.** Los specs cubren teclado, estados, RTL y limpieza;
  los E2E incluyen foco de Dialog, Menu, Select y controles. No se limitan a comprobar render.
- **Tres motores de navegador.** Playwright ejecuta contra un build de producción de la demo,
  no solo contra el dev server. [Configuración](../../playwright.config.ts).
- **Empaquetado cuidado.** ng-packagr, `sideEffects: false`, verificación de exports/archivos y
  smoke de tarballs fuera del workspace. Son una buena base para probar consumo real.
- **Auditoría anterior útil.** Ya corrigió problemas de foco, dismiss por Document, lifecycle,
  estilos visuales y semántica de controles. Sus cambios incompatibles están identificados en
  [STABILITY_AUDIT](../ai/STABILITY_AUDIT.md); no se contabilizan aquí como bugs pendientes.
- **CI antes de publicación.** Quality, tests y E2E preceden a deploy/publish. Existe un punto
  claro donde añadir las garantías que faltan. [Workflow](../../.github/workflows/deploy.yml).

## Hallazgos y huecos de garantía

«Confirmado» significa visible en código/configuración o reproducido en esta sesión.
«Riesgo» requiere una prueba específica antes de afirmarlo como bug de ejecución.
P1 indica bloqueo de preparación para 1.0; no implica que hoy toda la funcionalidad falle.

| ID    | Prioridad / estado        | Evidencia e implicación                                                                                                                                                                                                                                                      | Entrega                 |
| ----- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| V1-01 | P1 · confirmado           | `coverage` vive en configs de proyectos; la raíz solo declara `projects`. No hay thresholds. La ejecución genera un informe global en `coverage/`, no los directorios por proyecto declarados. No existe una puerta que impida bajar cobertura.                              | 0.6                     |
| V1-02 | P1 · confirmado           | El smoke externo llama `npx tsc --noEmit`, usa `skipLibCheck: true` y no instala compiler-cli. Valida instalación y uso TypeScript, pero no compila templates Angular ni ejecuta la app. El comentario del fixture atribuye al chequeo más de lo que hace.                   | 0.6 / 0.10              |
| V1-03 | P1 · confirmado           | La demo resuelve las libs a `src/public-api.ts` y tiene `ssr: false`. Sus E2E no prueban runtime de tarballs ni hidratación. Los tests SSR revisados usan un Document simulado.                                                                                              | 0.10                    |
| V1-04 | P1 · confirmado           | Manifiestos en `0.5.0`; changelog hasta `0.4.0` con Unreleased vacío; STATE abre con auditoría de `0.4.0`. Hay cambios incompatibles documentados internamente que necesitan una migración de release visible.                                                               | 0.6                     |
| V1-05 | P1 · confirmado           | El job validado usa `build:lib` y copia README/LICENSE. El job publish reconstruye con `ng build` en otro checkout, sin esas copias ni reutilización de los tarballs verificados; `ng-package.json` no declara esos assets. No se garantiza el mismo contenido distribuido.  | 0.11                    |
| V1-06 | P1 · confirmado           | El workflow publica con el tag npm por defecto y crea releases con `--latest`; no distingue beta/RC. Cualquier fallo de `npm view` se interpreta como versión nueva. Necesita canales y manejo de errores antes de usar prereleases.                                         | 0.11, antes de beta     |
| V1-07 | P1 · hueco confirmado     | Hay muchos exports, incluidos helpers/defaults/servicios, pero no un inventario de estabilidad ni un diff completo de contratos. `verify-build` busca un subconjunto de nombres; no detecta cambios en firmas o contratos DOM/eventos.                                       | 0.6                     |
| V1-08 | P1 · decisión de producto | Los controles no tienen adaptadores `ControlValueAccessor`/`NG_VALUE_ACCESSOR`; `CHANGELOG` aplaza Forms deliberadamente. No es un bug respecto al contrato actual, pero limita integración convencional en formularios Angular. Decidir y documentar antes de congelar API. | Diseño 0.6, entrega 0.9 |
| V1-09 | P1 · hueco confirmado     | No hay automatización axe en las dependencias/suites revisadas ni evidencia versionada de revisión manual con lectores. Los E2E actuales sí comprueban ARIA/foco en varios casos; eso no cubre accesibilidad completa.                                                       | 0.7–0.10                |
| V1-10 | P1 · riesgo               | Dialog instala un focus trap por instancia en `document`; Overlay usa un portal compartido. No se encontraron E2E de Dialog→Dialog o Dialog→Select/Menu. Investigar competencia entre traps, pertenencia de portales a capas y aislamiento modal del fondo.                  | 0.7 / 0.8               |
| V1-11 | P1 · confirmado           | CLI `copyFiles` usa `copyFileSync` sobre el destino sin comprobar archivos existentes. Repetir `add` puede sobrescribir modificaciones del consumidor. Los specs actuales prueban copia/imports, no una política segura de actualización.                                    | 0.10                    |
| V1-12 | P2 · confirmado           | `engines.node >=20` es más amplio que la compatibilidad de Angular 21. CI usa Node 22; no hay matriz mínimo/máximo para el rango declarado. Definir toolchain y limitar promesas.                                                                                            | 0.10                    |
| V1-13 | P1 · riesgo               | 26 archivos usan contadores de IDs a nivel de módulo. No prueba por sí mismo un fallo de hidratación, pero exige probar múltiples renders SSR en un proceso, IDs/ARIA y reinicio del cliente.                                                                                | 0.10                    |
| V1-14 | P2 · confirmado           | Faltan E2E dedicados de interacción de Drag & Drop y Virtual Scroll en las suites revisadas; navegar a su página no demuestra la interacción. Si entran en 1.0, cubrirlos expresamente.                                                                                      | 0.7 / decisión 0.6      |

La cobertura es una opción global en la ejecución con proyectos de
[Vitest 4](https://v4.vitest.dev/guide/projects); `coverage.all` fue retirado en su
[migración a v4](https://v4.vitest.dev/guide/migration#coverage-changes). Corregir configuración
antes de elevar porcentajes. Angular utiliza su compilador y linker para bibliotecas en
[Angular Package Format](https://angular.dev/tools/libraries/angular-package-format): ejecutar
solo TypeScript no verifica esos pasos. La
[tabla de compatibilidad de Angular](https://angular.dev/reference/versions) especifica para
21.x Node `^20.19.0 || ^22.12.0 || ^24.0.0`; no todo Node `>=20` satisface ese rango.

## Contratos concretos que merecen revisión

- **Focus:** `isFocusable` devuelve true para un div normal y no recorre ancestros con
  `display:none`. Está exportada públicamente. Definir si pretende medir visibilidad,
  capacidad de recibir foco o recorrido secuencial; añadir pruebas del contrato elegido.
  [Implementación](../../packages/core/src/focus/focus.ts).
- **Overlay:** no registra resize; `updatePosition` es manual salvo el posicionamiento inicial.
  Determinar y comprobar la conducta ante cambios de viewport/contenido y destrucción del host.
  [OverlayRef](../../packages/core/src/overlay/overlay-ref.ts).
- **Ref y eventos:** DialogRef es de un uso y reproduce su cierre; OverlayRef es reutilizable
  y no lo reproduce. Esa diferencia tiene sentido. Estabilizar semántica y documentación,
  no homogeneizar mecánicamente APIs con ciclos de vida distintos.
- **SSR:** una guardia que evita DOM en servidor no demuestra que el HTML inicial y la
  interacción tras hidratación sean correctos. Probarlo con un consumidor empaquetado.
- **Accesibilidad de Dialog:** los modales deben gestionar foco, nombre e interacción del fondo.
  Comprobar composición y responsabilidad del consumidor frente al
  [patrón oficial WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Verificación realizada

| Comprobación           | Resultado de esta revisión                                                    |
| ---------------------- | ----------------------------------------------------------------------------- |
| `pnpm typecheck`       | Correcto                                                                      |
| `pnpm lint`            | Correcto                                                                      |
| `pnpm format:check`    | Correcto sobre el checkout original                                           |
| `pnpm test:coverage`   | 49 archivos, 358 tests correctos, incluidos libs/app/CLI                      |
| `pnpm build:lib`       | Correcto para ambos paquetes                                                  |
| `pnpm verify:build`    | Correcto                                                                      |
| Build de demo          | Correcto como parte de `pnpm e2e`                                             |
| `pnpm e2e`             | 258 ejecuciones correctas: 86 casos × Chromium/Firefox/WebKit; 45,4 s         |
| `pnpm verify:consumer` | Correcto: instalación externa de tarballs y `tsc --noEmit`; no AOT ni runtime |

La primera ejecución E2E no pudo abrir el puerto local por el sandbox (`EPERM`). La ejecución
con permisos para el servidor local terminó correctamente; no se considera defecto del producto.

Cobertura informada por la configuración **actual**, no una certificación del catálogo:

| Conjunto                      | Statements | Branches | Functions |
| ----------------------------- | ---------- | -------- | --------- |
| Global reportado              | 90,83 %    | 75,26 %  | 93,29 %   |
| Core, agregado del JSON       | 93,48 %    | 79,98 %  | 93,96 %   |
| Primitives, agregado del JSON | 90,07 %    | 72,10 %  | 92,97 %   |

El global informa 90,88 % de líneas. Las agregaciones por paquete suman contadores cubiertos
y totales de `coverage/coverage-final.json`, no promedios de porcentajes de archivos. El informe
incluye, por ejemplo, `public-api.ts`, pese a las exclusiones declaradas en configs de proyecto.
Las ramas transformadas por Angular pueden afectar cifras por archivo: revisar su atribución
antes de deducir qué casos faltan. Los porcentajes no sustituyen la matriz de requisitos.

Los logs de esta sesión están en `/tmp/quartz-v1-*.log`; son temporales, no artefactos persistentes
de CI. No se han ejecutado pruebas manuales con lectores de pantalla ni medido bundles consumidores.
Pasar esta suite una vez no demuestra ausencia de flakiness.

## Decisión recomendada

Avanzar a una **0.6 de contratos y garantías**, seguida de minors por familia y una etapa
explícita de consumo externo. Conservar la arquitectura, mejorar la evidencia y publicar 1.0
solo cuando todo lo que se mantenga público cumpla el contrato. El
[roadmap](../../ROADMAP.md) define alcance candidato, decisiones, dependencias y aceptación.
