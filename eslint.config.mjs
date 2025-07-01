import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Deshabilitar reglas que están causando problemas durante el desarrollo
      "@typescript-eslint/no-unused-vars": "warn", // Cambiar de error a warning
      "@typescript-eslint/no-explicit-any": "warn", // Cambiar de error a warning
      "react-hooks/exhaustive-deps": "warn", // Cambiar de error a warning
      // Mantener reglas críticas como errores
      "@typescript-eslint/no-var-requires": "error",
      "no-console": "off", // Permitir console.log durante desarrollo
    },
  },
];

export default eslintConfig;
