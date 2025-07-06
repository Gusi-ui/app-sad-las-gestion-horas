"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, PlusCircle } from "lucide-react";

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

export default function HolidaysTestPage() {
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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Festivos (Test)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1">Año</label>
                <select
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="p-2 border rounded"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Mes</label>
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value ? Number(e.target.value) : "")}
                  className="p-2 border rounded"
                >
                  <option value="">Todos</option>
                  {monthNames.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Añadir festivo</h4>
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="p-2 border rounded w-40"
                />
                <select
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}
                  className="p-2 border rounded"
                >
                  {monthNames.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.day}
                  onChange={e => setForm(f => ({ ...f, day: Number(e.target.value) }))}
                  className="p-2 border rounded w-16"
                />
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="p-2 border rounded"
                >
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="nacional">Nacional</option>
                </select>
                <input
                  type="number"
                  min={2024}
                  max={2100}
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                  className="p-2 border rounded w-20"
                />
                <Button onClick={handleAdd} disabled={adding || !form.name} className="flex items-center gap-1">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  Añadir
                </Button>
              </div>
            </div>

            {successMessage && (
              <div className="text-green-600 bg-green-50 border border-green-200 rounded p-2 mb-4">
                ✅ {successMessage}
              </div>
            )}
            {loading ? (
              <div className="flex items-center gap-2 text-slate-600"><Loader2 className="w-4 h-4 animate-spin" />Cargando...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : holidays.length === 0 ? (
              <div className="text-slate-500">No hay festivos para este periodo.</div>
            ) : (
              <table className="w-full text-sm border mt-4">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border px-2 py-1">Fecha</th>
                    <th className="border px-2 py-1">Nombre</th>
                    <th className="border px-2 py-1">Tipo</th>
                    <th className="border px-2 py-1">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map(h => (
                    <tr key={h.id}>
                      <td className="border px-2 py-1 whitespace-nowrap">{h.day}/{h.month}/{h.year}</td>
                      <td className="border px-2 py-1">{h.name}</td>
                      <td className="border px-2 py-1 capitalize">{h.type}</td>
                      <td className="border px-2 py-1">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(h.id)}
                          disabled={deleting === h.id}
                          className="flex items-center gap-1"
                        >
                          {deleting === h.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Borrar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 