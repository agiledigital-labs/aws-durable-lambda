const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: [
      './src/functions/getTask/handler.ts',
      './src/functions/orchestrator/handler.ts',
      './src/functions/reporter/handler.ts',
      './src/functions/submitTask/handler.ts',
      './src/aws-durable-lambda.js',
    ],
    outdir: 'lib/',
    bundle: true,
    minify: true,
    platform: 'node',
    sourcemap: true,
    target: 'node14',
    external: ['aws-sdk'],
  })
  .catch(() => process.exit(1));
