module.exports = {
  // Simple configuración para todos los archivos
  '**/*.{js,jsx,ts,tsx}': [
    'npx eslint --cache --fix',
  ],
  '**/*.{js,jsx,ts,tsx,json,css,md}': [
    'npx prettier --write',
  ],
} 