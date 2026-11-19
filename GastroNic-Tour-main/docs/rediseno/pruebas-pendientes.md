# Rediseño GastroNic · Pruebas pendientes con sesión iniciada

Las capturas automáticas del rediseño se toman sin sesión, así que las
pantallas protegidas muestran la pantalla de inicio de sesión. Estas
pruebas requieren una cuenta real o de prueba y quedan pendientes hasta
que alguien las ejecute y marque el resultado.

Formato de cada prueba: pasos, resultado esperado y estado
(`pendiente`, `ok`, `falla` + nota).

## Etapa 1 · Botones de 44 px en paneles

| # | Pantalla | Pasos | Resultado esperado | Estado |
|---|----------|-------|--------------------|--------|
| 1.1 | Propietario · Reservaciones | Abrir una reserva pendiente y ver los botones Confirmar / Rechazar | Los botones caben sin desbordar ni romper la fila; altura 44 px | pendiente |
| 1.2 | Propietario · Menú | Abrir "Nuevo plato" y "Nueva categoría" | Botones del diálogo alineados; nada se corta en 375 px | pendiente |
| 1.3 | Propietario · Horarios | Abrir horarios especiales | Botones Guardar / Cancelar alineados | pendiente |
| 1.4 | Admin · Revisión de restaurante | Aprobar y rechazar desde `/admin/restaurants/[id]` | Botones visibles y alineados | pendiente |

## Etapa 2 · Confirmaciones (reemplazo de `window.confirm`)

En todos los casos: "Cancelar", Escape o clic fuera **no** ejecutan la
acción; el botón rojo de confirmar **sí** la ejecuta, igual que antes.
El foco vuelve al botón que abrió el diálogo al cerrarlo.

| # | Pantalla | Acción | Archivo | Estado |
|---|----------|--------|---------|--------|
| 2.1 | Mis rutas (`/routes/my-routes`) | Eliminar una ruta guardada | `app/routes/my-routes/page.tsx` | pendiente |
| 2.2 | Mis rutas | Abandonar una ruta en curso | `app/routes/my-routes/page.tsx` | pendiente |
| 2.3 | Propietario · Horarios | Eliminar un horario especial | `components/owner/restaurant-hours-form.tsx` | pendiente |
| 2.4 | Propietario · Menú | Eliminar una categoría vacía | `components/owner/restaurant-menu-manager.tsx` | pendiente |
| 2.5 | Detalle de restaurante | Eliminar mi reseña | `components/restaurant/reviews-section.tsx` | pendiente |

Caso límite a revisar en 2.4: si la categoría tiene platos, debe seguir
apareciendo el mensaje de error **sin** abrir el diálogo.

## Etapa 2 · Tarjetas y estados

| # | Pantalla | Pasos | Resultado esperado | Estado |
|---|----------|-------|--------------------|--------|
| 2.6 | Inicio, explorar, favoritos | Marcar y desmarcar favorito desde una tarjeta | Cambia el corazón y **no** navega al restaurante | pendiente |
| 2.7 | Perfil · Reservas | Ver reservas en cada estado | Insignia con ícono y texto correctos | pendiente |
| 2.8 | Perfil · Reseñas | Ver reseñas publicadas, pendientes y ocultas | Insignia con ícono y texto correctos | pendiente |
| 2.9 | Perfil · Visitados | Ver un restaurante sin rango estimado | Muestra "$" a "$$$$", nunca "C$C$" | pendiente |

## Cómo reportar

Cambiar `pendiente` por `ok` o `falla: <qué pasó>` y avisar en el canal
del proyecto. Una falla funcional detiene el avance del rediseño hasta
corregirla.

## Etapa 3 · Navegación, avisos y estados

| # | Pantalla | Pasos | Resultado esperado | Estado |
|---|----------|-------|--------------------|--------|
| 3.1 | Cabecera del viajero (con sesión) | Entrar con una cuenta de viajero | Se ven favoritos, campana y menú de cuenta; no aparecen "Iniciar sesión" ni "Crear cuenta" | pendiente |
| 3.2 | Cabecera · notificaciones | Abrir la campana con notificaciones sin leer; "Marcar todas como leídas"; abrir una | Contador correcto, se marcan como leídas y navega al enlace de la notificación | pendiente |
| 3.3 | Cabecera · cerrar sesión | Menú de cuenta → Cerrar sesión (escritorio y menú móvil) | Cierra la sesión y redirige como antes | pendiente |
| 3.4 | Portal de restaurantes | Recorrer cada enlace de la barra lateral en escritorio y celular | Enlace activo marcado; el menú móvil se cierra con Escape y con clic fuera | pendiente |
| 3.5 | Consola de administración | Igual que 3.4 | Igual que 3.4; la etiqueta dice "Administración" | pendiente |
| 3.6 | Cabecera del propietario | Abrir notificaciones y menú de cuenta | Se abren y cierran como antes | pendiente |
| 3.7 | Favoritos sin conexión | Desactivar la red y pulsar el corazón de una tarjeta | El corazón vuelve a su estado y aparece el aviso "No pudimos actualizar tus favoritos" | pendiente |

### Problemas existentes detectados (no causados por el rediseño)

- La barra lateral del propietario enlaza "Solicitudes" a `/owner/applications`,
  ruta que no existe (404). Se conservó; requiere decidir si se crea la página
  o se quita el enlace.
- No existe página de política de privacidad. El pie anterior enlazaba
  "Privacidad" y "Cookies" a `/`; se retiraron hasta que existan.

## Etapa 4 · Flujos del viajero

| # | Pantalla | Pasos | Resultado esperado | Estado |
|---|----------|-------|--------------------|--------|
| 4.1 | Inicio (celular) | Buscar desde el buscador del inicio | Muestra resultados y navega igual que el de la cabecera | pendiente |
| 4.2 | Inicio | Pulsar "Ver el mapa" y "Rutas gastronómicas" | Desplaza a la sección sin quedar tapada por la cabecera | pendiente |
| 4.3 | Detalle (escritorio) | "Reservar ahora" desde la tarjeta clara de la columna lateral | Abre el mismo formulario de siempre y envía la reserva | pendiente |
| 4.4 | Detalle (celular) | Barra inferior "Reservar" | Visible encima de la navegación y lleva a la sección de reserva | pendiente |
| 4.5 | Mapa | Acercar, abrir un grupo y tocar un punto | El grupo se expande, el número es legible y el popup abre el restaurante; ya no aparecen otros negocios de Mapbox | pendiente |
| 4.6 | Mis rutas / ruta personalizada | Iniciar, avanzar y abandonar una ruta | Mismo comportamiento; textos de 12 px o más | pendiente |
| 4.7 | Perfil gastronómico y puntos | Revisar las pestañas del perfil | Sin textos cortados por el cambio de tamaño mínimo | pendiente |

## Etapa 5 · Paneles de propietario y administración

Esta etapa **no tiene verificación visual**: sin una cuenta de prueba,
las capturas de los paneles muestran la pantalla de inicio de sesión.
Antes de publicar, recorrer cada pantalla del portal y de la consola a
375, 768 y 1280 px y revisar:

| # | Revisión | Resultado esperado | Estado |
|---|----------|--------------------|--------|
| 5.1 | Tablas y listas (reservas, reseñas, usuarios, auditoría) | Textos de 12 px o más sin cortes ni filas desbordadas | pendiente |
| 5.2 | Insignias de estado de reservas del propietario | Ícono + texto; colores iguales a los del perfil del viajero | pendiente |
| 5.3 | Diálogos de confirmar, rechazar y cancelar | Botones de 44 px alineados; nada se corta en 375 px | pendiente |
| 5.4 | Dashboards y estadísticas | Tarjetas con borde, sin sombras pesadas; números legibles | pendiente |
| 5.5 | Mensajes de éxito y error en formularios del propietario | Colores semánticos (verde, ámbar, rojo) con buen contraste | pendiente |

## Etapa 6 · Landing, autenticación y control de calidad

| # | Pantalla | Pasos | Resultado esperado | Estado |
|---|----------|-------|--------------------|--------|
| 6.1 | Landing con sesión iniciada | Abrir `/` con sesión | Los botones dicen "Continuar en GastroNic" / "Ir a mi inicio" y llevan a `/home` | pendiente |
| 6.2 | Registro, recuperación y cambio de contraseña | Completar cada flujo | Mismo comportamiento; mensajes de error con contraste suficiente | pendiente |
| 6.3 | Login y registro de propietario | Completar cada flujo | Redirige al portal como antes | pendiente |

## Decisiones de contenido pendientes (no se modificaron)

1. **Sección "IA" de la landing.** Promete tres asistentes con inteligencia
   artificial (guía para turistas, asistente para emprendedores, cocina
   nutritiva) que no existen en el código. La "ruta inteligente" actual es
   un planificador por reglas, no IA.
2. **Rutas nombradas de la landing.** "Ruta del Café" (Jinotega), "Sabores
   tradicionales" (Granada) y "Ruta urbana" (Managua) no existen como rutas
   publicadas; en el inicio solo aparece "Ruta de Comida Típica".
3. **Respaldo institucional.** Se menciona a INATEC y Universidad Americana;
   confirmar que el uso de sus nombres está autorizado.
4. **Fotografías.** La landing usa 3 fotos de Unsplash repetidas en 7 lugares,
   y los 6 restaurantes públicos tienen fotos de Unsplash como `external_url`
   en la base de datos. Reemplazar por fotografía propia.
5. **Política de privacidad.** El login y el registro dicen "Al continuar
   aceptas … la política de privacidad", pero esa página no existe.
6. **`/owner/applications`.** Enlace del portal a una ruta inexistente.
7. **Logo.** Solo existe como imagen completa (JPEG/PNG); a 40 px el texto no
   se lee. Pedir SVG y una versión del isotipo (mango) por separado.
