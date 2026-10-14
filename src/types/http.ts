/** Route params / bodies shared by the resource modules. */
export type NoParams = Record<string, never>;

// A type alias (not an interface) so it stays assignable to Express's ParamsDictionary.
export type IdParams = { id: string };

export interface MessageResponse {
  message: string;
}
