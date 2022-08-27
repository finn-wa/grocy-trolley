import { AppTokens } from "@gt/app/di";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { useFunc } from "ajv/dist/compile/util";
import prompts from "prompts";
import { inject, singleton } from "tsyringe";

interface SelectHitAction<T> {
  readonly action: "select";
  readonly hit: T;
}

interface ExitSearchAction {
  readonly action: "exit";
}

interface NewQueryAction {
  readonly action: "newQuery";
}

interface SearchAgainAction {
  readonly action: "searchAgain";
  readonly query: string;
}

type SearchAndSelectAction<T> = SelectHitAction<T> | SearchAgainAction | ExitSearchAction;

@singleton()
export class SearchUtils {
  constructor(@inject(AppTokens.promptProvider) private readonly prompt: PromptProvider) {}

  /**
   * Interactive prompt-based search and select. Allows the user to modify the search
   * query and search again unlimited times.
   * @param search that takes a query and returns results
   * @param stringifyResult to convert a result to a string, used to display results
   * @param initialQuery Optional initial search query
   * @returns the selected result, or null if the user exited the search
   */
  async searchAndSelectResult<T>(
    search: (q: string) => Promise<T[]>,
    stringifyResult: (searchResult: T) => string,
    initialQuery?: string
  ): Promise<T | null> {
    if (!initialQuery) {
      const query = await this.prompt.text("Enter a search query");
      if (!query) return null;
      initialQuery = query;
    }
    for (let nextQuery = initialQuery; nextQuery && nextQuery.length > 0; ) {
      const results = await search(nextQuery);
      const actionResponse = await this.promptForNextAction(initialQuery, results, stringifyResult);
      switch (actionResponse.action) {
        case "select":
          return actionResponse.hit;
        case "searchAgain": {
          nextQuery = actionResponse.query;
          continue;
        }
        case "exit":
        default:
          return null;
      }
    }
    return null;
  }

  private async promptForNextAction<T>(
    query: string,
    results: T[],
    stringifyResult: (result: T) => string
  ): Promise<SearchAndSelectAction<T>> {
    if (results.length === 1) {
      return { action: "select", hit: results[0] };
    }
    if (results.length === 0) {
      console.log("No results found.");
    }

    const nextAction = await this.prompt.select<
      SelectHitAction<T> | NewQueryAction | ExitSearchAction
    >("Select a search result", [
      ...results.map((hit) => ({
        title: stringifyResult(hit),
        value: { action: "select", hit } as const,
      })),
      { title: "Modify search query", value: { action: "newQuery" } },
      { title: "Exit search", value: { action: "exit" } },
    ]);
    if (!nextAction) {
      return { action: "exit" };
    }
    if (nextAction.action === "newQuery") {
      const newQuery = await this.prompt
        .text("Enter a search query", query)
        .then((input) => (input ? input.trim() : null));
      if (!newQuery) {
        return { action: "exit" };
      }
      return { action: "searchAgain", query: newQuery };
    }
    return nextAction;
  }
}
