import { v4 } from 'uuid';

/**
 * Creates a unique ID that can be used to refer to a task.
 *
 * @returns a string ID
 */
export const generateTaskId = (): string => {
  return v4();
};
