# Sistema de pedidos de viandas para banco

Aplicación web para gestionar la entrega diaria de viandas al personal del banco.

## Objetivo inicial

Reemplazar la lista física de pedidos por una pantalla donde se pueda:

- Ver las personas que pidieron vianda en el día
- Identificar qué opción de menú eligió cada persona
- Marcar cada pedido como entregado
- Ver cuántos pedidos quedan pendientes

## Estado actual

La demo actual trabaja con datos ficticios cargados dentro del proyecto.
La primera versión prevista incorporará usuarios, permisos y base de datos.
La importación desde Excel, CSV o imágenes queda para una ampliación posterior.

## Requisitos del producto

El alcance previsto, las reglas de negocio, las historias de usuario y sus
criterios de aceptación están en
[Requisitos e historias de usuario](docs/requisitos-y-historias-de-usuario.md).
El documento distingue la demo actual, la primera versión y las ampliaciones
posteriores, e identifica las decisiones que todavía deben confirmarse.

El [Modelo de datos inicial](docs/modelo-de-datos.md) propone las tablas,
relaciones y controles para incorporar persistencia y acceso con correo laboral.
Incluye los supuestos provisionales de habilitación y cierre; todavía no hay
una base de datos configurada.

## Desarrollo local

```powershell
npm.cmd install
npm.cmd run dev
```

Abrir la URL que indique la terminal, normalmente http://localhost:3000.
Para revisar el código antes de un commit: `npm.cmd run lint` y `npm.cmd run build`.

### Variables para Supabase

La plantilla `.env.example` documenta las variables necesarias sin credenciales
reales. En la raíz, completar `.env.local` con la URL del proyecto y su clave
publicable, disponibles en el panel Connect de Supabase:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICABLE
```

Si falta `.env.local`, se puede crear a partir de `.env.example`.
Git excluye `.env.local`; solo la plantilla se versiona. No usar una clave secreta,
`service_role` ni la contraseña de PostgreSQL en estas variables públicas.
Reiniciar el servidor local después de cambiarlas. En Vercel se configurarán
por separado: el archivo local no se sube al deploy.

Esta preparación todavía no conecta la pantalla con Supabase: faltan el cliente,
la autenticación y las tablas con sus permisos. La demo sigue usando datos en memoria.

## Diseño de gestión

La pantalla actual usa una paleta azul y amarilla inspirada en la referencia
visual del Banco de Corrientes, sin reproducir su logo ni afirmar que los colores
sean oficiales. El tema es claro, independientemente del modo del dispositivo.

La tabla se conserva en escritorio. En celular y tablet, cada pedido muestra sus
cantidades y acciones en una vista compacta; ambas vistas usan el mismo estado
y las mismas funciones de entrega. Las transiciones respetan la preferencia de
movimiento reducido del sistema.

- `app/page.tsx`: contenido, estado y acciones de la pantalla.
- `app/page.module.css`: estilos específicos de gestión y adaptación a tamaños.
- `app/globals.css`: colores compartidos, tipografía y calendario.

La portada y una posible animación del pescado institucional quedan para una
iteración posterior; todavía no se implementaron.

## Pedidos por fecha

La pantalla administrativa permite seleccionar una fecha de entrega, consultar
sus pedidos y registrar entregas completas o parciales. La tabla y los contadores
muestran únicamente los pedidos de la fecha seleccionada.

Los ejemplos están en `app/page.tsx`. La pantalla abre en el 30-09-2026 para que
la demostración sea reproducible, independientemente del día en que se ejecute.

| Fecha de entrega | Pedidos | Viandas pedidas | Entregadas | Pendientes |
| --- | ---: | ---: | ---: | ---: |
| 30-09-2026 | 3 | 9 | 5 | 4 |
| 01-10-2026 | 2 | 5 | 0 | 5 |

Cada pedido tiene un ID único y una `fechaEntrega` con formato `AAAA-MM-DD`,
sin hora. En pantalla y en el selector se usa siempre `DD-MM-AAAA`.
El calendario usa `react-datepicker` con idioma español y las conversiones de
`date-fns`, sin depender del formato regional del navegador.
La misma persona puede tener un pedido diferente en cada fecha.
Cambiar la fecha filtra la vista; no elimina ni reinicia las entregas.

### Prueba manual

1. En el 30-09-2026, registrar una entrega parcial de una vianda C para
   Persona de prueba 1. Los contadores deben mostrar 9 pedidas, 6 entregadas y 3 pendientes.
2. Cambiar al 01-10-2026. Deben aparecer los valores iniciales 5, 0 y 5.
3. Usar "Entregar todo" para Persona de prueba 1. Los contadores deben quedar en 5, 3 y 2.
4. Volver al 30-09-2026: debe conservar los valores 9, 6 y 3.
5. Elegir el 02-10-2026: debe mostrar cero pedidos, contadores en cero y un estado vacío.
6. Borrar la fecha: debe indicar que la fecha es requerida, sin mostrar pedidos ni acciones.

Las entregas se guardan solamente en memoria: al recargar se restablecen los
ejemplos y la fecha inicial. Todavía no hay base de datos ni autenticación.
