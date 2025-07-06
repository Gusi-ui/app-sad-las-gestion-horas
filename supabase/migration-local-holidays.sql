-- Tabla de festivos locales, regionales y nacionales para Mataró
create table if not exists local_holidays (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null,
  day int not null,
  name text not null,
  type text default 'local', -- local, regional, nacional
  created_at timestamp with time zone default now()
);

create index if not exists idx_local_holidays_year_month on local_holidays(year, month);

-- Carga inicial para Mataró 2025
insert into local_holidays (year, month, day, name, type) values
(2025, 1, 1, 'Fin de Año', 'nacional'),
(2025, 1, 6, 'Reyes', 'nacional'),
(2025, 4, 18, 'Viernes Santo', 'nacional'),
(2025, 4, 21, 'Lunes de Pascua Florida', 'regional'),
(2025, 5, 1, 'Fiesta del Trabajo', 'nacional'),
(2025, 6, 9, 'Feria en Mataró', 'local'),
(2025, 6, 24, 'San Juan', 'regional'),
(2025, 7, 28, 'Fiesta mayor de Les Santes', 'local'),
(2025, 8, 15, 'La Asunción', 'nacional'),
(2025, 9, 11, 'Día Nacional de Cataluña', 'regional'),
(2025, 11, 1, 'Todos los Santos', 'nacional'),
(2025, 12, 6, 'Día de la Constitución', 'nacional'),
(2025, 12, 8, 'La Inmaculada', 'nacional'),
(2025, 12, 25, 'Navidad', 'nacional'),
(2025, 12, 26, 'San Esteban', 'regional'); 