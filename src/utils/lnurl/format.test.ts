import { describe, expect, test } from "@jest/globals";

import { formatLightningAuth } from "./format";
import { hardConfig } from "../../main/config/hard";

const lnurl = "LNURL1234567890QWERTYUIOP";

describe("formatLightningAuth", () => {
  test("formats string correctly", () => {
    const output = formatLightningAuth(lnurl);
    const expected = {
      lnurl,
      button: `lightning:${lnurl}`,
      qr: `${hardConfig.apis.qr}/${lnurl}`,
    };
    expect(output).toEqual(expected);
  });

  test("formats null correctly", () => {
    const output = formatLightningAuth(null);
    const expected = { lnurl: "", qr: "", button: "" };
    expect(output).toEqual(expected);
  });
});
