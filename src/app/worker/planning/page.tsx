"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Assignment, User as UserType, WeekDay } from "@/lib/types";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

interface AssignmentWithUser extends Assignment {
  users?: UserType;
}

// Función para convertir hora a minutos para ordenamiento
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

// Función para obtener la hora de inicio de un horario
function getStartTime(slots: any[] | undefined): string | null {
  if (!slots || slots.length === 0) return null;
  
  if (slots.length === 2 && typeof slots[0] === 'string' && typeof slots[1] === 'string') {
    return slots[0];
  } else if (typeof slots[0] === 'object' && slots[0] !== null && 'start' in slots[0]) {
    return slots[0].start;
  }
  
  return null;
}

// Función para ordenar asignaciones por hora de inicio
function sortAssignmentsByTime(assignments: AssignmentWithUser[], dayKey: string): AssignmentWithUser[] {
  return [...assignments].sort((a, b) => {
    const slotsA = (a.specific_schedule as any)?.[dayKey];
    const slotsB = (b.specific_schedule as any)?.[dayKey];
    
    const startTimeA = getStartTime(slotsA);
    const startTimeB = getStartTime(slotsB);
    
    // Si ambos tienen horario, ordenar por hora
    if (startTimeA && startTimeB) {
      return timeToMinutes(startTimeA) - timeToMinutes(startTimeB);
    }
    
    // Si solo uno tiene horario, el que tiene horario va primero
    if (startTimeA && !startTimeB) return -1;
    if (!startTimeA && startTimeB) return 1;
    
    // Si ninguno tiene horario, mantener orden original
    return 0;
  });
}

export default function WorkerPlanningPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("No autenticado");
        setLoading(false);
        return;
      }
      // Buscar trabajadora por email
      const { data: workerData, error: workerError } = await supabase
        .from("workers")
        .select("*")
        .eq("email", user.email)
        .single();
      if (workerError || !workerData) {
        setError("No se encontró la trabajadora asociada a este usuario");
        setLoading(false);
        return;
      }
      // Buscar asignaciones activas
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*, users(*)")
        .eq("worker_id", workerData.id)
        .eq("status", "active");
      setAssignments(assignmentsData as AssignmentWithUser[] || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Función para formatear los horarios de una asignación
  const formatSchedule = (slots: any[] | undefined) => {
    if (!slots || slots.length === 0) return null;
    // Caso: array de objetos {start, end}
    if (typeof slots[0] === 'object' && slots[0] !== null && 'start' in slots[0] && 'end' in slots[0]) {
      return slots
        .map((slot: any) => `${slot.start} - ${slot.end}`)
        .join(' | ');
    }
    // Caso: array de strings pares (['08:00', '09:30', '13:00', '15:00'])
    if (Array.isArray(slots) && slots.length > 2 && slots.length % 2 === 0 && typeof slots[0] === 'string') {
      const tramos = [];
      for (let i = 0; i < slots.length; i += 2) {
        tramos.push(`${slots[i]} - ${slots[i+1]}`);
      }
      return tramos.join(' | ');
    }
    // Caso: array de 2 strings (['08:00', '09:30'])
    if (slots.length === 2 && typeof slots[0] === 'string' && typeof slots[1] === 'string') {
      return `${slots[0]} - ${slots[1]}`;
    }
    // Fallback: mostrar como string
    return slots.map(String).join(' | ');
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando planning...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <Calendar className="inline w-6 h-6 mr-2 text-blue-600" />
            Planning semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <span className="text-slate-700 font-medium whitespace-nowrap text-base pr-2">Servicios y horarios asignados.</span>
            <Button
              onClick={() => router.push('/worker/dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white shadow rounded px-4 py-2 transition-colors mt-2 sm:mt-0"
            >
              Volver al dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Horarios por día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map(day => {
              // Filtrar asignaciones con horario para este día
              const dayAssignments = sortAssignmentsByTime(assignments, day.value).filter(a => {
                const slots = (a.specific_schedule as any)?.[day.value];
                return slots && slots.length > 0;
              });
              if (dayAssignments.length === 0) return null;
              return (
                <div key={day.value}>
                  <div className="font-semibold text-slate-800 mb-1">{day.label}</div>
                  <ul className="space-y-2">
                    {dayAssignments.map(a => {
                      const slots = (a.specific_schedule as any)?.[day.value];
                      const formatted = formatSchedule(slots);
                      return (
                        <li key={a.id}
                          className="
                            flex-col items-start gap-1 text-slate-700 text-sm
                            bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2
                            flex
                          "
                        >
                          <div className="flex items-center gap-2 w-full">
                            <User className="w-4 h-4 text-blue-500 mr-1 flex-shrink-0" />
                            <span className="font-semibold text-slate-900 truncate">
                              {a.users?.name} {a.users?.surname}
                            </span>
                          </div>
                          <div className="text-blue-700 font-medium text-sm w-full mt-1">
                            {formatted}
                          </div>
                          {a.users?.address && (
                            <div className="flex items-center text-xs text-slate-500 mt-1 w-full">
                              <span className="mr-1">📍</span>
                              <span className="truncate">{a.users?.address}</span>
                            </div>
                          )}
                          {a.users?.phone && (
                            <div className="flex items-center text-xs text-slate-500 mt-1 w-full">
                              <span className="mr-1">📞</span>
                              <span className="truncate">{a.users?.phone}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 