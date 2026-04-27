import { exec } from 'child_process';
import path from 'path';
import fs from 'node:fs';
import { promisify } from 'node:util';

import { APIS, API_BASE_URL } from './config/index';
import { generateContractClassesForDirectory } from './utils/generate-contract-classes';

const PATH_TO_OUTPUT_DIR = path.resolve(process.cwd(), './src/data-contracts');
const PATH_TO_TEMP_DIR = path.join(PATH_TO_OUTPUT_DIR, '.tmp');
const execAsync = promisify(exec);

const logCommandOutput = (stdout: string, stderr: string) => {
  if (stderr) {
    console.log(`stderr: ${stderr}`);
  }

  if (stdout) {
    console.log(`Data-contract-generator: ${stdout}`);
  }
};

const runCommand = async (command: string) => {
  try {
    const { stdout, stderr } = await execAsync(command);
    logCommandOutput(stdout, stderr);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`error: ${error.message}`);
    }
    throw error;
  }
};

const main = async () => {
  console.log('Downloading and generating api-docs..');
  fs.mkdirSync(PATH_TO_TEMP_DIR, { recursive: true });

  for (const api of APIS) {
    if (!fs.existsSync(`${PATH_TO_OUTPUT_DIR}/${api.name}`)) {
      fs.mkdirSync(`${PATH_TO_OUTPUT_DIR}/${api.name}`, { recursive: true });
    }

    const outputPath = path.join(PATH_TO_OUTPUT_DIR, api.name);
    const tempSwaggerPath = path.join(PATH_TO_TEMP_DIR, `${api.name}.swagger.json`);

    await runCommand(`curl -o "${tempSwaggerPath}" "${API_BASE_URL}/${api.name}/${api.version}/api-docs"`);
    console.log(`- ${api.name} ${api.version}`);

    await runCommand(
      `npx swagger-typescript-api generate --modular -p "${tempSwaggerPath}" -o "${outputPath}" --no-client --clean-output --extract-enums`,
    );

    const generatedClassFiles = generateContractClassesForDirectory(outputPath);
    if (generatedClassFiles.length > 0) {
      console.log(`Generated contract classes: ${generatedClassFiles.length}`);
    }

    fs.rmSync(tempSwaggerPath, { force: true });
  }

  fs.rmSync(PATH_TO_TEMP_DIR, { recursive: true, force: true });
};

main();
