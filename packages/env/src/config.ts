import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface GlobalEnvFile {
  exists: boolean;
  content?: string;
}

export function getGlobalEnvPath(homeDir = homedir()): string {
  return join(homeDir, ".pi", "agent", "pi-lab", ".env");
}

export function readGlobalEnvFile(filePath = getGlobalEnvPath()): GlobalEnvFile {
  try {
    return {
      exists: true,
      content: readFileSync(filePath, "utf8"),
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return { exists: false };
    }
    throw error;
  }
}
