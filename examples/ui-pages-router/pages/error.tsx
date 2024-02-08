import { useRouter } from "next/router";

import { ErrorCodes } from "next-auth-pubkey";

function formatErrorCode(
  value: string | string[] | undefined
): keyof typeof ErrorCodes {
  if (Array.isArray(value)) value = value[0];
  if (value && ErrorCodes.hasOwnProperty(value)) {
    return value as keyof typeof ErrorCodes;
  }
  return "Default";
}

export default function Error() {
  const { isReady, query } = useRouter();

  const errorCode = formatErrorCode(query.error);

  // access an error message from the query parameters
  const queryMessage = query.message || ErrorCodes.Default;

  // access an error message from the `ErrorCodes` enum
  const hardCodedMessage = ErrorCodes[errorCode];

  if (!isReady) {
    return (
      <div style={{ textAlign: "center", color: "black" }}>loading...</div>
    );
  }

  return (
    <div style={{ textAlign: "center", color: "red" }}>
      <b>Query param message:</b>
      <br />
      {queryMessage}
      <br />
      <b>Hard coded message:</b>
      <br />
      {hardCodedMessage}
    </div>
  );
}
