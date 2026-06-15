# Especificación: Sorteo Interactivo en Vivo

**Feature branch**: `001-sorteo-interactivo`
**Creado**: 2026-06-14
**Estado**: Implementado
**Marco**: GitHub Spec Kit (SDD)

## Resumen

Plataforma de sorteo en vivo para eventos (DevOpsDays Lima 2026). Los asistentes se
inscriben escaneando un QR desde su celular; el organizador ejecuta el sorteo en una
pantalla/proyector con una de **8 modalidades animadas**. El ganador se elige de forma
justa en el servidor y se anuncia en tiempo real.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia principal
Como **organizador**, quiero proyectar un QR para que los asistentes se inscriban
desde su celular y luego ejecutar un sorteo visualmente atractivo, para entregar un
premio de forma transparente y entretenida frente al público.

### Roles
- **Asistente** (celular): se inscribe; ve confirmación.
- **Organizador** (proyector): gestiona participantes y ejecuta el sorteo.

### Escenarios de aceptación (Given/When/Then)

1. **Inscripción**
   - *Dado* que el registro está abierto, *cuando* un asistente escanea el QR, completa
     avatar (emoji o foto), nombre y correo (teléfono opcional) y envía, *entonces*
     queda inscrito y aparece **en vivo** en la pantalla del organizador.
2. **Correo único**
   - *Dado* un correo ya inscrito, *cuando* alguien intenta registrarse con el mismo
     correo, *entonces* se rechaza con un mensaje claro.
3. **Ejecutar sorteo**
   - *Dado* ≥ 2 participantes, *cuando* el organizador elige una modalidad e inicia,
     *entonces* se anima el sorteo y se revela un ganador elegido al azar de forma justa.
4. **Registro cerrado durante el sorteo**
   - *Dado* que un sorteo está en curso, *cuando* un asistente intenta inscribirse,
     *entonces* se rechaza y ve "registro cerrado".
   - *Cuando* el organizador vuelve a la pantalla principal, *entonces* el registro se
     **reabre** automáticamente (sin perder participantes).
5. **Retirar o mantener al ganador**
   - *Dado* un ganador revelado, *cuando* el organizador elige "retirar", *entonces* sale
     del pool y no puede volver a ganar; *cuando* elige "mantener", permanece.
6. **Carga sin QR**
   - *Cuando* el organizador pega una lista de participantes (o carga una demo de
     10/50/600), *entonces* se inscriben en bloque, omitiendo correos repetidos.
7. **Ruleta manual**
   - *Dado* el modo Ruleta, *cuando* se abre, *entonces* NO gira sola; gira al pulsar
     **SPIN**.
8. **Muchos participantes**
   - *Dado* > 30 participantes en Ruleta, *entonces* se muestran flotando alrededor con su
     avatar. En la Carrera de Cuys, *entonces* todos caben en pantalla (se ajustan).

### Casos borde
- Menos de 2 participantes → no se puede sortear.
- Avatar con foto → se sube y se referencia por URL (no se incrusta pesada).
- Reinicio del servidor a mitad de evento → el estado de registro (abierto/cerrado)
  persiste.
- Lista pegada con líneas sin correo válido → se omiten y se reportan.

## Requisitos *(obligatorio)*

### Requisitos funcionales
- **FR-001**: El sistema DEBE permitir al asistente inscribirse con avatar (emoji o
  foto), nombre y correo; teléfono opcional.
- **FR-002**: El sistema DEBE garantizar **un correo = un participante** y rechazar
  duplicados con mensaje claro.
- **FR-003**: El sistema DEBE mostrar la lista de participantes **en tiempo real** en la
  pantalla del organizador.
- **FR-004**: El sistema DEBE ofrecer ≥ 8 modalidades de sorteo animadas (ruleta, carrera
  de cuys, tragamonedas, dardos, cartas, paracaidistas, bracket, bola mágica).
- **FR-005**: El sistema DEBE elegir al ganador de forma **justa, aleatoria e
  impredecible**, decidida en el servidor, y registrar cada sorteo.
- **FR-006**: El sistema DEBE **cerrar el registro mientras un sorteo está en curso** y
  **reabrirlo al volver a la pantalla principal**, sin perder participantes.
- **FR-007**: El sistema DEBE permitir **retirar** al ganador del pool o **mantenerlo**.
- **FR-008**: El sistema DEBE permitir alta masiva por **lista pegada** y por **demo
  (10/50/600)**, omitiendo correos repetidos.
- **FR-009**: Las acciones de organizador (sortear, terminar, alta masiva, retirar,
  limpiar) DEBEN estar **protegidas por una clave**; la inscripción del asistente queda
  abierta (salvo bloqueo por sorteo en curso).
- **FR-010**: El sistema DEBE ser **responsive**: en el celular se muestra el formulario a
  pantalla completa de inmediato.
- **FR-011**: La Ruleta DEBE iniciar el giro **manualmente** (botón SPIN) y, con > 30
  participantes, mostrarlos **flotando alrededor**.
- **FR-012**: La Carrera de Cuys DEBE mostrar a **todos** los participantes en pantalla
  (ajustando tamaño), con cuenta regresiva 3·2·1, sonido, y medallas 🥇🥈🥉 por orden de
  llegada; el ganador (1º) se resalta.
- **FR-013**: El QR DEBE codificar la URL pública del frontend y mostrarse con identidad
  de marca.

### Entidades clave
- **Participante**: persona inscrita. Atributos: identificador, número de orden, nombre,
  correo (único), teléfono (opcional), avatar (emoji o URL), fecha de inscripción.
- **Sorteo (Draw)**: ejecución de un sorteo. Atributos: modalidad, ganador, índice del
  ganador, fecha.
- **Estado del evento**: indica si el registro está abierto o cerrado.

## Checklist de revisión y aceptación

- [x] Sin detalles de implementación en los requisitos (qué/por qué, no cómo)
- [x] Enfocado en valor de usuario y necesidad de negocio
- [x] Requisitos verificables y sin ambigüedad
- [x] Escenarios de aceptación definidos
- [x] Casos borde identificados
- [x] Sin marcadores [NEEDS CLARIFICATION] pendientes
