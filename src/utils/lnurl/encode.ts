// @ts-nocheck

const assert = require("assert");
const { bech32 } = require("bech32");

const rules = {
  prefix: "lnurl",
  limit: 1023,
};

export default function encode(unencoded) {
  assert.strictEqual(
    typeof unencoded,
    "string",
    'Invalid argument ("unencoded"): String expected'
  );
  let words = bech32.toWords(Buffer.from(unencoded, "utf8"));
  return bech32.encode(rules.prefix, words, rules.limit);
}
