export interface YargsConfigModuleSettings {
  /**
   * When multiple values for the same key are supplied yargs converts them into an array.
   * When true replace arrays with the rightmost value. This matters when `npm run` has options
   *  built into it, and the user wants to override them with `npm run -- --port 3005` or something.
   * "npm run -- --option foo --option bar" will return `{ option: bar }` instead of `{ option: ["foo", "bar"] }`.
   * @defaultValue true
   */
  returnLastValue: boolean;
}
