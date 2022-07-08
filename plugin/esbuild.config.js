const esbuild = require('esbuild')

// Automatically exclude all node_modules from the bundled version
const { nodeExternalsPlugin } = require('esbuild-node-externals')

esbuild.build({
    entryPoints: [
        './src/functions/getTask/handler.ts',
        './src/functions/orchestrator/handler.ts',
        './src/functions/reporter/handler.ts',
        './src/functions/submitTask/handler.ts',
        './src/aws-durable-lambda.js'
    ],
    outdir: 'lib/',
    bundle: true,
    minify: false,
    platform: 'node',
    sourcemap: true,
    target: 'node14',
    plugins: [nodeExternalsPlugin()]
}).catch(() => process.exit(1))