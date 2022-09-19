const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['./src/libs/index.ts'],
    outdir: 'lib/@libs',
    bundle: true,
    minify: false,
    platform: 'node',
    sourcemap: true,
    target: 'node14',
    external: ['aws-sdk'],
  })
  .catch(() => process.exit(1));
