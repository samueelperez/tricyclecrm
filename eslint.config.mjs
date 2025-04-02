import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// En Next.js 14, 'next/core-web-vitals' ya incluye la configuración de TypeScript
const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
