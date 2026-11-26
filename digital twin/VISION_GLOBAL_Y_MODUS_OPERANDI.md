# Gemelo Digital NÁCAR: visión global, evaluación y modus operandi

> **Documento rector del proyecto.** Cualquier decisión técnica sobre el Gemelo Digital debe ser compatible con lo que aquí se registra.
> Última actualización: 21 de noviembre de 2026.

---

## 1. Registro de decisión (ADR-001): alcance local, visión global

| Campo | Contenido |
|---|---|
| **Decisión** | La Fase 1 se construye **solo para Yucatán** (karst del Gran Acuífero Maya) y **solo para *Anodontites trapesialis*** (nombre también referido como *A. ciconia*). |
| **Motivo** | Tener un modelo presentable, defendible y terminado en poco tiempo. |
| **Visión que NO se negocia** | El Proyecto NÁCAR está pensado para **escalar a nivel mundial**. La Fase 1 no puede tomar atajos que impidan ese escalamiento. |
| **Regla de diseño derivada** | Ninguna constante regional o biológica se escribe dentro de las ecuaciones. Todas viven en perfiles intercambiables: **región** (Ω) y **especie** (Θ). |
| **Regla ecológica** | En cada despliegue solo se usan bivalvos **nativos de la cuenca receptora**. Nunca especies exóticas. |

---

## 2. Lo que falta por saber (registro explícito de pendientes)

### 2.1 Parámetros de especies: pendientes para TODAS
- **Ninguna especie tiene todavía su perfil completo con datos de investigación**, incluida la focal.
- Los números de la Tabla 4 del reporte son **semillas provisionales (nivel D)** que solo sirven para que el modelo se pueda ejecutar.
- Lo único con respaldo directo hoy es el rango de aclaramiento de *A. trapesialis* (0.47–3.80 L/h/ind) y algunos coeficientes generales de bivalvos tomados de la literatura de la familia (nivel C).
- Las especies secundarias (*A. tortolis*, *Psoronaias semigranosa*, *Cyrtonaias tampicoensis*) son **plantillas de escalabilidad**, no datos.

### 2.2 Regiones del mundo: pendiente de investigar
- El término kárstico (precipitación de calcita–fósforo) se anula cuando el agua no está sobresaturada en calcita. Eso es un **mecanismo de diseño del modelo**, no un hecho comprobado para ninguna región concreta.
- **No sabemos todavía** qué otras regiones del mundo comparten las características de Yucatán (dureza, alcalinidad, temperatura, fotoperiodo, especies nativas, régimen de lluvias), ni con qué valores. Es probable que existan, pero hay que investigarlo. Esto aplica a **cualquier característica regional**, no solo a la química kárstica.
- Esta caracterización es una **meta de investigación de fases posteriores** (ver §6.2).

### 2.3 Verificaciones críticas antes de presentar
1. **Estatus nativo de *A. trapesialis* en la cuenca receptora de Yucatán.** Si no es nativa del sitio piloto, el sitio o la especie deben replantearse (regla ecológica del ADR-001). Fuentes sugeridas: GBIF, CONABIO/SNIB, colecciones malacológicas de la UNAM.
2. **Sinonimia *A. ciconia* ↔ *A. trapesialis*.** Confirmarla en MolluscaBase o en el MUSSEL Project antes de usar ambos nombres como equivalentes en un documento formal.
3. **Larva lasidio y pez hospedero.** Si la especie necesita pez hospedero para completar su ciclo, el índice de reproducción debe dividirse en dos: *desove/gravidez* (lo que ocurre en la bandeja) y *reclutamiento de juveniles* (que depende de la presencia de peces).
4. **Referencias bibliográficas del reporte.** Algunas entradas deben verificarse una por una (autor, año, DOI) antes de presentar.

---

## 3. Evaluación del estado actual

### 3.1 Fortalezas
- **Arquitectura sólida**: nueve bloques separados, salidas terminales bien distinguidas del núcleo acoplado y enfoque de orden reducido (ROM) adecuado para tiempo real.
- **Criterio de dimensionamiento correcto**: el balance de masa para la biomasa crítica de plantas (m*) evaluado en la concentración meta es físicamente consistente.
- **Módulo físico estandarizable**: la linterna de bandejas circulares es replicable en cualquier cuerpo de agua.
- **Base hidrogeoquímica real de Yucatán**: la línea base de cenotes proviene de la investigación del equipo.

### 3.2 Riesgos y debilidades (en orden de gravedad)
| # | Riesgo | Impacto si no se atiende | Mitigación |
|---|---|---|---|
| 1 | Parámetros semilla presentados como si fueran datos | Pérdida de credibilidad ante jurado o revisores | Etiquetar niveles de evidencia (ya aplicado en el reporte) y ejecutar la investigación profunda |
| 2 | Escenario numérico calculado a mano | Inconsistencias detectables | Regenerarlo con el motor Python |
| 3 | Estatus nativo de la especie sin verificar | Choque con la propia regla ecológica del proyecto | Verificación de distribución (§2.3) |
| 4 | Ciclo larval con pez hospedero no modelado | Índice de reproducción optimista | Separar desove de reclutamiento |
| 5 | Alcance demasiado amplio para la Fase 1 | No terminar nada presentable | Congelar el alcance según §5 |

---

## 4. Principio rector: "Construir local, diseñar global"

En la Fase 1 se **llena** un solo perfil de región y un solo perfil de especie, pero se **diseña** el software como si mañana hubiera que cargar cien. En la práctica:

### 4.1 Reglas de arquitectura (cuestan poco ahora y ahorran mucho después)
1. **Perfiles externos**: `profiles/regions/yucatan_karst.yaml` y `profiles/species/anodontites_trapesialis.yaml`. Las ecuaciones leen de ahí y nunca tienen números fijos.
2. **Metadatos por parámetro**: cada valor guarda `valor`, `rango`, `unidad`, `fuente` y `nivel_evidencia` (A/B/C/D). El frontend puede mostrar la confianza de cada resultado.
3. **Plantillas vacías para escalar**: `profiles/species/_plantilla.yaml` y `profiles/regions/_plantilla.yaml`, con todos los campos y `estado: pendiente`.
4. **Unidades explícitas** en el código (por ejemplo, con la librería `pint`) para evitar errores al mezclar fuentes de distintos países.
5. **Interfaces fijas** para lo que cambiará con el tiempo: adaptador de sensores, slot de controlador, perfil de región y perfil de especie.
6. **Pruebas automáticas de física**: conservación de masa, casos límite (cero almejas, cero plantas, agua sin sobresaturación de calcita) y unidades.

### 4.2 Niveles de evidencia
| Nivel | Significado |
|---|---|
| **A** | Medido en la especie focal y en la región de despliegue |
| **B** | Medido en la especie, pero en otra región o condición |
| **C** | Extrapolado de un taxón cercano (género, familia, Add-my-Pet) |
| **D** | Semilla provisional; debe reemplazarse |

---

## 5. Modus operandi para la Fase 1 (presentable)

### 5.1 Alcance congelado
- **Dentro**: Yucatán, *A. trapesialis*, módulo linterna, motor offline, porcentajes para el frontend, índice de reproducción (desove), simulador "¿qué pasaría si…?".
- **Fuera por ahora**: filtro de Kalman en vivo, controlador físico, modelos 2D/3D, otras especies, otras regiones.

### 5.2 Secuencia recomendada
| Paso | Tarea | Resultado |
|---|---|---|
| 1 | Verificaciones críticas (§2.3) | Especie y sitio confirmados |
| 2 | Investigación profunda de *A. trapesialis* (prompt en `info/Escalabilidad_Mundial_y_Prompt_Anodontites_trapesialis.md`) | Perfil de especie con niveles B/C |
| 3 | Estructura de perfiles YAML y plantillas | Base escalable lista |
| 4 | Motor Python: Bloques 1–6, luego 8–9 | Simulación offline funcionando |
| 5 | Pruebas de conservación y casos límite | Modelo confiable |
| 6 | Análisis de sensibilidad (Sobol / SALib) | Lista de parámetros que más importan → prioriza qué medir en laboratorio |
| 7 | Regenerar el escenario del reporte con el código y recompilar el PDF | Números consistentes |
| 8 | Demo en la sección "Digital twin" de la web (deslizadores de n, m, temperatura, mes) | Presentación visual |
| 9 | Diapositiva de limitaciones y hoja de ruta | Credibilidad |

### 5.3 Cómo presentarlo
- Mensaje central: **"Yucatán es el primer caso de validación de una plataforma diseñada para el mundo."**
- Mostrar el mecanismo de escalamiento (perfiles de región y especie) en una sola diapositiva.
- Mostrar los niveles de evidencia con honestidad: un jurado técnico valora más un modelo que sabe qué no sabe.
- Mostrar el análisis de sensibilidad como justificación del plan de laboratorio.

---

## 6. Fases posteriores (sin perder de vista la escala global)

### 6.1 Fase 2: piloto físico en Yucatán
Prototipo con sensores, bioensayos de filtración y excreción, calibración inversa, validación (NSE > 0.75, KGE > 0.80, |PBIAS| < 15 %), telemetría IoT y asimilación con filtro de Kalman.

### 6.2 Fase 3: agenda de investigación para escalar
1. **Tipología mundial de regiones**: identificar qué zonas comparten las características de Yucatán y cuáles no (química del agua, clima, fotoperiodo, hidrología).
2. **Catálogo de especies nativas por región**, con sus parámetros y niveles de evidencia.
3. **Transferencia de parámetros entre especies** con priors bayesianos a partir de *A. trapesialis*, para arrancar en regiones con pocos datos.
4. **Marco regulatorio** por país para el manejo de bivalvos nativos.
5. **Alianzas** con universidades locales para generar datos de nivel A.

#### Prompt de investigación para la Fase 3 (usar después, no ahora)
```text
Actúa como investigador en hidrogeoquímica, limnología y malacología dulceacuícola a escala global.
Contexto: el Gemelo Digital del Proyecto NÁCAR (biofiltración con bivalvos nativos en módulos tipo linterna, macrófitas y biopelículas) se validó primero en el karst de Yucatán, México (dureza ~580 mg/L CaCO3, alcalinidad 248–359 mg/L, pH 6.7–8.1, 22–33 °C).
Objetivo: preparar su escalamiento mundial.
1. Identifica y clasifica regiones del mundo con características hidrogeoquímicas y climáticas similares a Yucatán (karst carbonatado tropical/subtropical) y regiones contrastantes (aguas blandas, templadas, aluviales). Para cada región reporta dureza, alcalinidad, pH, índice de saturación de calcita, rango térmico anual, fotoperiodo y problemas de calidad del agua documentados.
2. Para cada región, lista bivalvos dulceacuícolas nativos con potencial de biofiltración, su estado de conservación y la disponibilidad de parámetros de filtración, metabolismo y reproducción (indicando si los datos son medidos o extrapolados).
3. Resume el marco regulatorio para el uso de bivalvos nativos en cada país.
Entrega una matriz región × parámetro y región × especie con citas verificables.
```

### 6.3 Fase 4: control en lazo cerrado
Activación del slot de controlador con aireación, bomba de flujo, control térmico y dosificación de alimento.

---

## 7. Archivos relacionados
- Reporte técnico: `info/Modelación de Biofiltración en Yucatán.pdf` (fuente: `info/Modelacion_Biofiltracion_Yucatan.tex`, capítulo 8 con el estado de validación).
- Resumen: `info/resumen.pdf`.
- Prompt de investigación de la especie focal: `info/Escalabilidad_Mundial_y_Prompt_Anodontites_trapesialis.md`.
- Respaldos de versiones anteriores: `info/pdf_1.pdf`, `info/pdf_2.pdf`, `info/resumen_1.pdf`, `info/resumen_2.pdf`.
