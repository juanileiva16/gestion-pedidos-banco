# Requisitos e historias de usuario

Última actualización: 05-10-2026.

Este documento reúne el alcance, las reglas y las historias conversadas para el
sistema de pedidos de viandas del banco. Describe el producto previsto; no implica
que todas las funciones ya estén implementadas.

## 1. Objetivo y estado actual

Permitir que los empleados pidan viandas para una fecha y que los administradores
consulten los pedidos y registren sus entregas.

La demo actual permite consultar por fecha y registrar entregas completas o
parciales con datos ficticios en memoria. Al recargar se reinicia. Todavía no
incluye base de datos, acceso de usuarios, carga de menús ni pedidos de empleados.

## 2. Usuarios y alcance

| Rol | Responsabilidad |
| --- | --- |
| Empleado | Consultar menús y gestionar sus propios pedidos antes del cierre. |
| Administrador | Publicar menús, asistir con la carga de pedidos, consultar cantidades por fecha y registrar entregas. Inicialmente habrá dos administradores. |
| Restaurante | Preparar las viandas y recibir cantidades e incidencias. Su acceso directo al sistema queda para una etapa posterior. |

### Primera versión

- Autenticación, permisos y almacenamiento compartido.
- Publicación de opciones de menú por fecha.
- Creación, consulta, modificación y cancelación de pedidos de empleados.
- Carga de pedidos por un administrador en nombre de un empleado.
- Consulta administrativa y resumen de cantidades por fecha y tipo.
- Registro de entregas completas y parciales.

### Segunda etapa

- Registro y seguimiento de faltantes, incluidos pedidos informados que no aparecen en la lista.
- Reclamos sobre las viandas asociados a un pedido.

### Ampliaciones posteriores

- Acceso del restaurante para consultar resúmenes y responder incidencias, si se confirma su participación.
- Fotos en reclamos, notificaciones e historial detallado de modificaciones.
- Importación desde Excel, CSV o imágenes.

Estas ampliaciones son pendientes de priorizar. No se construirá un chat propio
en la primera versión; WhatsApp continuará como canal de contacto externo.

## 3. Reglas de negocio

| ID | Regla |
| --- | --- |
| RN-01 | Un empleado puede tener un pedido activo por fecha de entrega, con cantidades de varios tipos de vianda. No debe duplicarse el pedido por volver a confirmar. |
| RN-02 | Las cantidades son enteros no negativos. Para confirmar un pedido, la suma debe ser mayor que cero. Por ahora no hay un límite comercial de unidades. |
| RN-03 | Un empleado puede pedir para compañeros dentro de su propio pedido. En esta versión no se identificará a cada destinatario de las unidades. |
| RN-04 | El pedido identifica al empleado mediante su usuario, no mediante el texto de su nombre. Cada pedido tiene un identificador único y una fecha de entrega. |
| RN-05 | La fecha de entrega es el día para el que se pide, no la fecha de creación. Se guarda sin hora en formato `AAAA-MM-DD` y se muestra en `DD-MM-AAAA`. |
| RN-06 | Se puede pedir, modificar o cancelar hasta el día anterior a la entrega. No se replica la restricción del sistema actual de pedir hasta el jueves para la semana siguiente. |
| RN-07 | El horario exacto de cierre está pendiente de confirmación. La propuesta provisional es cerrar a las 00:00 del día de entrega, usando `America/Argentina/Buenos_Aires`. |
| RN-08 | El cierre se comprueba en el servidor. Después del cierre, el empleado puede consultar el pedido, pero no modificarlo ni cancelarlo. |
| RN-09 | La carga administrativa en nombre de un empleado respetará inicialmente el mismo cierre. Las excepciones posteriores al cierre requieren una regla específica que aún no está definida. |
| RN-10 | Un pedido cargado por el administrador pertenece al empleado. Se registra quién lo creó para distinguir al solicitante de quien realizó la carga. |
| RN-11 | Las cantidades entregadas se registran por tipo y deben estar entre cero y la cantidad pedida. Las entregas parciales se acumulan. |
| RN-12 | El estado de entrega se calcula: pendiente si no se entregó ninguna unidad, parcial si se entregaron algunas y quedan otras, entregado si se entregaron todas. |
| RN-13 | El cierre de pedidos no impide que un administrador registre una entrega. Son operaciones diferentes. |
| RN-14 | La tabla y los contadores administrativos corresponden solamente a la fecha seleccionada. Cambiar de fecha no borra ni reinicia las entregas. |
| RN-15 | Se distingue entre cantidad de pedidos y cantidad de viandas. Una persona con tres unidades representa un pedido y tres viandas. |
| RN-16 | Los pedidos cancelados no se contabilizan en las cantidades activas ni en el resumen de preparación para el restaurante. |
| RN-17 | La confirmación de un pedido o entrega se muestra únicamente cuando el servidor guardó la operación correctamente. Si falla, se informa el error y no se presenta como guardada. |
| RN-18 | Los permisos se comprueban en el servidor: el empleado accede a sus propios pedidos y el administrador accede a las operaciones administrativas. |

### Ejemplo de una entrega parcial

| Tipo | Pedidas | Entregadas | Pendientes |
| --- | ---: | ---: | ---: |
| Común (C) | 2 | 2 | 0 |
| Light (L) | 1 | 0 | 1 |
| **Total** | **3** | **2** | **1** |

El pedido está parcial. Si se registra "Entregar todo", solo se entrega la unidad
Light pendiente: las comunes no se vuelven a contar.

## 4. Historias de usuario de la primera versión

### HU-01. Acceso y permisos

**Como** usuario habilitado, **quiero** iniciar sesión con mi cuenta,
**para** acceder a las funciones que corresponden a mi rol.

**Criterios de aceptación**

- Un usuario sin sesión no puede consultar ni modificar pedidos reales.
- Un empleado puede consultar y gestionar sus propios pedidos; no los de otro empleado.
- Solo un administrador puede publicar menús, consultar la lista general y registrar entregas.
- Los permisos se verifican también al solicitar la operación al servidor.
- El mecanismo para habilitar cuentas queda pendiente de decisión; la propuesta es usar invitaciones.

### HU-02. Publicación de menús por fecha

**Como** administrador, **quiero** publicar las opciones de menú de una fecha,
**para** que los empleados sepan qué pueden pedir ese día.

**Criterios de aceptación**

- Cada opción publicada identifica la fecha, el tipo de vianda y la descripción del plato.
- Los empleados ven las opciones publicadas para la fecha que consultan.
- Un pedido solo puede elegir opciones disponibles para su fecha de entrega.
- Si no hay opciones publicadas, no se puede confirmar un pedido para esa fecha.

### HU-03. Creación de un pedido

**Como** empleado, **quiero** elegir cantidades de distintos tipos de vianda,
**para** realizar mi pedido para una fecha de entrega.

**Criterios de aceptación**

- Puedo combinar opciones, por ejemplo dos comunes y una Light.
- Se aplican las reglas de cantidades y cierre RN-02, RN-06, RN-07 y RN-08.
- El pedido queda asociado a mi usuario y a la fecha seleccionada.
- No se crean dos pedidos activos para el mismo usuario y fecha por repetir la confirmación.
- Después de guardar, veo el identificador, la fecha y las cantidades confirmadas.
- Si el guardado falla, recibo un error y no una confirmación de éxito.

### HU-04. Consulta de pedidos propios

**Como** empleado, **quiero** consultar mis pedidos por fecha,
**para** comprobar qué viandas quedaron registradas.

**Criterios de aceptación**

- Veo la fecha, el identificador y las cantidades por tipo de mis pedidos guardados.
- Puedo consultar un pedido aunque ya haya pasado su cierre.
- Si no tengo un pedido para la fecha consultada, se informa claramente.
- Las consultas usan los datos guardados y no dependen del navegador donde se creó el pedido.

### HU-05. Modificación o cancelación de un pedido

**Como** empleado, **quiero** modificar o cancelar mi pedido antes del cierre,
**para** ajustar lo que necesito recibir.

**Criterios de aceptación**

- Antes del cierre puedo cambiar las cantidades u opciones disponibles de mi pedido.
- Una modificación actualiza el pedido existente sin generar un duplicado.
- Puedo cancelar el pedido completo; la cancelación lo excluye de los totales activos.
- Después del cierre, el servidor rechaza modificaciones y cancelaciones.
- Una operación confirmada se refleja en la consulta administrativa y en el resumen para el restaurante.

### HU-06. Carga en nombre de un empleado

**Como** administrador, **quiero** crear o modificar un pedido en nombre de un empleado,
**para** asistirlo cuando prefiera que yo haga la carga.

**Criterios de aceptación**

- Selecciono al empleado, la fecha y las cantidades de las opciones disponibles.
- El pedido pertenece al empleado y registra al administrador que lo creó.
- Si ya existe un pedido activo para ese empleado y fecha, se modifica ese pedido.
- Se aplican las mismas validaciones de cantidades, disponibilidad y cierre que al empleado.
- El empleado puede consultar el pedido cargado para él.

### HU-07. Consulta administrativa por fecha

**Como** administrador, **quiero** consultar los pedidos de una fecha,
**para** organizar las entregas del día.

**Criterios de aceptación**

- La tabla muestra empleados, tipos, cantidades pedidas, entregadas y pendientes, y estado de entrega.
- Los contadores suman viandas de la fecha seleccionada; la cantidad de pedidos se muestra aparte.
- Una fecha sin pedidos muestra totales en cero y un estado vacío.
- Una fecha borrada no muestra pedidos ni acciones de entrega.
- Cambiar de fecha y volver conserva las entregas registradas.
- Una entrega de una persona en una fecha no modifica su pedido de otra fecha.
- Los dos administradores consultan los mismos datos guardados.

### HU-08. Resumen para el restaurante

**Como** administrador, **quiero** obtener las cantidades solicitadas por fecha y tipo,
**para** comunicar al restaurante qué viandas debe preparar.

**Criterios de aceptación**

- El resumen identifica la fecha de entrega y suma las unidades de cada tipo.
- Los totales salen de los mismos pedidos activos que usa la consulta administrativa.
- Se excluyen los pedidos cancelados.
- Se muestran cantidades solicitadas para preparar, sin descontar las unidades ya entregadas.
- La forma de compartirlo o imprimirlo queda por confirmar con el restaurante.
- No se requiere una cuenta del restaurante para esta primera versión.

### HU-09. Entrega completa o parcial

**Como** administrador, **quiero** registrar todas o algunas de las viandas de un pedido,
**para** reflejar lo que realmente retiró la persona.

**Criterios de aceptación**

- "Entregar todo" completa únicamente las cantidades pendientes.
- "Entrega parcial" permite indicar unidades a entregar ahora por tipo y las suma a las entregadas.
- Se rechazan cantidades negativas, decimales, superiores al saldo o una entrega sin unidades.
- Cancelar o cerrar el formulario no cambia las cantidades.
- El estado y los contadores se recalculan después de guardar correctamente.
- Un pedido completo no permite registrar más unidades.
- Las cantidades no se pierden al recargar y el otro administrador puede consultarlas.
- Si ambos administradores intentan entregar la última unidad, el servidor evita superar lo pedido.

## 5. Historias de la segunda etapa

### HU-10. Registro y seguimiento de faltantes

**Como** administrador, **quiero** registrar una incidencia de faltante,
**para** verificarla con el restaurante y seguir su resolución.

**Criterios de aceptación**

- Distingo entre un pedido registrado cuya vianda no llegó y un pedido que el empleado informa pero no aparece en la lista.
- Puedo registrar la segunda situación aunque todavía no exista un pedido identificado.
- La incidencia identifica empleado, fecha, tipos, cantidades y descripción.
- Un faltante no se marca como entregado ni se resuelve creando automáticamente otro pedido.
- Puedo registrar el contacto por WhatsApp y el resultado de la verificación.
- El seguimiento distingue, al menos, pendiente de verificar, confirmado y resuelto.
- Marcar una incidencia como resuelta no modifica por sí solo cantidades pedidas o entregadas.
- La incorporación de un pedido confirmado después del cierre requiere acordar primero el procedimiento de excepción.

### HU-11. Reclamos sobre las viandas

**Como** empleado, **quiero** registrar un reclamo sobre una vianda de mi pedido,
**para** que pueda revisarse y comunicarse al restaurante.

**Criterios de aceptación**

- El reclamo se asocia a mi pedido, su fecha y el tipo de vianda afectado.
- Puedo describir el problema en texto; las fotos quedan para una ampliación posterior.
- No puedo vincular un reclamo a un pedido de otro empleado.
- Un administrador puede consultar el reclamo y registrar su seguimiento.
- Se distinguen los casos que requieren atención inmediata de los comentarios de mejora.
- El reclamo no cambia las cantidades ni el estado de entrega del pedido.
- Antes de implementar se definirá cómo se comunica al restaurante y quién puede ver la identidad del reclamante.

## 6. Flujo previsto

1. El administrador publica menús para una fecha.
2. El empleado confirma su pedido o un administrador lo carga en su nombre.
3. El servidor valida identidad, permisos, cantidades, disponibilidad y cierre, y guarda el pedido.
4. El empleado consulta su confirmación; antes del cierre puede modificar o cancelar.
5. El administrador consulta la lista y el resumen de preparación para esa fecha.
6. El restaurante recibe o consulta el resumen por el mecanismo que se acuerde.
7. El administrador registra entregas completas o parciales.
8. En la segunda etapa, se registran y siguen faltantes y reclamos.

La lista administrativa y el resumen deben salir de una misma fuente de datos.
No se mostrará una confirmación de guardado si la operación falló.

## 7. Supuestos y decisiones pendientes

| Tema | Estado actual | Qué falta confirmar |
| --- | --- | --- |
| Límite de viandas | Sin límite comercial por ahora. | Si el restaurante necesita un máximo por empleado o fecha. |
| Hora de cierre | Se acordó hasta el día anterior; 00:00 del día de entrega es una propuesta provisional. | La hora que permite preparar los pedidos y su aplicación en días no laborables. |
| Alta de empleados | Invitaciones recomendadas, todavía no elegidas. | Quién habilita cuentas y si se permite registro por cuenta propia. |
| Comunicación de cantidades | Se supone que el restaurante recibe un reporte o consulta totales. | Cómo funciona hoy y qué canal usará nuestro sistema. |
| Usuario restaurante | Fuera de la primera versión. | Si participará directamente y qué información podrá consultar. |
| Cambios después del cierre | No habilitados en el alcance inicial. | Procedimiento y confirmación del restaurante para una excepción. |
| Corrección de entregas erróneas | Necesidad identificada, todavía no implementada. | Quién puede corregirlas y qué registro debe conservarse. |
| Menús con pedidos existentes | Publicación por fecha definida. | Qué cambios se permiten cuando ya hay pedidos asociados. |
| Reclamos | Segunda etapa. | Atención de casos urgentes y visibilidad de identidad y respuestas. |

## 8. Orden de implementación

1. Revisar este documento y resolver las decisiones necesarias para la primera versión.
2. Diseñar el modelo de datos para usuarios y roles, menús por fecha, pedidos, cantidades y entregas.
3. Configurar base de datos y autenticación, con permisos validados en el servidor.
4. Conectar la pantalla administrativa actual y verificar persistencia, acceso compartido y entregas concurrentes.
5. Implementar publicación de menús y resumen de preparación.
6. Implementar pedidos de empleados y carga administrativa, con confirmación de guardado y cierre.
7. Probar el circuito completo con cuentas y datos ficticios antes de incorporar datos reales.
8. Incorporar incidencias y reclamos en una segunda etapa.

### Verificación del primer circuito completo

- Un empleado confirma un pedido con varias opciones y ve su identificador.
- El administrador lo encuentra en la fecha correcta y en el resumen por tipo.
- Una modificación anterior al cierre actualiza las cantidades sin duplicar el pedido.
- Después del cierre, una modificación es rechazada, pero la entrega administrativa sigue disponible.
- Una entrega parcial permanece después de recargar y puede completarla el segundo administrador.
- No se permite acceder a pedidos ajenos con una cuenta de empleado.
- Un error de guardado no se presenta como una operación exitosa.
