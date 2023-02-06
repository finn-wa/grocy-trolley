import { BehaviorSubject, distinctUntilChanged, firstValueFrom, map, Observable } from "rxjs";
import { isDeepStrictEqual } from "util";
import { T } from "vitest/dist/global-732f9b14";
import { pluck } from "./rxjs-pluck";

// type StoreValue = string | number | boolean | Record<string, unknown>;
// rxjs

export class Store<T extends Record<string, unknown>> {
  private _state: T;
  private _state$: BehaviorSubject<T>;
	// private _history: 

  constructor(initialState: T) {
    this._state = initialState;
    this._state$ = new BehaviorSubject(this._state);
  }

  get state$(): Observable<T> {
    return this._state$.asObservable();
  }

  get state(): Promise<T> {
    return firstValueFrom(this.state$);
  }

  select$<U>(selector: (state: T) => U): Observable<U> {
    return this.state$.pipe(
      map((state) => selector(state)),
      distinctUntilChanged((prev, current) => isDeepStrictEqual(prev, current))
    );
  }

  select<U>(selector: (state: T) => U): Promise<U> {
    return firstValueFrom(this.select$(selector));
  }

  selectId$<K extends keyof T>(id: K): Observable<T[K]> {
    return this.state$.pipe(map((state) => state[id]));
  }

  selectId<K extends keyof T>(id: K): Promise<T[K]> {
    return firstValueFrom(this.selectId$(id));
  }

  setState(state: T): void {
    this._state = state;
    this._state$.next(state);
  }

  setIdState<K extends keyof T>(id: K, idState: T[K]): void {
    this.updateState((state) => ({ ...state, [id]: idState }));
  }

  updateState(updater: (state: T) => T) {
    this.setState(updater(this._state));
  }

  updateIdState<K extends keyof T>(id: K, updater: (idState: T[K]) => T[K]) {
    this.setIdState(id, updater(this._state[id]));
  }
}
