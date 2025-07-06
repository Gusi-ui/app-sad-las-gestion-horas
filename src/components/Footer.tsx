import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-blue-50 border-t border-blue-200 py-4 mt-8 text-center text-xs text-blue-800">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="font-semibold text-blue-700">App SAD</span>
        <span className="text-blue-600">&copy; {new Date().getFullYear()} Todos los derechos reservados.</span>
        <span className="text-blue-400">Hecho con ❤️ para la gestión de servicios</span>
      </div>
    </footer>
  );
} 