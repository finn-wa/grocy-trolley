export interface PromptProvider {
  select<T>(
    message: string,
    choices: SelectChoice<T>[],
    options?: { includeExitOption?: boolean }
  ): Promise<T | null>;
  multiselect<T>(message: string, choices: SelectChoice<T>[]): Promise<T[] | null>;
  confirm(message: string): Promise<boolean | null>;
  text(message: string, placeholder?: string): Promise<string | null>;
  say(message: string): Promise<void>;
}

export interface SelectChoice<T> {
  title: string;
  value: T;
  description?: string;
}
