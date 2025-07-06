-- Migración: Añadir festivos de 2024 y 2026 para Mataró
-- Fecha: Enero 2025

-- Festivos 2024 para Mataró
insert into local_holidays (year, month, day, name, type) values
(2024, 1, 1, 'Fin de Año', 'nacional'),
(2024, 1, 6, 'Reyes', 'nacional'),
(2024, 3, 29, 'Viernes Santo', 'nacional'),
(2024, 4, 1, 'Lunes de Pascua Florida', 'regional'),
(2024, 5, 1, 'Fiesta del Trabajo', 'nacional'),
(2024, 6, 10, 'Feria en Mataró', 'local'),
(2024, 6, 24, 'San Juan', 'regional'),
(2024, 7, 22, 'Fiesta mayor de Les Santes', 'local'),
(2024, 8, 15, 'La Asunción', 'nacional'),
(2024, 9, 11, 'Día Nacional de Cataluña', 'regional'),
(2024, 11, 1, 'Todos los Santos', 'nacional'),
(2024, 12, 6, 'Día de la Constitución', 'nacional'),
(2024, 12, 8, 'La Inmaculada', 'nacional'),
(2024, 12, 25, 'Navidad', 'nacional'),
(2024, 12, 26, 'San Esteban', 'regional');

-- Festivos 2026 para Mataró
insert into local_holidays (year, month, day, name, type) values
(2026, 1, 1, 'Fin de Año', 'nacional'),
(2026, 1, 6, 'Reyes', 'nacional'),
(2026, 4, 3, 'Viernes Santo', 'nacional'),
(2026, 4, 6, 'Lunes de Pascua Florida', 'regional'),
(2026, 5, 1, 'Fiesta del Trabajo', 'nacional'),
(2026, 6, 8, 'Feria en Mataró', 'local'),
(2026, 6, 24, 'San Juan', 'regional'),
(2026, 7, 27, 'Fiesta mayor de Les Santes', 'local'),
(2026, 8, 15, 'La Asunción', 'nacional'),
(2026, 9, 11, 'Día Nacional de Cataluña', 'regional'),
(2026, 11, 1, 'Todos los Santos', 'nacional'),
(2026, 12, 6, 'Día de la Constitución', 'nacional'),
(2026, 12, 8, 'La Inmaculada', 'nacional'),
(2026, 12, 25, 'Navidad', 'nacional'),
(2026, 12, 26, 'San Esteban', 'regional'); 