import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envFiles = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
  path.resolve(__dirname, '..', '.env.sample'),
];

export function loadBackendEnv() {
  for (const filePath of envFiles) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath });
      break;
    }
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'secret';
  }
}