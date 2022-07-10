import { PromptType } from "prompts";

/** If previous answer was @param value, show this question of specified promptType  */
export function ifPrevEquals<T>(
  value: T,
  promptType: PromptType = "select"
): (prev: T) => PromptType | null {
  return (prev: T) => (prev === value ? promptType : null);
}

/** If previous answer was not @param value, show this question of specified promptType  */
export function ifPrevWasNot<T>(
  value: T,
  promptType: PromptType = "select"
): (prev: T) => PromptType | null {
  return (prev: T) => (prev === value ? null : promptType);
}
