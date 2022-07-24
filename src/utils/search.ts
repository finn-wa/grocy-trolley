import prompts from "prompts";

interface SelectHitAction<T> {
  readonly action: "select";
  readonly hit: T;
}
interface SearchAgainAction {
  readonly action: "searchAgain";
  readonly query: string;
}

interface ExitSearchAction {
  readonly action: "exit";
}

type SearchAndSelectAction<T> = SelectHitAction<T> | SearchAgainAction | ExitSearchAction;

async function promptForNextAction<T>(
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
  const nextActionResponse = await prompts([
    {
      message: "Select a search result",
      name: "nextAction",
      type: "select",
      choices: [
        ...results.map((hit) => ({
          title: stringifyResult(hit),
          value: { action: "select", hit },
        })),
        { title: "Modify search query", value: { action: "searchAgain" } },
        { title: "Exit search", value: { action: "exit" } },
      ],
    },
    {
      type: (prev: { action: string }) => (prev.action === "searchAgain" ? "text" : null),
      message: "Enter a new search query, or leave blank to exit search",
      name: "query",
      initial: query,
    },
  ]);
  const nextAction = nextActionResponse.nextAction as
    | SelectHitAction<T>
    | Omit<SearchAgainAction, "query">
    | ExitSearchAction;
  if (nextAction.action === "searchAgain") {
    return { action: "searchAgain", query: ((nextActionResponse.query ?? "") as string).trim() };
  }
  return nextAction;
}

/**
 * Interactive prompt-based search and select. Allows the user to modify the search
 * query and search again unlimited times.
 * @param search function that takes a query and returns results
 * @param stringifyResult function to convert a result to a string, used to display results
 * @param initialQuery Optional initial search query
 * @returns the selected result, or null if the user exited the search
 */
export async function searchAndSelectResult<T>(
  search: (q: string) => Promise<T[]>,
  stringifyResult: (searchResult: T) => string,
  initialQuery?: string
): Promise<T | null> {
  if (!initialQuery) {
    const queryResponse = await prompts({
      type: "text",
      name: "query",
      message: "Enter a search query",
    });
    initialQuery = queryResponse.query as string;
  }
  for (let nextQuery = initialQuery; nextQuery && nextQuery.length > 0; ) {
    const results = await search(nextQuery);
    const actionResponse = await promptForNextAction(initialQuery, results, stringifyResult);
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
