module.exports = {
    name: 'Descargar Datos',
    steps: [
        {
            id: 1,
            description: 'Iniciar descarga en SalaC',
            location: 'SalaC',
            action: 'iniciar_descarga',
            message: 'Has iniciado la descarga de datos. Espera un turno...'
        },
        {
            id: 2,
            description: 'Esperar descarga',
            location: 'SalaC',
            action: 'esperar',
            message: 'La descarga está en progreso...'
        },
        {
            id: 3,
            description: 'Subir datos en SalaA',
            location: 'SalaA',
            action: 'subir_datos',
            message: '¡Has completado la tarea de descarga de datos!'
        }
    ]
}; 