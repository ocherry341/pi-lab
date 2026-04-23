import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import { loadGlobalEnv } from "./load";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    loadGlobalEnv(process.env);
  });
}
