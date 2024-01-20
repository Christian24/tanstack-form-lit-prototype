import { esbuildPlugin } from "@web/dev-server-esbuild";

export default {
  files: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
  plugins: [esbuildPlugin({ ts: true })],
};
