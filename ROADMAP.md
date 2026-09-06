# Roadmap hacia Quartz Headless 1.0

> Plan activo · 2026-09-06 · 0.6 preparado para release, siguiente fase: 0.7 Core.
> Este documento recoge el camino restante hacia 1.0; el hito 0.6 queda archivado en
> [0.6 acceptance](docs/releases/0.6-acceptance.md).
> Evidencias y resultados: [diagnóstico técnico](docs/releases/V1_AUDIT.md).
> Encargos por minor, reparto de responsabilidades y protocolo para modelos:
> [manual de ejecución](docs/roadmap/README.md).

## 1. Objetivo de producto

Publicar dos bibliotecas Angular que otro equipo pueda instalar, integrar en su sistema de
diseño y actualizar con confianza. La 1.0 debe garantizar una API documentada, comportamiento
accesible verificado, compatibilidad declarada y releases reproducibles.

No hace falta ampliar el catálogo: hoy existen **10 áreas de Core y 20 de Primitives**.
La prioridad es reducir incertidumbre en lo que se promete mantener.
Una 1.0 no garantiza ausencia absoluta de bugs; sí contratos explícitos, evidencias repetibles
y un proceso fiable para corregir regresiones sin romper a los consumidores.

## 2. Alcance recomendado

Congelar desde ahora la incorporación de nuevos componentes. Clasificar cada export, no solo
cada carpeta, antes de empezar la siguiente familia. Estas categorías son una **propuesta**;
el código actual sigue exportando todo el catálogo.

| Paquete    | Núcleo candidato para 1.0                                                                             | Candidatos condicionados a necesidad y coste de estabilización        |
| ---------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Core       | Overlay, Focus, Dismiss, Scroll Lock, Collection, Directionality, Viewport                            | Drag & Drop, Virtual Scroll, Splitter                                 |
| Primitives | Dialog, Tooltip, Popover, Menu, Listbox, Select, Tabs, Accordion, Checkbox, Switch, RadioGroup, Toast | Combobox, Tree, Slider, Toggle, ToggleGroup, Sidebar, Navbar, Stepper |

El núcleo permite construir formularios, navegación, confirmaciones y superficies flotantes
sin depender de las áreas más complejas. La categoría condicionada no implica que el código
sea malo: Toggle, por ejemplo, es sencillo; Tree y Combobox tienen muchos más estados.
Se trata de limitar compromisos, no de clasificar calidad por tamaño.

**Decisión registrada en 0.6:** para cada candidato condicionado, elegir una de estas salidas:

1. Incluirlo en 1.0 porque un consumidor lo necesita y asignarle los mismos criterios de
   estabilidad y pruebas que al núcleo, dentro de su familia correspondiente.
2. Retirarlo de los exports de la futura 1.0 durante la etapa 0.x, con guía de migración.
   Los usuarios actuales pueden mantener temporalmente su versión 0.5/0.6; no prometer soporte
   indefinido de esa línea. Si existe demanda activa de evolución, valorar una distribución
   experimental independiente `0.x`, con mantenimiento explícito.

No basta con escribir «experimental» junto a un export que permanece en la API estable.
No crear otro paquete ni borrar componentes durante esta planificación. Registrar primero
consumidores, coste de migración y decisión. Si se conserva todo el catálogo, todo deberá
cumplir los criterios; no exigir nuevos componentes para compensar exclusiones.

## 3. Política de versiones y scopes

- Mantener Core y Primitives sincronizados, como establece el proyecto. Verificar también el
  rango peer de Core y el lockfile. Sincronizar números no obliga a modificar ambos paquetes.
- Antes de 1.0, reservar los cambios incompatibles para minors anunciados, con migración.
  Usar patches para correcciones compatibles. Esta es la política propuesta del proyecto,
  más estricta que la libertad que permite SemVer durante `0.x`.
- Después de 1.0: patch para correcciones compatibles, minor para capacidades compatibles,
  major para cambios incompatibles. Una corrección que cambia un contrato público también
  necesita evaluación de compatibilidad. [Referencia: SemVer](https://semver.org/spec/v2.0.0.html).
- Una minor cierra un objetivo principal. Cada PR contiene un contrato o comportamiento,
  sus pruebas y su documentación. Evitar PRs que mezclen renombrados, nuevas features y CI.
- Los tests se entregan **junto a cada cambio**. La etapa de integración completa las pruebas
  entre paquetes y entornos; no es una fase final para empezar a probar.
- No hay obligación de saltar de `0.9` a `1.0`: `0.10` y `0.11` son versiones válidas.

| Scope de trabajo/PR   | Responsabilidad                                                       |
| --------------------- | --------------------------------------------------------------------- |
| `api`                 | Exports, contratos, defaults, modelos, eventos, tipos y deprecaciones |
| `core/<area>`         | Una infraestructura de interacción y su ciclo de vida                 |
| `primitives/<family>` | Flotantes, selección, controles, disclosure o feedback                |
| `testing`             | Cobertura, infraestructura E2E y fixtures de consumidores             |
| `compat`              | Angular, SSR/hidratación, plataformas y empaquetado                   |
| `cli`                 | Copia de fuentes, validación y seguridad de archivos existentes       |
| `release`             | Artefactos, versiones, canales, publicación y recuperación            |
| `docs`                | Instalación, contratos, ejemplos, migraciones y soporte               |

Estos scopes organizan issues y PRs; no obligan a crear nuevos paquetes ni entry points.

## 4. Secuencia de entregas

| Versión objetivo | Resultado principal                            | Dependencia                      | Puerta de salida                                                    |
| ---------------- | ---------------------------------------------- | -------------------------------- | ------------------------------------------------------------------- |
| `0.7.0`          | Core consolidado                               | Contratos de 0.6 cerrados        | Ciclo de vida, foco, capas y geometría verificados                  |
| `0.8.0`          | Flotantes y feedback consolidados              | Core de 0.7                      | Dialog, Tooltip, Popover, Menu y Toast funcionan también compuestos |
| `0.9.0`          | Selección, controles y navegación consolidados | 0.7 y contratos de 0.8           | Estado, teclado y formularios tienen contratos comprobados          |
| `0.10.0`         | Consumo real, SSR e hidratación                | Familias incluidas estabilizadas | Tarballs compilados y ejecutados fuera del monorepo                 |
| `0.11.0`         | Distribución, documentación y API congelada    | Matriz de 0.10                   | Publicación ensayada y migración completa                           |
| `1.0.0-beta.N`   | Validación en proyectos consumidores           | Congelación de 0.11              | Dos integraciones independientes completadas                        |
| `1.0.0-rc.N`     | Candidato exacto verificable                   | Beta aceptada                    | Matriz completa en verde sobre el artefacto candidato               |
| `1.0.0`          | Promesa de estabilidad                         | RC aceptada                      | Mismos contratos y checklist final firmado                          |

Las versiones son objetivos, no fechas comprometidas. No publicar una minor para cumplir
calendario si su puerta de salida sigue abierta. Los defectos de una familia se corrigen allí;
no se trasladan automáticamente al siguiente hito.

### 0.7.0 — Core: comportamiento y ciclo de vida

**Scopes:** `core/focus`, `core/dismiss`, `core/overlay`, `core/collection`, `core/viewport`.

- **CORE-01:** precisar foco programático frente a recorrido con Tab. Cubrir ancestros ocultos,
  `inert`, disabled, contenedores vacíos, destino eliminado y restauración. La función pública
  `isFocusable` necesita un contrato coherente con su nombre y sus consumidores.
- **CORE-02:** probar coordinación de capas: varias instancias, una sola capa responde a
  Escape/outside-pointer, portales hijos, foco de la capa superior y locks anidados.
  Resolver aislamiento del fondo de los modales y excepciones para portales relacionados.
- **CORE-03:** definir qué hace Overlay ante resize, cambio de tamaño de contenido/ancla,
  scroll, ancla eliminada y destroy del host. Implementar la estrategia necesaria sin
  añadir opciones especulativas. Cancelar callbacks pendientes y evitar DOM/listeners residuales.
- **CORE-04:** especificar recuperación de Collection cuando desaparece o se deshabilita el
  elemento activo, orden DOM, selección, typeahead, orientación y cambios de RTL en ejecución.
- **CORE-05:** verificar Viewport y Directionality con distintas instancias/documentos y
  limpieza de listeners. Definir el primer render SSR; la hidratación real se prueba en 0.10.
- Si Splitter, Drag & Drop o Virtual Scroll entran: asignar contratos y pruebas de interacción,
  cancelación, límites y destrucción aquí. DnD no puede prometer operación completa por teclado
  mientras solo ofrece el modelo nativo de arrastre. Si no caben, resolver alcance, no bajar el listón.

**Aceptación:** cada fallo confirmado tiene regresión unitaria; geometría, foco y composición
tienen E2E en tres motores; no quedan recursos de una instancia tras destruirla; contratos
de Core aprobados. Sin nueva abstracción pública salvo necesidad demostrada de dos consumidores.

### 0.8.0 — Superficies flotantes y feedback

**Scopes:** `primitives/floating`, `primitives/feedback`.

- **FLOAT-01:** Dialog: nombre accesible, contenido sin controles, apertura/cierre programáticos,
  restauración, navegación de ruta, doble cierre, modales anidados y popup dentro del modal.
  Decidir si los resultados tipados de `DialogRef` son necesarios para los consumidores;
  no posponer una decisión incompatible hasta después de 1.0.
- **FLOAT-02:** Tooltip: hover/focus, Escape, timers, trigger destruido y relación con el nombre
  o descripción accesible. Documentar Popover como alternativa para contenido interactivo.
- **FLOAT-03:** Popover/Menu: orden de eventos, cierre por cada causa, selección de items,
  submenús, checkbox/radio items, teclado, RTL, contenido dinámico y portales.
- **FEED-01:** Toast: anuncios por severidad, duración, pausa al interactuar, cierre manual,
  limpieza de timers y varias notificaciones. Documentar qué garantiza Quartz y qué debe
  aportar la aplicación para mensajes accionables y nombres accesibles.
- Asegurar hooks de estilos suficientes sin imponer colores, fuentes ni presentación visual.

**Aceptación:** unidades y E2E de cada contrato, más recorridos Dialog→Menu/Select y
Dialog→Dialog; nombres y anuncios revisados; cierre exactamente una vez cuando corresponda;
sin foco, scroll bloqueado ni timers residuales tras abandonar la ruta.

### 0.9.0 — Selección, controles y navegación

**Scopes:** `primitives/selection`, `primitives/controls`, `primitives/disclosure`.

- **SELECT-01:** Listbox/Select: identidad de objetos, selección inicial, valor no presente,
  options que llegan/desaparecen, disabled, typeahead, eventos y sincronización externa.
- **CTRL-01:** Checkbox/Switch/RadioGroup: interacción nativa del host, teclado, estado
  controlado, disabled y estados especiales. Entregar los adaptadores de Forms diseñados en
  0.6: escritura externa, `valueChanges`, touched/blur, reset, validación y disabled sin bucles
  ni dobles emisiones. Probar dentro de un formulario consumidor real.
- **NAV-01:** Tabs/Accordion: activación manual/automática, orientation/RTL, cambios dinámicos,
  IDs y relaciones ARIA, paneles ocultos, foco y preservación de estado.
- Si entran Combobox/Tree: incluir IME, carga asíncrona, resultados obsoletos, errores y retry,
  cancelación y nodos/opciones deshabilitados. Si entran Slider/Toggle/ToggleGroup: límites,
  paso decimal, pointer capture o selección múltiple según corresponda. Si entran
  Sidebar/Navbar/Stepper: responsive, foco, rutas y estados de navegación. Abrir issues
  separados por comportamiento; dividir esta entrega en minors adicionales si el alcance crece.

**Aceptación:** todos los controles seleccionados funcionan en un formulario de consumo;
teclado y RTL verificados en browser; cada cambio externo/interno tiene la emisión definida;
cada área opcional incluida tiene responsable y evidencia equivalente.

### 0.10.0 — Compatibilidad y consumo fuera del repositorio

**Scopes:** `compat`, `testing`, `cli`.

- **COMPAT-01:** evolucionar el smoke de tarballs a una app Angular externa: AOT con
  `strictTemplates`, build de producción y ejecución E2E. Solo imports públicos, sin aliases
  a fuentes ni symlinks del workspace. Cubrir cada familia incluida, no solo importar clases.
- **COMPAT-02:** fixture SSR real con hidratación y varias peticiones en el mismo proceso:
  IDs/ARIA, estado inicial, Viewport, render condicional, portales y destroy. Verificar consola,
  DOM e interacción después de hidratar. Un mock con `defaultView: null` no sustituye esto.
- **COMPAT-03:** fijar versiones exactas de CI para el mínimo y el extremo superior del rango
  Angular declarado, Node y TypeScript compatibles. Hoy los peers son `^21.0.0`: no anunciar
  Angular 22+ sin ampliar y verificar esa matriz. Ajustar `engines` a lo que realmente se soporta.
- **COMPAT-04:** controlar tree shaking con builds de consumidores representativos y presupuestos
  de incremento frente a una app vacía equivalente. Comprobar que no se duplica Core ni se
  arrastran dependencias visuales de la demo. Medir antes de fijar límites numéricos.
- **CLI-01:** comprobar copia y compilación Angular fuera del repo. Repetir el comando sobre
  archivos modificados: rechazar sobrescritura por defecto y hacer explícita su autorización.
  Validar argumentos, componentes desconocidos, archivos faltantes y dependencias transitivas.
  Mantener documentado el uso desde checkout; una CLI publicada independiente puede esperar.

**Aceptación:** fixtures reproducibles con tarballs, matriz de compatibilidad en CI,
SSR→hidratación→interacción en verde y pruebas CLI de conservación de archivos existentes.
No confundir «E2E de la documentación» con «E2E del producto empaquetado».

### 0.11.0 — Release reproducible, documentación y congelación

**Scopes:** `release`, `docs`, `api`.

- **REL-01:** construir una vez, empaquetar, verificar e instalar los mismos tarballs que se
  publicarán. El job de publicación debe reutilizar ese artefacto o verificar identidad.
  Incluir README y LICENSE en ambos; eliminar divergencias entre el build validado y el publicado.
- **REL-02:** verificar versiones sincronizadas, peer range y changelog antes de publicar.
  Distinguir «versión inexistente» de error de red/autenticación al consultar npm. Definir
  recuperación si Core se publica y Primitives falla; no regenerar ni sobrescribir versiones.
- **REL-03:** separar explícitamente prereleases (`next`, GitHub prerelease) de estable (`latest`).
  El workflow actual no distingue esos canales. Documentar promoción, hotfix, deprecación y
  recuperación de una release defectuosa mediante una versión posterior.
- **DOC-02:** guía inicial que compile, API por área, ejemplos accesibles, composición,
  integración con Forms, SSR, CSS hooks, limitaciones, troubleshooting y migración `0.5→1.0`.
  Aclarar responsabilidades del consumidor: estilos, nombres, contenido y errores de negocio.
- **DOC-03:** política de soporte y compatibilidad, contribución, reporte reproducible de bugs,
  criterios de aceptación y canal para vulnerabilidades. Evitar prometer tiempos de atención
  que el equipo no pueda mantener.
- **API-05:** congelar todos los contratos incluidos, también DOM documentado y eventos.

**Aceptación:** ensayo completo sin publicar de forma accidental, tarballs revisados,
documentación sincronizada y migración probada. Ninguna pregunta sobre contratos queda para RC.

### Beta, RC y 1.0

**Beta:** integrar paquetes instalados desde el canal de pruebas en dos proyectos fuera del
workspace: al menos una app de formularios/CRUD y una integración con SSR/hidratación.
Pueden pertenecer al mismo equipo, pero no depender de aliases ni de dependencias de la demo.
Registrar feedback, versión exacta, escenarios y resolución. Proponer un mínimo de dos semanas
de uso antes de RC; el tiempo transcurrido por sí solo no constituye aceptación.

**RC:** solo correcciones de bloqueantes, documentación y validación. Si cambia un contrato,
actualizar migración y repetir beta de los flujos afectados. Cero tests flaky conocidos en la
suite de release: cinco ejecuciones completas consecutivas sin retries sobre el candidato,
además de revisar el historial de CI. Guardar trazas y resultados; los retries no borran fallos.

**1.0:** publicar cuando todos los requisitos siguientes se cumplan, sin añadir funcionalidades
en la promoción final:

- [ ] Todos los exports incluidos figuran en el contrato y están documentados.
- [ ] Cero defectos abiertos que rompan contratos de la API estable; cero P0/P1 pendientes.
- [ ] El 100 % de los requisitos aplicables tiene evidencia unitaria, de integración o E2E.
- [ ] Todas las áreas interactivas tienen E2E de sus flujos críticos, incluidas composiciones.
- [ ] Matriz de compatibilidad, empaquetado, AOT y SSR/hidratación en verde.
- [ ] Pruebas automáticas de accesibilidad y revisión manual con tecnologías de asistencia.
- [ ] Dos integraciones consumidoras aceptadas, sin parches locales necesarios en Quartz.
- [ ] Artefactos, canales npm, changelog y guía de migración revisados.
- [ ] Responsable de release identificado y procedimiento de hotfix ensayado.

## 5. Qué significa «todo cubierto»

No equivale a un porcentaje global alto ni a un archivo spec junto a cada archivo fuente.
Cada requisito debe tener una prueba que falle al romper el comportamiento prometido.

| Dimensión      | Evidencia mínima donde aplique                                                  |
| -------------- | ------------------------------------------------------------------------------- |
| API y tipos    | Imports públicos, inferencia, bindings válidos/erróneos, declarations revisadas |
| Estado         | Inicial, interacción, actualización externa, reset, disabled, valores límite    |
| Eventos        | Orden, payload, número de emisiones y distinción programático/usuario           |
| Ciclo de vida  | Open/close repetido, destroy abierto, ruta, cancelación, cleanup                |
| Teclado y foco | Tab/Shift+Tab, flechas, Home/End, Escape, typeahead, restauración               |
| Accesibilidad  | Nombre, roles/estados, relaciones ARIA, anuncios y revisión manual              |
| Composición    | Múltiples instancias, overlays anidados, foco superior y scroll locks           |
| Plataforma     | Tres motores, viewport móvil, RTL dinámico, SSR/hidratación                     |
| Distribución   | Tarball externo, AOT, runtime, dependencias, CLI y upgrade                      |

**Objetivos propuestos de cobertura para 1.0**, recalculados después de corregir la configuración:
por paquete, ≥95 % statements/lines/functions y ≥90 % branches; por archivo de lógica,
≥90 % statements/lines/functions y ≥85 % branches. Para Focus, Dismiss, Scroll Lock y rutas
de cleanup, cubrir el 100 % de los escenarios críticos especificados. Son metas del proyecto,
no una norma universal ni prueba de accesibilidad.

0.6 deja un baseline correcto que no puede empeorar; elevarlo por familia hasta esos objetivos.
Revisar ramas generadas por Angular y excluir únicamente código generado,
declaraciones sin ejecución y barrels con justificación. Nunca ocultar lógica propia para
alcanzar el número. Cualquier exclusión se revisa; un fallo de contrato no queda dispensado
por cumplir porcentajes.

Las pruebas automáticas de accesibilidad se complementan con teclado y combinaciones
documentadas de lector/navegador, por ejemplo NVDA/Firefox y VoiceOver/Safari. Registrar
versiones y alcance; no anunciar certificación general WCAG a partir de un escáner.
[WAI-ARIA APG: comprobación de patrones](https://www.w3.org/WAI/ARIA/apg/).

## 6. Gestión del trabajo

Crear un milestone por versión y un issue por ID de este documento. Usar estados
`por definir → preparado → en desarrollo → en validación → cerrado`. Asignar una persona
responsable de cada issue y una revisión explícita para cambios de contrato; en un proyecto
individual, separar la revisión del momento de implementación.

Cada issue debe contener problema y consumidor afectado, contrato esperado, alcance excluido,
dependencias, impacto SemVer, criterios comprobables, pruebas necesarias y documentación.
No cerrar un issue únicamente porque el código esté escrito.

Ejemplo: **CORE-03 / Overlay ante resize**. Reproducir el popup desalineado; decidir y documentar
reposicionamiento/cierre; implementar; comprobar coordenadas en Chromium/Firefox/WebKit;
verificar cleanup tras destroy; actualizar docs. No mezclarlo con un renombrado general de API.

Prioridad: **P0** bloqueo grave/crash/pérdida de interacción; **P1** ruptura de contrato,
accesibilidad esencial o instalación; **P2** mejora compatible; **P3** ampliación.
Reclasificar como bloqueante cualquier P2 anterior que impida cumplir la promesa concreta de 1.0.

No fijar una fecha de 1.0 hasta medir 0.7 y 0.8 con los contratos ya preparados. Estimar cada
familia según los exports que se mantienen; reservar capacidad de cada entrega para regresiones y
feedback. Si hay que recortar, recortar alcance antes de recortar validación.

## 7. Primer ciclo de ejecución

1. Abrir **0.7 Core** desde los contratos de `docs/ai/specs/v1-core-contract.md`.
2. Resolver primero Focus, Dismiss/Layering, Overlay lifecycle y Viewport SSR.
3. Mantener Splitter, Drag and drop y Virtual scroll como candidatos condicionales hasta que
   tengan contrato y evidencia equivalente.
4. Preparar los checks de API/tipos que quedaron como siguiente paso de tooling.
5. Cerrar 0.7 solo con cobertura, unit tests, build y E2E de composición pertinentes.

El trabajo de esta revisión termina en el diagnóstico y esta propuesta. La implementación
de los milestones, cambios de API y publicaciones son trabajos posteriores.

## 8. Planes de trabajo para los modelos implementadores

Leer únicamente la minor activa y la tarea asignada, además del contexto obligatorio del
repositorio. Un modelo no recibe «hacer 0.7 entera»: recibe, por ejemplo, `07-03`, con contrato
resuelto, archivos permitidos y aceptación concreta. Los encargos se detallan aquí:

| Documento                                                              | Encargos                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| [Responsabilidades y protocolo](docs/roadmap/README.md)                | Cómo asignar, implementar, revisar y transferir trabajo |
| [0.7 — Core](docs/roadmap/0.7-core.md)                                 | `07-01` a `07-08`                                       |
| [0.8 — Flotantes y feedback](docs/roadmap/0.8-floating.md)             | `08-01` a `08-07`                                       |
| [0.9 — Selección y controles](docs/roadmap/0.9-controls.md)            | `09-01` a `09-08`                                       |
| [0.10 — Consumidores y compatibilidad](docs/roadmap/0.10-consumers.md) | `10-01` a `10-08`                                       |
| [0.11 — Release y congelación](docs/roadmap/0.11-release.md)           | `11-01` a `11-07`                                       |
| [Beta → RC → 1.0](docs/roadmap/1.0-validation.md)                      | `V1-REL-01` a `V1-REL-05`                               |

Los números de tarea identifican encargos; no indican que ya estén implementados o aprobados.
