# TODO

Below is a TODO list for further development of `next-auth-pubkey`.

### Bugs

- consider removing the create interval - is it needed?

### Tasks

- when an expired or invalid cookie is found, the handler will redirect back to signin page with error. further processing should take place on the cookie and remove it if appropriate and then continue to fresh login
- add tests for `getHandler` method
- update diagram to include nostr
- add missing tests
- manual testing
  - test node, next, next-auth versions for compatibility (including deployed)
  - test all user configuration options
- tidy up READMEs
  - add BTC address to contributors section of readme
  - add suggestion: cleaning up old and unused pubkey data that was created but never reached success state.

### Release

- Once `next-auth@v5` is out of beta, ensure it's supported.

##### Checklist

- bump version
  - bump version example lock files
- run `npm i` to update lock file
- commit with git
- build with npm
- publish with npm
- create tag with git
  ```example
  git tag v1.0.1
  git push origin tag v1.0.1
  ```
- release on github: https://github.com/jowo-io/next-auth-pubkey/releases/new

### Back-burner

Stuff I may or may not get around to:

- add `auto` color scheme that user browser's preferred dark/light settings
- consider adding various styles of avatar and name generators
- consider / investigate how to SSR react components so the `vanilla.ts` shim can be deprecated
- add JSDocs comments to all internally used functions
- add comments to code
- 404 page?
- make jest typescript settings the same as project
- add extra tests for difficult code like signin / diagnostics pages, hooks, vanilla js etc.
- look into dicebear console warnings in `ui-pages-router` example when running when running locally (they don't appear when when installed via npm, so low priority)
- implement CSRF for poll and create endpoints (the rest are either GET requests or made under the `next-auth` hood, e.g. `token` request)
- add yellow notes to diagram in README
- tidy up usage of type casting
