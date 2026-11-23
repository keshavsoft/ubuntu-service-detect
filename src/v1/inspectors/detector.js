import fs from "node:fs";
import path from "node:path";
import { parseServiceFile, detectPort } from "./parser.js";

export const DEFAULT_SYSTEMD_DIRS = [
    "/etc/systemd/system",
    "/run/systemd/system",
    "/lib/systemd/system",
    "/usr/lib/systemd/system"
];

export function normalizePath(p) {
    if (!p) return "";
    let resolved = path.resolve(p).replace(/\\/g, "/");
    if (resolved.endsWith("/")) {
        resolved = resolved.slice(0, -1);
    }
    return resolved;
}

export function inspectDirectoryMetadata(targetDir) {
    const meta = {
        name: null,
        version: null,
        isGitRepo: false
    };

    if (!targetDir || !fs.existsSync(targetDir)) {
        return meta;
    }

    const pkgPath = path.join(targetDir, "package.json");
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
            meta.name = pkg.name || null;
            meta.version = pkg.version || null;
        } catch {
            // Ignore parse errors
        }
    }

    const gitPath = path.join(targetDir, ".git");
    meta.isGitRepo = fs.existsSync(gitPath);

    return meta;
}

export function findServiceForDirectory(targetDir = process.cwd(), options = {}) {
    const normTarget = normalizePath(targetDir);
    const meta = inspectDirectoryMetadata(targetDir);

    const dirsToScan = options.systemdDir
        ? [path.resolve(options.systemdDir)]
        : DEFAULT_SYSTEMD_DIRS;

    const matchedUnits = [];

    for (const scanDir of dirsToScan) {
        if (!fs.existsSync(scanDir)) continue;

        let files = [];
        try {
            files = fs.readdirSync(scanDir).filter(f => f.endsWith(".service"));
        } catch {
            continue;
        }

        for (const file of files) {
            const filePath = path.join(scanDir, file);
            const parsed = parseServiceFile(filePath);
            if (!parsed) continue;

            const serviceSection = parsed.Service || {};
            const unitSection = parsed.Unit || {};
            const workingDir = serviceSection.WorkingDirectory;
            const execStart = serviceSection.ExecStart || "";

            let matchType = null;
            let score = 0;

            if (workingDir) {
                const normWorking = normalizePath(workingDir);
                if (normWorking === normTarget) {
                    matchType = "exact_working_directory";
                    score = 100;
                } else if (normTarget.startsWith(normWorking + "/") || normWorking.startsWith(normTarget + "/")) {
                    matchType = "subpath_working_directory";
                    score = 80;
                }
            }

            if (!matchType && execStart) {
                const rawExec = Array.isArray(execStart) ? execStart.join(" ") : String(execStart);
                const normExec = rawExec.replace(/\\/g, "/");
                if (normExec.includes(normTarget)) {
                    matchType = "exec_start_path";
                    score = 70;
                }
            }

            if (!matchType) {
                const baseName = path.basename(normTarget).toLowerCase();
                const unitBase = file.replace(/\.service$/, "").toLowerCase();

                if (meta.name && unitBase.includes(meta.name.toLowerCase())) {
                    matchType = "package_name_match";
                    score = 50;
                } else if (unitBase.includes(baseName) || baseName.includes(unitBase)) {
                    matchType = "directory_name_match";
                    score = 40;
                }
            }

            if (matchType) {
                const detectedPort = detectPort(parsed, targetDir);
                matchedUnits.push({
                    unitName: file,
                    unitPath: filePath,
                    workingDirectory: workingDir || null,
                    workingDirectoryExists: workingDir ? fs.existsSync(workingDir) : false,
                    execStart,
                    description: unitSection.Description || null,
                    user: serviceSection.User || null,
                    port: detectedPort,
                    matchType,
                    score,
                    raw: parsed
                });
            }
        }
    }

    if (matchedUnits.length === 0) {
        return {
            found: false,
            targetDir: normTarget,
            meta,
            message: `No systemd service found matching directory: ${normTarget}`
        };
    }

    matchedUnits.sort((a, b) => b.score - a.score);
    const bestMatch = matchedUnits[0];

    return {
        found: true,
        targetDir: normTarget,
        meta,
        ...bestMatch,
        alternatives: matchedUnits.slice(1).map(u => ({
            unitName: u.unitName,
            matchType: u.matchType,
            score: u.score
        }))
    };
}
