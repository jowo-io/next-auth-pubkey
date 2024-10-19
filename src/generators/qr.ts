import QRCode from "qrcode";

import { QRGenerator } from "./types";
import { colorSchemeDark } from "../main/config/default";

/**
 * An async function that generates a QR code.
 *
 * @param {String} data - data to be made into a QR code
 * @param {String} config - the `next-auth-pubkey` config object
 *
 * @returns {Object}
 * @returns {String} data - a base64 encoded png/jpg OR svg XML markup
 * @returns {String} type - image type: "svg" | "png" | "jpg"
 */
const generateQr: QRGenerator = async (data, config) => {
  const theme = config?.theme || colorSchemeDark;
  const options = {
    color: {
      dark: theme.qrForeground,
      light: theme.qrBackground,
    },
    margin: theme.qrMargin,
  };

  return {
    data: (await QRCode.toString(data, {
      ...options,
      type: "svg",
    })) as unknown as string,
    type: "svg",
  };
};

export default generateQr;
