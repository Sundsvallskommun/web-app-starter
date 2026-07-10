import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import { config } from 'dotenv';

const execFileAsync = promisify(execFile);

config();

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

const main = async () => {
  const backendDir = path.join(PATH_TO_OUTPUT_DIR, 'backend');
  const swaggerPath = path.join(backendDir, 'swagger.json');

  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }

  console.warn('Downloading and generating api-docs for backend');

  // execFile runs each binary directly (no shell), so the API URL and path segments
  // interpolated into the arguments below are passed literally and can never be
  // interpreted as shell commands.
  try {
    await execFileAsync('curl', ['-o', swaggerPath, `${process.env.NEXT_PUBLIC_API_URL}/swagger.json`]);

    const { stdout, stderr } = await execFileAsync('npx', [
      'swagger-typescript-api',
      '--modular',
      '-p',
      swaggerPath,
      '-o',
      backendDir,
      '--no-client',
      '--clean-output',
      '--extract-enums',
    ]);
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.warn(`Data-contract-generator: ${stdout}`);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

main();
