"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Star } from "lucide-react";

interface Holiday {
  id: string;
  year: number;
  month: number;
  day: number;
  name: string;
  type: string;
}

interface HolidaysInfoCardProps {
  month: number;
  year: number;
}

export function HolidaysInfoCard({ month, year }: HolidaysInfoCardProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/holidays?year=${year}&month=${month}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Error al cargar festivos");
        }
        
        setHolidays(data.holidays || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [month, year]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'local':
        return <MapPin className="w-3 h-3" />;
      case 'regional':
        return <Star className="w-3 h-3" />;
      case 'nacional':
        return <Calendar className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'local':
        return 'text-blue-600 bg-blue-50';
      case 'regional':
        return 'text-purple-600 bg-purple-50';
      case 'nacional':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'local':
        return 'Local';
      case 'regional':
        return 'Regional';
      case 'nacional':
        return 'Nacional';
      default:
        return type;
    }
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-slate-600">Cargando festivos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">Error al cargar festivos: {error}</p>
      </div>
    );
  }

  if (holidays.length === 0) {
    return (
      <div className="text-center py-4">
        <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600">
          No hay festivos en {monthNames[month - 1]} {year}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600 mb-3">
        <strong>{monthNames[month - 1]} {year}</strong> - {holidays.length} festivo{holidays.length !== 1 ? 's' : ''}
      </div>
      
      <div className="space-y-2">
        {holidays.map(holiday => (
          <div key={holiday.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={`p-1 rounded ${getTypeColor(holiday.type)}`}>
                {getTypeIcon(holiday.type)}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {holiday.day} {monthNames[month - 1]}
                </div>
                <div className="text-xs text-slate-600">
                  {holiday.name}
                </div>
              </div>
            </div>
            <div className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700">
              {getTypeLabel(holiday.type)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 