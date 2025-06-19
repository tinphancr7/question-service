#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Configuration
const PROTO_DIR = path.resolve(__dirname, '../../proto');
const OUT_DIR = path.resolve(__dirname, '../src/protobuf');
const PROTOC_PATH = 'protoc'; // Assumes protoc is in PATH

// Cross-platform plugin path detection
function getPluginPath(): string {
  const isWindows = os.platform() === 'win32';
  const nodeModulesBin = path.join(__dirname, '..', 'node_modules', '.bin');

  if (isWindows) {
    return `"${path.join(nodeModulesBin, 'protoc-gen-ts_proto.cmd')}"`;
  } else {
    return `"${path.join(nodeModulesBin, 'protoc-gen-ts_proto')}"`;
  }
}

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Clean output directory while preserving .gitignore and .gitkeep files
function cleanOutputDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    // Skip .gitignore and .gitkeep files
    if (item === '.gitignore' || item === '.gitkeep') {
      return;
    }

    if (stat.isDirectory()) {
      // Recursively clean subdirectories
      cleanOutputDir(itemPath);
      // Remove empty directory (will fail if it contains .gitignore/.gitkeep, which is fine)
      try {
        fs.rmdirSync(itemPath);
      } catch (error) {
        // Directory not empty (contains .gitignore/.gitkeep), ignore
      }
    } else {
      // Remove file
      fs.unlinkSync(itemPath);
    }
  });
}

console.log('Cleaning output directory...');
cleanOutputDir(OUT_DIR);

// Find all proto files recursively
function findProtoFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findProtoFiles(filePath, fileList);
    } else if (path.extname(file) === '.proto') {
      fileList.push(path.relative(PROTO_DIR, filePath));
    }
  });

  return fileList;
}

const protoFiles = findProtoFiles(PROTO_DIR);

if (protoFiles.length === 0) {
  console.error('No proto files found in', PROTO_DIR);
  process.exit(1);
}

console.log(`Found ${protoFiles.length} proto files to process`);

// Compiled all proto files into a single command
const cmd = [
  `pnpm ${PROTOC_PATH}`,
  `--ts_proto_out=${OUT_DIR}`,
  `--ts_proto_opt=outputServices=grpc-js,env=node,useOptionals=messages,esModuleInterop=true`,
  `--ts_proto_opt=emitGrpcPackage=true`,
  `--plugin=protoc-gen-ts_proto=${getPluginPath()}`,
  `--proto_path=${PROTO_DIR}`,
  ...protoFiles.map((file) => path.join(PROTO_DIR, file)),
].join(' ');

// Prepare folders
protoFiles.forEach((protoFile) => {
  const outputDir = path.join(OUT_DIR, path.dirname(protoFile));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
});

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log(`Successfully generated TypeScript protobuf files`);
} catch (error) {
  console.error(error);
  process.exit(1);
}

console.log('All proto files processed successfully!');
