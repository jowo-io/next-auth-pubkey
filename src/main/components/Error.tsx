import { HTMLAttributes } from "preact/compat";

import { hardConfig } from "../config/hard";

export function Error({ ...props }: {} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      id={hardConfig.ids.error}
      style={{ textAlign: "center", color: "red" }}
      {...props}
    ></div>
  );
}
