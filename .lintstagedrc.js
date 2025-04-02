module.exports = {
  // Para archivos TypeScript y React
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings=0',
  ],
  // Para archivos JavaScript
  '**/*.js': [
    'eslint --fix --max-warnings=0',
  ],
  // Para archivos CSS y SCSS
  '**/*.{css,scss}': [
    'prettier --write',
  ],
  // Para todos los archivos que se pueden formatear con Prettier
  '**/*.{js,jsx,ts,tsx,json,md}': [
    'prettier --write',
  ],
} 