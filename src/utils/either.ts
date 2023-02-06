/**
 * Scala-style pattern matching.
 */

/**
 * One of the two possible values for an {@link Either}. Traditionally used for
 * the error case.
 */
export class Left<T> {
  readonly tag = "left";
  constructor(readonly value: T) {}
}

/**
 * One of the two possible values for an {@link Either}. Traditionally used for
 * the success case.
 */
export class Right<T> {
  readonly tag = "right";
  constructor(readonly value: T) {}
}

/**
 * Shorthand for `new Left(value)`.
 * @see {@link Left}
 */
export function left<T>(value: T): Left<T> {
  return new Left(value);
}

/**
 * Shorthand for `new Right(value)`.
 * @see {@link Right}
 */
export function right<T>(value: T): Right<T> {
  return new Right(value);
}

export type Either<L, R> = Left<L> | Right<R>;

export function isRight<L, R>(input: Either<L, R>): input is Right<R> {
  return input.tag === "right";
}

export function isLeft<L, R>(input: Either<L, R>): input is Left<L> {
  return input.tag === "left";
}

export function match<T, L, R>(
  input: Either<L, R>,
  leftAction: (left: L) => T,
  rightAction: (right: R) => T
) {
  if (isLeft(input)) {
    return leftAction(input.value);
  }
  return rightAction(input.value);
}
