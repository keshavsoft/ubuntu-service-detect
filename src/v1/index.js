export { parseServiceFile, detectPort } from "./inspectors/parser.js";
export {
    findServiceForDirectory,
    normalizePath,
    inspectDirectoryMetadata,
    DEFAULT_SYSTEMD_DIRS
} from "./inspectors/detector.js";

import { findServiceForDirectory } from "./inspectors/detector.js";
export default findServiceForDirectory;
