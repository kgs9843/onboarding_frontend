import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, 'local.env') });

const apiOrigin = process.env.VITE_API_ORIGIN ?? 'https://olive0.store';
const apiBasePath = process.env.VITE_API_BASE_PATH ?? '/api';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_ORIGIN': JSON.stringify(apiOrigin),
    'import.meta.env.VITE_API_BASE_PATH': JSON.stringify(apiBasePath),
  },
});
