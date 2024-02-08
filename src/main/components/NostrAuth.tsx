import { CSSProperties } from "preact/compat";

import { Title } from "./Title";

import { hardConfig } from "../config/hard";
import { Error } from "./Error";
import { Details } from "./Details";
import { NostrButton } from "./NostrButton";

export function NostrAuth({
  title,
  theme,
}: {
  title: string;
  theme?: {
    loading?: CSSProperties;
    wrapper?: CSSProperties;
    title?: CSSProperties;
    error?: CSSProperties;
    details?: CSSProperties;
    button?: CSSProperties;
  };
}) {
  return (
    <div id={hardConfig.ids.wrapper} style={theme?.wrapper}>
      <Title style={theme?.title}>{title}</Title>

      <Error style={theme?.error}></Error>

      <Details style={theme?.details}></Details>

      <NostrButton style={theme?.button} />
    </div>
  );
}
