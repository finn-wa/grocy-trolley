export interface PromptProvider {
  select<T>(message: string, choices: SelectChoice<T>[]): Promise<T | null>;
}

export interface SelectChoice<T> {
  title: string;
  value: T;
  description?: string;
}
