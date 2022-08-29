// Thanks Datadog! https://github.com/DataDog/serverless-plugin-datadog/blob/9c9e8fc78b51f752df4e1958b938c82e561a20a3/src/env.ts
// I cherry picked a lot of this code in this file from their plugin and modified it to fit this plugin
// serverless-plugin-datadog is a high quality serverless plugin and a good reference if you're writing a plugin

/**
 * The name of the serverless-webpack plugin as specified in package.json
 */
const webpackPluginName = 'serverless-webpack';
/**
 * The name of the serverless-jetpack plugin as specified in package.json
 */
const jetpackPluginName = 'serverless-jetpack';
/**
 * The name of the serverless-esbuild plugin as specified in package.json
 */
const esbuildPluginName = 'serverless-esbuild';

/**
 * Given the service object from the serverless instance, will detect
 * if specified plugin is in use.
 * @param service the 'service' child object under the root serverless instance
 * @param pluginName the name of the plugin to look for
 * @returns true if serverless-webpack is in use, otherwise false
 */
const hasPlugin = (service: unknown, pluginName: string) => {
  const plugins: string[] | undefined = (service as any).plugins;
  if (plugins === undefined) {
    return false;
  }
  if (Array.isArray(plugins)) {
    // We have a normal plugin array
    return plugins.find((plugin) => plugin === pluginName) !== undefined;
  }
  // We have an enhanced plugins object
  const modules: string[] | undefined = (service as any).plugins.modules;
  if (modules === undefined) {
    return false;
  }
  return modules.find((plugin) => plugin === pluginName) !== undefined;
};

/**
 * Given the service object from the serverless instance, will detect
 * if serverless-webpack is in use.
 * @param service the 'service' child object under the root serverless instance
 * @returns true if serverless-webpack is in use, otherwise false
 */
export const hasWebpackPlugin = (service: unknown) => {
  return hasPlugin(service, webpackPluginName);
};

/**
 * Given the service object from the serverless instance, will detect
 * if serverless-jetpack is in use.
 * @param service the 'service' child object under the root serverless instance
 * @returns true if serverless-jetpack is in use, otherwise false
 */
export const hasJetpackPlugin = (service: unknown) => {
  return hasPlugin(service, jetpackPluginName);
};

/**
 * Given the service object from the serverless instance, will detect
 * if serverless-esbuild is in use.
 * @param service the 'service' child object under the root serverless instance
 * @returns true if serverless-esbuild is in use, otherwise false
 */
export const hasEsbuildPlugin = (service: unknown) => {
  return hasPlugin(service, esbuildPluginName);
};

/**
 * The serverless-webpack bundler has a list of modules that you can exclude
 * from the bundling process. We want to exclude our plugin explicitly because
 * we handle the bundling of the plugin shared libraries ourself by putting it
 * into a layer. If webpack tries to bundle it, in the best case it is really slow
 * and explodes the bundle size, and in the worst case it can cause all sorts of errors.
 * @param service the 'service' child object under the root serverless instance
 * @param pluginName the full name of the plugin as specified in package.json
 */
export const forceExcludeDepsFromWebpack = (
  service: unknown,
  pluginName: string
): void => {
  const includeModules = (service as any)?.custom?.webpack?.includeModules;
  if (includeModules === undefined) {
    return;
  }
  let forceExclude = includeModules.forceExclude as string[] | undefined;
  if (forceExclude === undefined) {
    forceExclude = [];
    includeModules.forceExclude = forceExclude;
  }
  if (!forceExclude.includes(pluginName)) {
    forceExclude.push(pluginName);
  }
};

/**
 * The serverless-esbuild bundler will follow the chain of dependencies and try
 * and package them into a single bundle.
 * However, our shared library files are in a layer, so we can exclude them and
 * import them at runtime. This adds the exclude config entry to allow this.
 * @param service the 'service' child object under the root serverless instance
 * @param pluginName the full name of the plugin as specified in package.json
 */
export const forceExcludeDepsFromEsbuild = (
  service: unknown,
  pluginName: string
): void => {
  const existingCustomConfig = (service as any)?.custom ?? {};
  const existingEsbuildConfig = existingCustomConfig?.esbuild ?? {};
  const existingExclude = existingEsbuildConfig?.exclude ?? [];
  if (!existingExclude.includes(pluginName)) {
    (service as any).custom = {
      ...existingCustomConfig,
      esbuild: {
        ...existingEsbuildConfig,
        exclude: [...existingExclude, pluginName],
      },
    };
  }
};

export const forceExcludeStagingDirectoryFromServerless = (
  service: unknown,
  stagingDirectory: string
): void => {
  const existingPatterns = (service as any)?.package?.patterns ?? [];
  const existingPackageConfig = (service as any).package ?? {};
  (service as any).package = {
    ...existingPackageConfig,
    patterns: [
      ...existingPatterns,
      `!${stagingDirectory}/**`,
      `${stagingDirectory}/functions/**`,
    ],
  };
};

export const forceExcludeStagingDirectoryFromJetpack = (
  service: unknown,
  stagingDirectory: string
): void => {
  const existingInclude = (service as any)?.package?.include ?? [];
  const existingExclude = (service as any)?.package?.exclude ?? [];
  const existingPackageConfig = (service as any).package ?? {};
  (service as any).package = {
    ...existingPackageConfig,
    include: [...existingInclude, `${stagingDirectory}/functions/**`],
    exclude: [...existingExclude, `${stagingDirectory}/**`],
  };
};
