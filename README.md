# Bot de Juego "Impostor" para Discord

## Descripción General

Este bot implementa un juego de "Impostor" en Discord. El juego consiste en un grupo de tripulantes que deben completar tareas en una nave espacial mientras intentan descubrir quién es el impostor entre ellos. El impostor, por su parte, debe eliminar a los tripulantes sin ser descubierto.

## Flujo del Juego

1. **Creación del Juego**: Un jugador crea un juego con `!crear_juego`
2. **Unirse al Juego**: Otros jugadores se unen con `!unirse`
3. **Inicio del Juego**: El creador inicia el juego con `!iniciar`
4. **Asignación de Roles**: Se asigna aleatoriamente un impostor y el resto son tripulantes
5. **Jugabilidad**: Los jugadores realizan tareas, se mueven entre salas, etc.
6. **Finalización**: El juego termina cuando:
   - Los tripulantes completan todas las tareas (alcanzan los puntos requeridos)
   - El impostor elimina a suficientes tripulantes
   - El impostor es descubierto y expulsado
   - Se agota el tiempo

## Condiciones de Victoria

1. **Victoria de los Tripulantes**:
   - Completar todas las tareas (alcanzar 500 puntos)
   - Descubrir y expulsar al impostor

2. **Victoria del Impostor**:
   - Eliminar a suficientes tripulantes
   - Evitar que los tripulantes completen todas las tareas antes de que se agote el tiempo

## Estructura del Sistema

El sistema está compuesto por los siguientes componentes principales:

1. **Archivo Principal (index.js)**: Maneja la inicialización del bot, la carga de comandos y el procesamiento de mensajes.
2. **Estado del Juego (gameState.js)**: Mantiene y gestiona todo el estado del juego, incluyendo jugadores, roles, ubicaciones, tareas, etc.
3. **Comandos (directorio commands/)**: Contiene todos los comandos disponibles para los jugadores.

## Sistema de Temporizadores

El juego utiliza varios temporizadores:

1. **Temporizador del Juego**: 10 minutos para completar las tareas
2. **Temporizador de Tareas**: Entre 30 y 60 segundos para completar cada tarea
3. **Temporizador de Enfriamiento para Matar**: 30 segundos entre asesinatos
4. **Temporizador de Discusión**: 60 segundos para discutir después de reportar un cuerpo
5. **Temporizador de Votación**: 30 segundos para votar después de la discusión
6. **Temporizador de Enfriamiento para Reportar**: 30 segundos entre reportes

## Gestión del Estado del Juego

El estado del juego se mantiene en el objeto `gameState` en el archivo `gameState.js`. Este objeto contiene:

- **isActive**: Indica si hay un juego en curso
- **players**: Array con los IDs de los jugadores
- **maxPlayers**: Número máximo de jugadores (10)
- **minPlayers**: Número mínimo de jugadores para iniciar (4)
- **roles**: Objeto que mapea IDs de jugadores a sus roles (tripulante/impostor/muerto)
- **locations**: Objeto que mapea IDs de jugadores a su ubicación actual
- **tasks**: Objeto que mapea IDs de jugadores a sus tareas pendientes
- **busyPlayers**: Objeto que mapea IDs de jugadores a su estado de ocupación
- **gameTimer**: Temporizador del juego
- **totalPoints**: Puntos totales acumulados por los tripulantes
- **requiredPoints**: Puntos necesarios para que los tripulantes ganen (500)
- **gameDuration**: Duración del juego en milisegundos (10 minutos)
- **bodies**: Objeto que almacena los cadáveres reportados
- **rooms**: Array con información de todas las salas disponibles


## Comandos Disponibles

### Comandos de Gestión del Juego

#### `!crear_juego`
- **Descripción**: Crea un nuevo juego
- **Lógica**:
  1. Verifica que no haya un juego activo
  2. Reinicia el estado del juego
  3. Activa el juego
  4. Agrega al creador como primer jugador
  5. Muestra un mensaje con información del juego creado
- **Restricciones**: Solo funciona en el canal #impostor

#### `!unirse`
- **Descripción**: Permite a un jugador unirse al juego actual
- **Lógica**:
  1. Verifica que haya un juego activo
  2. Verifica que el jugador no esté ya en el juego
  3. Verifica que no se haya excedido el máximo de jugadores
  4. Verifica que el juego no haya comenzado (roles asignados)
  5. Agrega al jugador al juego
  6. Muestra un mensaje de confirmación
- **Restricciones**: Solo funciona en el canal #impostor

#### `!iniciar`
- **Descripción**: Inicia el juego y asigna roles
- **Lógica**:
  1. Verifica que haya un juego activo
  2. Verifica que el juego no haya comenzado
  3. Verifica que quien ejecuta el comando sea el creador
  4. Verifica que haya suficientes jugadores
  5. Asigna roles aleatoriamente (un impostor, el resto tripulantes)
  6. Configura el canal del juego
  7. Envía mensajes generales y privados con los roles
  8. Inicia el temporizador del juego
- **Restricciones**: Solo el creador del juego puede iniciarlo

#### `!terminar_juego`
- **Descripción**: Termina el juego actual
- **Lógica**:
  1. Verifica que haya un juego activo
  2. Reinicia el estado del juego
  3. Muestra un mensaje de confirmación
- **Restricciones**: Solo funciona en el canal #impostor

### Comandos de Jugabilidad

#### `!mover [sala]`
- **Descripción**: Mueve al jugador a otra sala
- **Lógica**:
  1. Verifica que el jugador esté en el juego
  2. Verifica que la sala exista
  3. Verifica que el jugador no esté ocupado
  4. Actualiza la ubicación del jugador
  5. Muestra un mensaje de confirmación
- **Restricciones**: Solo funciona en mensajes directos

#### `!tarea`
- **Descripción**: Muestra las tareas pendientes del jugador
- **Lógica**:
  1. Verifica que el jugador esté en el juego
  2. Obtiene las tareas del jugador
  3. Muestra un mensaje con las tareas pendientes
- **Restricciones**: Solo funciona en mensajes directos

#### `!salas`
- **Descripción**: Muestra información sobre todas las salas
- **Lógica**:
  1. Verifica que el jugador esté en el juego
  2. Obtiene información de todas las salas
  3. Muestra un mensaje con la información
- **Restricciones**: Solo funciona en mensajes directos

### Comandos de Tareas

Existen varios comandos para realizar tareas específicas en diferentes salas:

- `!descargar_datos` (Sala de Administración)
- `!revisar_registros` (Sala de Administración)
- `!calibrar_motores` (Sala de Ingeniería)
- `!reparar_cableado` (Sala de Ingeniería)
- `!establecer_comunicacion` (Sala de Comunicaciones)
- `!limpiar_filtros` (Sala de Comunicaciones)
- `!revisar_camaras` (Sala de Seguridad)
- `!actualizar_sistema` (Sala de Seguridad)
- `!limpiar_filtros_o2` (Sala de Oxígeno)
- `!ajustar_niveles` (Sala de Oxígeno)

Cada comando de tarea sigue una lógica similar:
1. Verifica que el jugador esté en el juego
2. Verifica que el jugador esté en la sala correcta
3. Verifica que el jugador no esté ocupado
4. Verifica que la tarea esté disponible para el jugador
5. Marca al jugador como ocupado
6. Inicia un temporizador para la tarea
7. Cuando se completa, marca la tarea como completada y suma puntos
8. Muestra mensajes de progreso y confirmación

### Comandos del Impostor

#### `!matar`
- **Descripción**: Permite al impostor eliminar a un jugador
- **Lógica**:
  1. Verifica que el jugador esté en el juego
  2. Verifica que el jugador sea el impostor
  3. Verifica que el jugador no esté ocupado
  4. Verifica el tiempo de enfriamiento
  5. Obtiene jugadores en la misma sala
  6. Selecciona un jugador aleatorio para eliminar
  7. Marca al jugador como muerto y deja un cadáver
  8. Actualiza el tiempo de enfriamiento
  9. Envía mensajes de confirmación
- **Restricciones**: Solo el impostor puede usar este comando

### Comandos de Reporte y Votación

#### `!reportar`
- **Descripción**: Permite reportar un cadáver e iniciar una votación
- **Lógica**:
  1. Verifica que el jugador esté en el juego
  2. Verifica que haya un cadáver en la sala
  3. Verifica el tiempo de enfriamiento para reportar
  4. Marca el cadáver como reportado
  5. Inicia una fase de discusión
  6. Después de la discusión, inicia una fase de votación
  7. Al finalizar la votación, expulsa al jugador más votado o continúa el juego
  8. Verifica condiciones de victoria
- **Restricciones**: Solo funciona en el canal #impostor

#### `!votar [jugador]`
- **Descripción**: Permite votar durante una votación
- **Lógica**:
  1. Verifica que haya una votación activa
  2. Verifica que el jugador esté en el juego
  3. Verifica que el jugador votado esté vivo
  4. Registra el voto
  5. Muestra un mensaje de confirmación
- **Restricciones**: Solo funciona durante una votación activa

### Comandos de Ayuda

#### `!ayuda`
- **Descripción**: Muestra información sobre los comandos disponibles
- **Lógica**:
  1. Crea un embed con información sobre los comandos
  2. Muestra el embed como respuesta
- **Restricciones**: Ninguna

#### `!test`
- **Descripción**: Comando de prueba para verificar el funcionamiento del bot
- **Lógica**:
  1. Muestra un mensaje de confirmación
- **Restricciones**: Ninguna

## Salas del Juego

El juego tiene 5 salas diferentes:

1. **Sala de Administración (SalaA)**
   - Descripción: Sala principal con controles de la nave
   - Tareas: Descargar datos, Revisar registros
   - Puntos por tarea: 25

2. **Sala de Ingeniería (SalaB)**
   - Descripción: Donde se reparan los sistemas de la nave
   - Tareas: Calibrar motores, Reparar cableado
   - Puntos por tarea: 30

3. **Sala de Comunicaciones (SalaC)**
   - Descripción: Centro de comunicaciones y datos
   - Tareas: Establecer comunicación, Limpiar filtros
   - Puntos por tarea: 20

4. **Sala de Seguridad (SalaD)**
   - Descripción: Monitoreo de cámaras y sistemas de seguridad
   - Tareas: Revisar cámaras, Actualizar sistema
   - Puntos por tarea: 25

5. **Sala de Oxígeno (SalaE)**
   - Descripción: Sistemas de soporte vital
   - Tareas: Limpiar filtros de O2, Ajustar niveles
   - Puntos por tarea: 25

## Consideraciones Técnicas

- El bot utiliza Discord.js para la interacción con Discord
- El estado del juego se mantiene en memoria (no hay persistencia entre reinicios)
- Los comandos se cargan dinámicamente desde el directorio `commands/`
- El bot utiliza intents y partials para recibir todos los eventos necesarios
- Se implementa un sistema de logging para facilitar la depuración 
