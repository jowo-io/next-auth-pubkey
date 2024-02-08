import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

import { NameGenerator } from "./types";

/**
 * An async function that generates a username.
 *
 * @param {String} seed - the seed (the users pubkey)
 * @param {String} config - the `next-auth-pubkey-provider` config object
 *
 * @returns {Object}
 * @returns {String} name - a deterministically generated username
 */
const generateName: NameGenerator = async (seed, config) => {
  return {
    name: uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: "-",
      seed,
    }),
  };
};

export default generateName;
