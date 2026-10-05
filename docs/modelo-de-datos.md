# Modelo de datos inicial

Última actualización: 05-10-2026.

Este documento propone cómo guardar los datos de la primera versión. Complementa
los [requisitos e historias de usuario](requisitos-y-historias-de-usuario.md).
No crea una base de datos ni modifica la demo actual.

## 1. Decisiones y supuestos

| Tema | Decisión inicial |
| --- | --- |
| Identificación | Cada empleado tiene un ID interno y un legajo único guardado como texto. |
| Acceso | Se usa el correo laboral. El legajo no es una contraseña. |
| Habilitación | Provisionalmente, el administrador verifica y habilita empleados, luego invita sus cuentas. No hay registro público libre. |
| Cuenta y empleado | Son entidades separadas: se puede cargar un pedido para un empleado habilitado que todavía no activó su cuenta. |
| Roles | Empleado y administrador. El restaurante no tiene cuenta en esta versión. |
| Cierre | Provisionalmente, 00:00 del día de entrega en `America/Argentina/Buenos_Aires`, configurable por jornada. No es un horario confirmado por el restaurante. |
| Base de datos | Propuesta técnica: PostgreSQL con Supabase para base de datos y autenticación. Pendiente de configurar y comprobar con cuentas ficticias. |

No conocemos todavía el dominio laboral ni el listado de legajos válidos.
Inicialmente el administrador deberá verificar los datos por un canal acordado;
no se considerará válido a alguien solo porque conoce un legajo o tiene un correo
con determinado dominio. Los cambios de legajo, correo y rol serán administrativos.

## 2. Conceptos básicos

- Una **tabla** guarda registros del mismo tipo, por ejemplo empleados.
- Una **clave primaria** identifica un registro sin depender del nombre de una persona.
- Una **clave foránea** relaciona registros, por ejemplo un pedido con su empleado.
- Una **restricción** impide guardar datos inválidos o duplicados, incluso si la interfaz falla.
- Una **transacción** guarda una operación completa o no guarda nada si alguna parte falla.

Los IDs propuestos son UUID: identificadores generados, independientes del
legajo, del correo y del nombre. Las fechas de entrega se guardan como `date`;
los instantes de cierre y registro, como `timestamptz`.

## 3. Tablas propuestas

### Cuentas de autenticación y permisos

El proveedor de autenticación guarda la cuenta, verifica el correo y gestiona el
inicio de sesión. No construiremos una tabla propia de contraseñas.

Una tabla `cuentas` complementará la identidad del proveedor:

| Campo | Uso |
| --- | --- |
| `usuario_id` | Clave primaria y referencia al ID del usuario autenticado. |
| `rol` | `empleado` o `administrador`, asignado por una operación administrativa autorizada. |
| `habilitada` | Permite bloquear el acceso a los datos aunque exista una sesión. |

Los permisos nunca se toman de un rol enviado por el navegador. Una cuenta de
empleado necesita además estar vinculada a un empleado habilitado.

### Empleados

| Campo | Uso |
| --- | --- |
| `id` | Clave primaria interna. |
| `legajo` | Texto único y no vacío; conserva valores como `001234`. |
| `nombre` | Nombre visible, no utilizado como identificador. |
| `correo_laboral` | Correo para invitar y vincular la cuenta; único con comparación sin distinguir mayúsculas. |
| `usuario_id` | Referencia única a `cuentas`; puede estar vacía hasta activar el acceso. |
| `habilitado` | Permite realizar nuevos pedidos y operar con la cuenta vinculada. |

El correo verificado de autenticación debe corresponder al correo autorizado
del empleado. Cambiar un correo no permite apropiarse de otro empleado: requiere
un procedimiento administrativo de verificación y actualización del vínculo.
Deshabilitar un empleado no borra sus pedidos históricos ni cancela automáticamente
los ya confirmados; el administrador podrá consultarlos y registrar sus entregas.

### Jornadas de entrega

| Campo | Uso |
| --- | --- |
| `fecha_entrega` | Clave primaria: día para el que se preparan las viandas. |
| `cierre_pedidos_at` | Instante de cierre calculado con la zona horaria acordada. |
| `publicada` | Indica si el empleado puede ver y elegir los menús de esa jornada. |

Guardar el cierre por jornada permite ajustar futuros días al horario real del
restaurante sin depender de la configuración horaria del navegador.
Se aceptan cambios solo cuando la hora del servidor es **anterior** al cierre;
en el instante exacto del cierre ya no se aceptan.

Ejemplo provisional: para la entrega del `07-10-2026`, el cierre sería
`07-10-2026 00:00` en Argentina, equivalente a `2026-10-07T03:00:00Z`.
Si el restaurante confirma las 20:00 del día anterior, se configuraría ese
instante en su lugar. No habilitaremos entregas en fines de semana o feriados por
suposición: solo se podrá pedir en jornadas que el administrador publique.

### Opciones de menú

| Campo | Uso |
| --- | --- |
| `id` | Clave primaria. |
| `fecha_entrega` | Referencia a la jornada. |
| `tipo` | Código `C`, `V` o `L`, utilizado por la pantalla actual. |
| `descripcion` | Plato ofrecido para esa fecha y tipo. |

Habrá como máximo una opción de cada tipo por jornada, mediante una restricción
única de fecha y tipo. La denominación completa de `V` queda por confirmar.
No se eliminarán opciones referenciadas por pedidos. Los cambios de menús con
pedidos existentes requieren acordar su regla antes de habilitar esa edición.

### Pedidos

| Campo | Uso |
| --- | --- |
| `id` | Clave primaria utilizada en las confirmaciones. |
| `empleado_id` | Dueño del pedido, aunque un administrador lo haya cargado. |
| `fecha_entrega` | Referencia a la jornada. |
| `creado_por` | Cuenta que realizó la carga inicial. |
| `actualizado_por` | Cuenta que realizó la última modificación o cancelación. |
| `creado_at`, `actualizado_at` | Instantes de registro. |
| `cancelado_at` | Vacío para pedidos activos; con valor para los cancelados. |

Una restricción única parcial impedirá dos pedidos **activos** del mismo empleado
en la misma fecha. Los cancelados se conservarán y no aparecerán en los totales
activos. Un nuevo pedido tras cancelar tendrá otro ID y respetará el cierre.

### Detalles de pedido

| Campo | Uso |
| --- | --- |
| `pedido_id` | Referencia al pedido. |
| `opcion_menu_id` | Referencia al menú elegido para la misma fecha del pedido. |
| `cantidad_pedida` | Entero mayor que cero. |
| `cantidad_entregada` | Entero entre cero y la cantidad pedida, inicialmente cero. |

La pareja pedido/opción será única. Solo se guardan las opciones pedidas: si
alguien elige dos C y una L, habrá dos detalles; no hace falta guardar una fila
de V con cantidad cero. Todo pedido activo debe tener al menos un detalle.
La base debe impedir que un detalle elija una opción de otra fecha.

## 4. Relaciones y cantidades

```text
Cuenta -------- Empleado -------- Pedido -------- Detalle -------- Opción
                  1                N               N                1
                                    |                               |
                                    +----------- Jornada -----------+
```

Cada empleado puede tener muchos pedidos en fechas distintas; cada pedido puede
tener varios detalles. Una jornada reúne sus opciones y pedidos. La vinculación
de cuenta a empleado es opcional y, cuando existe, es uno a uno.

No guardaremos por separado los totales ni el estado pendiente/parcial/entregado:
se calculan a partir de los detalles para evitar valores contradictorios.
El restaurante recibe la suma de **pedidas** de pedidos activos; el administrador
también ve entregadas y pendientes. Las entregas no reducen lo solicitado para
preparación.

## 5. Operaciones y seguridad

- Sin sesión habilitada, no se accede a datos reales.
- Un empleado consulta y modifica únicamente sus propios pedidos antes del cierre; no modifica cantidades entregadas.
- Un administrador habilitado consulta la lista, publica menús y registra entregas. La carga de pedidos en nombre de empleados respeta el mismo cierre.
- Crear o modificar un pedido valida cantidades, dueño, jornada publicada, opciones, cierre y ausencia de otro pedido activo dentro de una transacción.
- Cancelar conserva el registro y queda excluido de los totales. El cierre se valida también para esta operación.
- Entregar valida el saldo en una transacción y bloquea o actualiza condicionalmente las filas afectadas: dos administradores no pueden entregar la misma última unidad.
- Una entrega completa pone cada cantidad entregada en su cantidad pedida; una parcial suma unidades al saldo previamente entregado, sin superarlo.
- Un reintento de una entrega parcial no debe sumar dos veces: la implementación tendrá una clave de operación única y un registro transaccional de operaciones procesadas. Su tabla técnica se definirá en la migración.
- El servidor registra quién realiza los cambios. La conservación de cada evento de entrega se definirá al implementar esas operaciones; los acumulados no reemplazan un historial detallado.
- Los permisos se aplican también en la base mediante políticas por fila (RLS). Las operaciones con privilegios adicionales deben verificar permisos explícitamente.
- Las credenciales privilegiadas quedan exclusivamente en el servidor, nunca en variables `NEXT_PUBLIC_*` ni en el repositorio.

Ocultar botones no reemplaza estos controles. Las restricciones y políticas se
probarán con dos cuentas de empleado y dos administradores usando datos ficticios.

## 6. Próximo paso

1. Crear un proyecto de prueba de base de datos y autenticación.
2. Traducir este modelo a una migración SQL versionada, con restricciones y permisos.
3. Configurar variables locales y de Vercel sin subir secretos al repositorio.
4. Crear cuentas ficticias y verificar accesos permitidos y prohibidos.
5. Conectar la consulta por fecha; después, las entregas completas y parciales.

Antes de usar correos reales hay que comprobar el envío de mensajes de
autenticación, el procedimiento de altas y la autorización del banco para alojar
estos datos. La elección del mecanismo concreto de acceso se resolverá en la
configuración de autenticación, sin cambiar el legajo como identidad del empleado.
