#!/usr/bin/env node
import { execSync } from 'child_process';
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const isProd = args.includes('--prod') || args.includes('production');
const isWatch = args.includes('--watch');

console.log(
  `🚀 Building with esbuild (${isProd ? 'production' : 'development'} mode)...`,
);

// Read package.json for dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// External dependencies
const external = [
  ...Object.keys(packageJson.dependencies || {}),
  'fs',
  'path',
  'os',
  'crypto',
  'stream',
  'util',
  'events',
  'buffer',
  'url',
  'querystring',
  'child_process',
  'net',
  'tls',
  'http',
  'https',
  'zlib',
];

const buildConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outdir: 'dist',
  external,
  sourcemap: true,
  minify: isProd,
  keepNames: !isProd,
  define: {
    'process.env.NODE_ENV': isProd ? '"production"' : '"development"',
  },
};

if (isWatch) {
  buildConfig.watch = {
    onRebuild(error, result) {
      if (error) {
        console.error('❌ Build failed:', error);
      } else {
        console.log('✅ Rebuild successful!');
      }
    },
  };
}

try {
  console.log('📦 Starting esbuild...');

  const result = await esbuild.build(buildConfig);

  console.log('✅ Build completed successfully!');

  // Copy proto files
  console.log('📁 Copying proto files...');
  try {
    const protoSourcePath = '../proto';
    if (fs.existsSync(protoSourcePath)) {
      if (!fs.existsSync('dist/proto')) {
        fs.mkdirSync('dist/proto', { recursive: true });
      }

      if (process.platform === 'win32') {
        execSync('xcopy ..\\proto dist\\proto /E /I /Y /Q', {
          stdio: 'inherit',
        });
      } else {
        execSync('cp -r ../proto/* dist/proto/', { stdio: 'inherit' });
      }
      console.log('✅ Proto files copied successfully!');
    } else {
      console.log('ℹ️  No proto directory found, skipping proto file copy.');
    }
  } catch (copyError) {
    console.warn('⚠️  Could not copy proto files:', copyError.message);
  }

  if (isWatch) {
    console.log('👀 Watching for changes... Press Ctrl+C to stop.');
  } else {
    console.log('🎉 Build process completed!');
  }
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
