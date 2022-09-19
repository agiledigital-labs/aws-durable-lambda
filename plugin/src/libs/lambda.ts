import { InvokeCommandOutput, LambdaClient } from '@aws-sdk/client-lambda';

import { InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});

const invokeLambdaFunction = async (
  functionName: string,
  payload: unknown
): Promise<InvokeCommandOutput> => {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: Buffer.from(JSON.stringify(payload)),
  });
  return await lambda.send(command);
};

export { lambda, invokeLambdaFunction };
