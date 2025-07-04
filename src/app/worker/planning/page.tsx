"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Assignment, User as UserType } from "@/lib/types";

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
    if (slots.length === 2 && typeof slots[0] === 'string' && typeof slots[1] === 'string') {
      // Formato antiguo
      return `${slots[0]} - ${slots[1]}`;
    } else if (typeof slots[0] === 'object' && slots[0] !== null && 'start' in slots[0] && 'end' in slots[0]) {
      // Formato nuevo
      return slots.map((slot: any) => {
        if (slot && typeof slot === 'object' && 'start' in slot && 'end' in slot) {
          return `${slot.start} - ${slot.end}`;
        }
        return '';
      }).filter(Boolean).join(', ');
    } else {
      // Si accidentalmente llega un array de objetos, forzar string legible
      return slots.map(slot => {
        if (typeof slot === 'object' && slot !== null && 'start' in slot && 'end' in slot) {
          return `${slot.start} - ${slot.end}`;
        }
        return String(slot);
      }).filter(Boolean).join(', ');
    }
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
          <p className="text-slate-700 mb-4">
            Aquí puedes ver tus servicios asignados y los horarios detallados de cada día de la semana.
          </p>
          <Button variant="secondary" onClick={() => router.push('/worker/dashboard')}>
            Volver al dashboard
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Horarios por día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value}>
                <div className="font-semibold text-slate-800 mb-1">{day.label}</div>
                <ul className="space-y-1">
                  {assignments.map(a => {
                    const slots = (a.specific_schedule as any)?.[day.value];
                    // console.log('Día:', day.value, 'Asignación:', a.id, 'Slots:', slots);
                    const formatted = formatSchedule(slots);
                    if (!formatted) return (
                      <li key={a.id} className="text-slate-400 text-xs">Sin horarios configurados</li>
                    );
                    return (
                      <li key={a.id} className="flex items-center gap-2 text-slate-700 text-sm">
                        <User className="w-4 h-4 text-blue-500 mr-1" />
                        <span>{a.users?.name} {a.users?.surname}</span>
                        <span className="text-slate-500">({formatted})</span>
                        {a.users?.address && (
                          <span className="text-slate-400 ml-2">{a.users?.address}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 