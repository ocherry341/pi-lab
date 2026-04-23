import { homedir } from "node:os";
import { join } from "node:path";

export function getBinaryTempDir(home = homedir()): string {
	return join(home, ".pi", "agent", "pi-lab", "tmp", "webfetch");
}
