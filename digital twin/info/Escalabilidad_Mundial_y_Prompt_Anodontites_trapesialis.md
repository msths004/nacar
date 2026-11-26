# Escalabilidad del Gemelo Digital NÁCAR y prompt de investigación para *Anodontites trapesialis*

> **Nota de alcance:** el documento rector es [VISION_GLOBAL_Y_MODUS_OPERANDI.md](../VISION_GLOBAL_Y_MODUS_OPERANDI.md). La Fase 1 se limita a Yucatán y a *A. trapesialis*; la escala mundial es la visión permanente del proyecto.

## 1. Cómo se piensa escalar (mecanismos de diseño, aún no validados)

El modelo separa las **leyes de conservación** (que se suponen generales) de los **perfiles regionales (Ω)** y **de especie (Θ)**, que deben investigarse para cada despliegue.

1. **Química del agua (Ω):** la coprecipitación calcita–fósforo solo actúa cuando el agua está sobresaturada en calcita ($SI_c > 0$); si no lo está, el término vale cero y el fósforo queda a cargo de plantas y bacterias. Esto es una propiedad de cómo está escrita la ecuación. **No sabemos todavía qué otras regiones del mundo comparten las características de Yucatán** (ni en química, ni en clima, ni en especies nativas). Caracterizarlas es una meta de investigación de fases posteriores.
2. **Clima y latitud:** la función de época reproductiva y las curvas de luz y temperatura recibirán coordenadas o lecturas de sensores, en lugar de estar fijadas al clima de Yucatán. Los valores para otras latitudes están pendientes.
3. **Módulo físico:** la linterna de bandejas circulares es replicable en cualquier cuerpo de agua; la ecuación de interferencia entre almejas es general, pero sus coeficientes dependen de la especie.

---

## 2. Especie focal: *Anodontites trapesialis*

### 2.1 Identidad y motivos de la elección
* **Nombre de trabajo:** *Anodontites trapesialis* (Lamarck, 1819). También aparece referida como *A. ciconia*; **la sinonimia debe confirmarse** en MolluscaBase o el MUSSEL Project antes de usarse en un documento formal.
* **Motivos:** amplia distribución neotropical reportada, tasa de aclaramiento alta (0.47–3.80 L/h/ind según el reporte del equipo), gran tamaño adulto y producción de nácar.
* **Verificación crítica:** confirmar que es **nativa de la cuenca receptora** del sitio piloto en Yucatán (GBIF, CONABIO/SNIB, colecciones de la UNAM).

### 2.2 Estado de los parámetros
* **Faltan por obtener los parámetros de todas las especies**, incluida *A. trapesialis*. Los valores actuales del reporte son semillas provisionales (nivel D), salvo el rango de aclaramiento y algunos coeficientes generales de la familia.
* Las otras especies del catálogo (*A. tortolis*, *Psoronaias semigranosa*, *Cyrtonaias tampicoensis*, y géneros de otros continentes como *Unio*, *Anodonta*, *Diplodon* o *Elliptio*) son **plantillas para escalar**, sin datos todavía.
* Regla ecológica: en cada despliegue, solo bivalvos **nativos de la cuenca receptora**.

---

## 3. Prompt Maestro para Investigación Profunda (*Deep Research*) Enfocado en *Anodontites trapesialis* (*A. ciconia*) y Escalabilidad Global

Copia y pega el siguiente prompt en tu motor de **Deep Research** para obtener todos los parámetros científicos oficiales y verificados para alimentar el backend:

```text
Actúa como un investigador principal en malacología dulceacuícola, bioenergética cuantitativa (Dynamic Energy Budget - DEB y Scope for Growth - SFG) e ingeniería de gemelos digitales para biorremediación acuática a escala global.

Estamos construyendo el Gemelo Digital (Digital Twin) del Proyecto NÁCAR: un sistema de biofiltración modular basado en bivalvos filtradores alojados en columnas suspendidas de bandejas circulares apiladas (tipo linterna) acopladas con macrófitas acuáticas y biopelículas bacterianas. El sistema inicia su validación en México (Yucatán), pero está diseñado para escalar a nivel mundial.

ORGANISMO FOCAL PRIORITARIO DE LA INVESTIGACIÓN:
- Especie principal: Anodontites trapesialis (Lamarck, 1819) y su sinónimo/subespecie reconocida en México y Mesoamérica Anodontites ciconia (Gould, 1851) [Familia Mycetopodidae, Orden Unionida].
- Especies secundarias de referencia comparativa (solo como respaldo): Anodontites tortolis, Psoronaias semigranosa y Cyrtonaias tampicoensis (u otros representantes de Mycetopodidae/Unionidae en la base de datos internacional Add-my-Pet DEB).

OBJETIVO:
Realizar una revisión exhaustiva de la literatura científica internacional (artículos revisados por pares en inglés, español y portugués de México, Brasil, Argentina, Colombia y bases de datos malacológicas/DEB) para extraer los valores numéricos exactos que parametrizan la filtración, el metabolismo y, muy especialmente, la FACTIBILIDAD DE REPRODUCCIÓN de Anodontites trapesialis / Anodontites ciconia.

PARÁMETROS EXACTOS A INVESTIGAR Y TABULAR PARA ANODONTITES TRAPESIALIS (A. CICONIA):

1. MORFOMETRÍA, ALOMETRÍA Y SIFONES:
   - Ecuación alométrica longitud de concha (L, en mm) vs. peso húmedo, peso seco de tejido blando (DW, en g) y peso seco libre de cenizas (AFDW, en g): valores de a_W y b_W en W = a_W * L^(b_W), y coeficiente de forma isométrica DEB (delta_M).
   - Longitud máxima asintótica (L_inf, en mm) y tasa de crecimiento de von Bertalanffy (r_B o K).
   - Tasa de aclaramiento o filtración (CR, en L h^-1 ind^-1 y L h^-1 g^-1): coeficientes a_CR y b_CR en función del peso o la longitud, y tamaño mínimo de partícula retenida (micrómetros), incluyendo eficiencia de retención de bacterias coliformes / Escherichia coli y fitoplancton.
   - Anatomía de las aberturas inhalante y exhalante, velocidad o alcance de los chorros de bombeo y efectos de la densidad de siembra (individuos por m^2 o distancia entre individuos en jaulas/canastas) sobre la filtración y supervivencia.

2. FISIOLOGÍA AMBIENTAL, TURBIDEZ Y EXCRECIÓN (MODELO SFG):
   - Tolerancia térmica a lo largo de su distribución global (desde climas subtropicales/templados hasta tropicales): temperatura mínima de actividad, temperatura óptima de filtración (T_opt, en °C), temperatura crítica superior (T_crit, en °C) de cierre valvular o estrés oxidativo/metabólico, y temperatura de Arrhenius (T_A, en K) o Q10.
   - Respuesta a Sólidos Suspendidos Totales (TSS / turbidez): umbral de concentración (TPM_crit, en mg/L) donde inicia la producción de pseudoheces (PsR), concentración donde cae el aclaramiento al 50% (TSS_50) y tasa de biodeposición total (heces + pseudoheces en mg h^-1 ind^-1).
   - Eficiencia de absorción digestiva (AE, método de Conover), tasa de consumo de oxígeno (OCR, en mg O2 h^-1 g^-1 o por individuo), tolerancia a la hipoxia (constante de semi-saturación K_O y límite letal de oxígeno disuelto en mg/L) y tasa de excreción de amonio (AER, en mg N h^-1 g^-1) con su relación atómica O:N.
   - Tolerancia a rangos de pH, dureza cálcica (CaCO3 desde aguas blandas hasta aguas kársticas duras) y conductividad eléctrica.

3. BIOLOGÍA REPRODUCTIVA PROFUNDA Y PRESUPUESTO DEB DE ANODONTITES TRAPESIALIS (A. CICONIA):
   - Talla de primera madurez sexual (L_p, en mm) y edad de madurez.
   - Parámetros DEB (de A. trapesialis o del miembro de Mycetopodidae/Unionida más cercano en la base de datos Add-my-Pet): fracción de asignación somática (kappa), tasa de mantenimiento somático ([p_M]), conductancia energética (v), tasa máxima de asimilación ({p_Am}) y umbrales de madurez (E_Hb, E_Hp).
   - Estrategia sexual (dioica vs. hermafrodita simultánea o funcional en A. trapesialis), proporción sexual e histología gonadal.
   - Fenología reproductiva y estacionalidad: cómo varía su época de gametogénesis, desove e incubación marsupial según la latitud y el régimen climático (época de secas vs. lluvias en el trópico; primavera-verano en el subtrópico), especificando los disparadores ambientales (incremento de temperatura, fotoperiodo, pulso de alimento o nivel hidrométrico).
   - Ventana ambiental crítica para reproducción exitosa:
     * Rango óptimo y límites críticos de temperatura (T_rep, en °C) para gametogénesis, liberación de esperma y gravidez.
     * Oxígeno disuelto mínimo requerido durante la gravidez marsupial (en las hemibranquias internas) y límite de amonio (NH4+/NH3) o turbidez que provoca aborto prematuro de embriones/larvas o reabsorción gonadal (atresia).
     * Distancia efectiva de fecundación entre individuos y velocidad de corriente recomendada en sistemas confinados o bandejas.
   - Desarrollo larval (Larva Lasidio):
     * Tiempo de incubación en el marsupio branquial (días o grados-día) y fecundidad (número de larvas lasidio liberadas por hembra por evento).
     * Interacción con peces hospederos (qué familias/géneros de peces son hospederos confirmados de los lasidios de A. trapesialis, duración de la fase parasítica en días y si existen reportes de desarrollo directo o cultivo in vitro artificial de lasidios a juveniles sin pez hospedero).

4. ESCALABILIDAD MUNDIAL DEL GEMELO DIGITAL (META DE INVESTIGACIÓN REGIONAL Y MULTIESPECIE):
   - Identificar qué otras regiones del mundo comparten las características hidrogeoquímicas y climáticas de Yucatán (acuíferos kársticos carbonatados tropicales/subtropicales con alta dureza de CaCO3, alta alcalinidad y sobresaturación de calcita SI_c > 0) y cuáles contrastan con ellas (cuencas de aguas blandas, neutras o templadas), tabulando sus rangos fisicoquímicos.
   - Especificar qué parámetros ecofisiológicos y reproductivos faltan por obtener en la literatura para las especies secundarias de México/Mesoamérica (Anodontites tortolis, Psoronaias semigranosa, Cyrtonaias tampicoensis) y para 3 o 4 especies nativas homólogas de otros continentes (Norteamérica, Sudamérica templada, Europa, Asia) que ocupen el mismo nicho en los módulos tipo linterna cuando el sistema se escale globalmente.

FORMATO DE SALIDA:
1. Reporte científico detallado con todas las citas bibliográficas (Autor, año, revista, DOI/enlace).
2. "Tabla Maestra de Parámetros Numéricos de Anodontites trapesialis (A. ciconia)" con columnas: [Símbolo | Nombre del Parámetro | Valor Numérico Óptimo | Rango Mín-Máx | Unidades | Nivel de Evidencia (A: Medido local, B: Medido en especie, C: Extrapolado de Mycetopodidae/Unionida, D: Pendiente de bioensayo) | Referencia].
3. "Matriz Cuantitativa de Condiciones Reproductivas para el Frontend del Gemelo Digital": umbrales numéricos exactos para clasificar la factibilidad de reproducción en Óptima (80-100%), Moderada (40-79%) y Crítica/Inhibida (0-39%), junto con la acción correctiva recomendada para cada factor limitante.
4. "Hoja de Ruta de Vacíos Paramétricos para Escalabilidad Global": listado explícito de los parámetros que aún no existen en literatura para otros bivalvos y otras regiones del mundo y que deberán medirse en fases posteriores.
```
