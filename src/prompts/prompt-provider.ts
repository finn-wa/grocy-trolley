export interface PromptProvider {
  select<T>(message: string, choices: SelectChoice<T>[]): Promise<T | null>;
  multiSelect<T>(message: string, choices: SelectChoice<T>[]): Promise<T[] | null>;
  confirm(message: string): Promise<boolean | null>;
  text(message: string): Promise<string | null>;
}

export interface SelectChoice<T> {
  title: string;
  value: T;
  description?: string;
}
