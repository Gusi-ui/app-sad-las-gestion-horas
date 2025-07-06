"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, PlusCircle, Calendar, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Holiday {
  id: string;
  year: number;
  month: number;
  day: number;
  name: string;
  type: string;
}

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function HolidaysPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | "">("");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    year: year,
    month: 1,
    day: 1,
    type: "local"
  });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/holidays?year=${year}`;
      if (month) url += `&month=${month}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar festivos");
      setHolidays(data.holidays || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line
  }, [year, month]);

  // Limpiar mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAdd = async () => {
    setAdding(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al añadir festivo");
      setForm({ ...form, name: "" });
      setSuccessMessage(`Festivo "${form.name}" añadido correctamente`);
      fetchHolidays();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al borrar festivo");
      fetchHolidays();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'local':
        return 'bg-blue-100 text-blue-800';
      case 'regional':
        return 'bg-purple-100 text-purple-800';
      case 'nacional':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Gestión de Festivos</h1>
                <p className="text-sm text-slate-600">Administra los festivos locales, regionales y nacionales</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">Mataró</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                <select
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="p-2 border rounded-md bg-white"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mes</label>
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value ? Number(e.target.value) : "")}
                  className="p-2 border rounded-md bg-white"
                >
                  <option value="">Todos los meses</option>
                  {monthNames.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Añadir Festivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlusCircle className="w-5 h-5 mr-2" />
              Añadir Nuevo Festivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Fiesta Mayor"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mes</label>
                <select
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                >
                  {monthNames.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Día</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.day}
                  onChange={e => setForm(f => ({ ...f, day: Number(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="nacional">Nacional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                <input
                  type="number"
                  min={2024}
                  max={2030}
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAdd} 
                  disabled={adding || !form.name} 
                  className="w-full flex items-center justify-center"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  {adding ? 'Añadiendo...' : 'Añadir'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mensajes */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-800 font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Lista de Festivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Festivos {month ? `de ${monthNames[month - 1]}` : ''} {year}
              </div>
              <div className="text-sm text-slate-600">
                {holidays.length} festivo{holidays.length !== 1 ? 's' : ''}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Cargando festivos...</span>
              </div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay festivos</h3>
                <p className="text-slate-600">
                  {month ? `No hay festivos en ${monthNames[month - 1]} ${year}` : `No hay festivos en ${year}`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Tipo</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map(holiday => (
                      <tr key={holiday.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">
                            {holiday.day} {monthNames[holiday.month - 1]}
                          </div>
                          <div className="text-xs text-slate-500">{holiday.year}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-900">{holiday.name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(holiday.type)}`}>
                            {holiday.type === 'local' ? 'Local' : 
                             holiday.type === 'regional' ? 'Regional' : 
                             holiday.type === 'nacional' ? 'Nacional' : holiday.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(holiday.id)}
                            disabled={deleting === holiday.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === holiday.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 