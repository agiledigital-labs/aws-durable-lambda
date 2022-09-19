import { join } from 'path';

/**
 * Generates serverless compatible layer definitions for the
 * boilerplate functions provided by AWS Durable Lambda.
 *
 * Note: This should be added into the serverless context, as if
 * they were added by a user in serverless.yml.
 * They are _not_ CloudFormation definitions.
 *
 * @param layerName the name the base layer
 * @param functionStagingDirectoryName the directory where the boilerplate functions are stored
 * @returns serverless compatible function definitions
 */
const layers = (layerName: string, functionStagingDirectoryName: string) => {
  const artifactPath = join(functionStagingDirectoryName, 'adl-artifact.zip');
  return {
    [layerName]: {
      // serverless-jetpack looks for the artifact property at this level
      // probably because it changed at some point (e.g. serverless 3.x) and it
      // isn't up to date.
      // We need to set it here so it doesn't try to package the layer itself and
      // overwrite it with a broken version.
      // Future work: remove this when serverless-jetpack is updated (tracked in issue #122)
      artifact: artifactPath,
      package: {
        // Note: This is the correct place to put the artifact property
        artifact: artifactPath,
      },
    },
  };
};

export default layers;
