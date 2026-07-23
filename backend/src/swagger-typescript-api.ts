import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import { APIS, API_BASE_URL } from './config/index';

const execFileAsync = promisify(execFile);

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');

const main = async () => {
  console.warn('Downloading and generating api-docs..');

  // execFile runs each binary directly (no shell), so the API base URL and path segments
  // interpolated into the arguments below are passed literally and can never be interpreted
  // as shell commands.
  for (const api of APIS) {
    const apiDir = path.join(PATH_TO_OUTPUT_DIR, api.name);
    const swaggerPath = path.join(apiDir, 'swagger.json');

    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    try {
      await execFileAsync('curl', ['-o', swaggerPath, `${API_BASE_URL}/${api.name}/${api.version}/api-docs`]);
      console.warn(`- ${api.name} ${api.version}`);

      const { stdout, stderr } = await execFileAsync('npx', [
        'swagger-typescript-api',
        '--modular',
        '-p',
        swaggerPath,
        '-o',
        apiDir,
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
  }
};

main();
