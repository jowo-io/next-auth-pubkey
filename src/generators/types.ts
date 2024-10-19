import { Config } from "../main/config";

export type QRGenerator = (
  data: string,
  config?: Config
) => Promise<{ data: string; type: "svg" | "png" | "jpg" }>;

export type AvatarGenerator = (
  seed: string,
  config?: Config
) => Promise<{ data: string; type: "svg" | "png" | "jpg" }>;

export type NameGenerator = (
  seed: string,
  config?: Config
) => Promise<{ name: string }>;
