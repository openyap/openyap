export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [value: string]: JSONValue }
  | Array<JSONValue>;
