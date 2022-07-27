import { Handler } from 'aws-lambda';

/**
 * The type of message that the orchestrator consumes
 * from the task queue (published by the submitTask lambda).
 *
 * Does not need to be exposed outside of the aws-durable-lambda package.
 */
export type TaskMessageBody<PayloadType = unknown> = {
  /**
   * The name of the lambda function that executes the long running task
   * that the orchestrator should call.
   */
  functionName: string;
  /**
   * The unique ID of the aws-durable-lambda task associated with the long
   * running task. Used to retrieve the status and result of the task.
   */
  taskId: string;

  /**
   * The optional body passed into the submitTask function.
   * It will be passed into the long running lambda in the event object.
   */
  requestPayload: PayloadType | undefined;
};

/**
 * The event object that is passed into the lambda that the aws-durable-lambda
 * passes into the long running lambda handler.
 */
export type TaskEvent<PayloadType = unknown> = {
  /**
   * The unique ID of the aws-durable-lambda task that triggered the lambda.
   * Used to retrieve the status and result of the task.
   */
  readonly taskId: string;

  /**
   * The optional body passed into the submitTask function.
   */
  requestPayload: PayloadType | undefined;
};

/**
 * Defines the type signature of a lambda handler
 * that will be called by the aws-durable-lambda orchestrator.
 *
 * The result (specified by OutputType) will be stored against the task
 * when it completes and can be retrieved with getTask.
 *
 * @typeParam OutputType the type that the long running task returns
 */
export type TaskHandler<OutputType = unknown> = Handler<TaskEvent, OutputType>;
