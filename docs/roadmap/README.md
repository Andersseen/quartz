# Manual de ejecución del roadmap 1.0

> Estado actual: **0.6 preparado para release; siguiente minor activa: 0.7 Core**.
> Fecha: 2026-09-05. Este directorio contiene documentación, no autorización para publicar.
> Estrategia y alcance: [ROADMAP](../../ROADMAP.md). Evidencias: [diagnóstico](../releases/V1_AUDIT.md).

## 1. Cómo usar este plan con modelos pequeños

El orquestador conserva la visión del producto, resuelve decisiones y entrega encargos
acotados. El implementador ejecuta un contrato, no diseña la biblioteca completa.
El revisor comprueba comportamiento y alcance sin asumir que un resultado verde prueba todo.
Son responsabilidades: no requieren tres personas ni tres modelos concurrentes.

**No lanzar todas las fases a la vez.** Completar la puerta de salida de una minor antes de
integrar cambios dependientes de la siguiente. No delegar a un modelo económico decisiones
abiertas de API, diseño de foco modal o compatibilidad de paquetes.

## 2. Reparto de responsabilidades

| Rol                               | Decide / entrega                                                                                      | No le corresponde                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Responsable de producto           | Alcance 1.0, consumidores objetivo, exclusiones, compromiso de soporte                                | Elegir detalles internos de cada bug fix                              |
| Orquestador / responsable técnico | Contratos, dependencias, especificaciones, asignación, impacto SemVer y cierre de gates               | Dar por terminado trabajo sin evidencia                               |
| Implementador                     | Cambio mínimo, regresiones, ejemplo/documentación de su contrato y registro de comandos               | Cambiar API, dependencies o archivos compartidos fuera del encargo    |
| Revisor                           | Contrastar spec→diff→pruebas; buscar regresiones y sobrealcance                                       | Completar silenciosamente requisitos omitidos por el implementador    |
| Integrador / QA                   | Compatibilidad entre tareas, suites completas, fixtures externos, accesibilidad y aceptación de minor | Sustituir pruebas de cada tarea con una revisión superficial al final |
| Responsable de release            | Artefactos, versionado, canales y publicación expresamente autorizada                                 | Publicar automáticamente porque terminó un encargo de desarrollo      |

Una misma persona puede asumir varios roles en momentos distintos. El trabajo mecánico y los
casos de prueba aislados son buenos encargos para modelos pequeños. Reservar revisión de
contratos y decisiones transversales al responsable técnico.

## 3. Jerarquía de documentos y decisiones

1. Instrucciones y autorizaciones vigentes del usuario y `AGENTS.md`.
2. Especificación aprobada del encargo, compatible con las decisiones de alcance.
3. [ROADMAP](../../ROADMAP.md) para objetivos y gates; ficha de minor para orden operativo.
4. Código/tests reales como evidencia del estado actual; el diagnóstico es una fotografía.

El [WORKFLOW existente](../ai/WORKFLOW.md) pide aprobar la especificación antes de cambios
mayores que un bug fix: «REVIEW → the user approves/edits the spec». El responsable técnico
prepara primero una spec concreta y registra esa aprobación o la autorización ya existente;
no solicitar otra vez aprobación de una decisión ya autorizada. Este roadmap sigue siendo
una propuesta: no simular que sus decisiones abiertas están aprobadas.

Cuando código, spec y docs discrepen, describir la discrepancia y devolverla al orquestador.
No elegir el comportamiento más fácil ni modificar tests para hacer pasar un contrato distinto.

## 4. Contexto que recibe cada encargo

Lectura común: `AGENTS.md`, referencia RTK, `docs/ai/CONTEXT.md`, estado vigente de la tarea en
`docs/ai/STATE.md`, reglas pertinentes de `BEST_PRACTICES.md` y sección aplicable de
`ARCHITECTURE.md`. Añadir solo la ficha de minor, spec aprobada, implementación y specs de su
área. No cargar toda la auditoría ni todas las fichas en cada sesión.

El orquestador prepara un paquete de contexto con:

- ID de tarea, commit de partida y dependencias cerradas.
- Problema y un ejemplo observable de antes/después.
- Contrato aprobado, incluyendo casos límite y decisiones que no debe reinterpretar.
- Lista concreta de archivos editables, archivos solo de lectura y excepciones autorizadas.
- Casos de aceptación, comandos pertinentes y entregable esperado.
- Estado de archivos compartidos y quién los integra.

Las carpetas señaladas en cada ficha son el área de referencia. **Antes de asignar**, el
orquestador reduce ese área a la lista exacta de archivos del encargo; no concede escritura
indiscriminada sobre todo `packages/` o toda la demo.

## 5. Tamaño y orden del trabajo

Cada encargo tiene un solo comportamiento principal. Si una tarea requiere decisiones de
otra familia o cambia varias máquinas de estado, dividirla en subtareas `XX-YY.a`, `.b`, etc.
Una tarea de diseño puede producir varias specs; no es una orden de implementar todas juntas.

Para cada comportamiento:

1. Reproducir o demostrar el hueco de garantía.
2. Escribir la spec y sus casos de aceptación; resolver decisiones antes de implementar.
3. Para un bug confirmado, añadir la regresión que falla por ese bug, no por configuración.
4. Implementar el cambio mínimo y actualizar el ejemplo/documentación afectados.
5. Ejecutar verificación focalizada, después los checks exigidos por el repositorio.
6. Revisar el diff y entregar evidencia. El orquestador decide integración y cierre.

No abrir refactors de estilo al arreglar comportamiento. Si un hallazgo nuevo no pertenece al
encargo, registrarlo con reproducción/prioridad y continuar el trabajo independiente. Si invalida
el contrato asignado, marcar ese encargo bloqueado por decisión y devolverlo al orquestador.

## 6. Archivos con un único integrador

`public-api.ts`, `cli/registry.js`, manifiestos, lockfile, configs de build/tests,
`.github/workflows/deploy.yml`, `CHANGELOG.md`, `STATE.md` y navegación compartida de la demo
tienen un único escritor por lote. Los implementadores describen el cambio necesario en su
entrega si no tienen esos archivos asignados. No editar el mismo E2E monolítico simultáneamente.

Puede haber trabajo independiente sobre specs o carpetas distintas cuando el contrato común
esté cerrado y exista autorización para trabajo paralelo. La independencia se decide por
archivos y dependencias; no por el mero hecho de tener modelos disponibles.

## 7. Verificación sin desperdiciar trabajo

Durante implementación, empezar por el spec afectado. Core debe estar construido antes de
probar Primitives con resolución real por `node_modules`. Para cerrar cambios de biblioteca,
cumplir `pnpm typecheck` y `pnpm test`, además del lint y del E2E pertinente cuando corresponda.
Al cerrar una minor, el integrador ejecuta la suite completa y checks de build/consumo disponibles.

Respetar el prefijo `rtk` de `AGENTS.md`; por ejemplo, `rtk proxy pnpm typecheck` y
`rtk proxy pnpm exec vitest run <spec>`. Estos son comandos de verificación, no órdenes de
publicar. No ejecutar `publish:lib` ni `pages:deploy` como parte de una comprobación.

No repetir suites completas por cada cambio de una frase. Si una herramienta está bloqueada,
registrar el bloqueo y el comando no verificado; no declarar «todo verde» por inferencia.

## 8. Plantilla de encargo para copiar a otro modelo

> Implementa únicamente **[ID / título]**, desde **[commit]**.
>
> Objetivo observable: **[antes → después]**.
> Spec aprobada: **[ruta + estado/aprobación]**.
> Dependencias cerradas: **[IDs + evidencia]**.
> Lee: **[contexto común + archivos concretos]**.
> Puedes editar: **[lista exacta]**.
> Mantén: **[contratos/invariantes que no deben cambiar]**.
> No incluye: **[features/refactors/exports fuera de scope]**.
> Aceptación: **[casos numerados, incluido el fallo o borde principal]**.
> Verificación: **[comandos focalizados y checks obligatorios]**.
>
> Si falta una decisión de contrato, describe el caso y devuélvelo al orquestador; no inventes
> una API. Entrega cambios, pruebas reales, límites y asuntos pendientes. No publiques ni
> cambies de minor. No afirmes que has probado comandos que no ejecutaste.

## 9. Formato de entrega y revisión

El implementador entrega ID, commit/diff, archivos modificados, comportamiento resultante,
tabla criterio→prueba→resultado, comandos con exit code y pendientes. Indicar impacto público
y cambios compartidos que necesita el integrador. Evitar transcripciones largas de logs.

El revisor responde **aceptado**, **requiere cambios** o **bloqueado por decisión**, con
evidencia concreta y archivo. Comprueba al menos: contrato, caso negativo, cleanup, límites de
paquete, naming público, a11y aplicable y ausencia de cambios ajenos. Un comentario «LGTM»
sin comprobación no cierra una puerta de salida.

El integrador registra el cierre en STATE y en la ficha de tarea; actualiza la spec. Los IDs
cerrados no se reutilizan. Un fallo posterior abre regresión enlazada con su tarea de origen.

## 10. Estado inicial de las fases

| Fase            | Estado      | Condición para iniciar implementación                      |
| --------------- | ----------- | ---------------------------------------------------------- |
| 0.7             | Siguiente   | Usar contratos base ya preparados                          |
| 0.8             | No iniciada | Gate de 0.7                                                |
| 0.9             | No iniciada | Contratos comunes de 0.8 integrados                        |
| 0.10            | No iniciada | Todas las familias incluidas estabilizadas                 |
| 0.11            | No iniciada | Matriz de consumo/compatibilidad aceptada                  |
| Beta / RC / 1.0 | No iniciada | API congelada y autorización de la release correspondiente |
