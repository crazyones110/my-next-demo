import * as fsPromises from "node:fs/promises";

export function fileExists(path: string) {
    return fsPromises.access(path).then(() => true).catch(() => false);
}