import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { findServiceForDirectory, normalizePath } from "../src/index.js";

describe("ubuntu-service-detect", () => {
    let tmpDir;
    let systemdDir;
    let projectA;
    let projectB;

    before(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "usd-test-"));
        systemdDir = path.join(tmpDir, "systemd");
        projectA = path.join(tmpDir, "projects", "appointment-notifier");
        projectB = path.join(tmpDir, "projects", "quotation");

        fs.mkdirSync(systemdDir, { recursive: true });
        fs.mkdirSync(projectA, { recursive: true });
        fs.mkdirSync(projectB, { recursive: true });

        fs.writeFileSync(path.join(projectA, "package.json"), JSON.stringify({
            name: "appointment-notifier-v1"
        }));

        fs.writeFileSync(path.join(systemdDir, "appointment.keshavsoft.com.service"), `
[Unit]
Description=Appointment Notifier Node Service

[Service]
WorkingDirectory=${projectA.replace(/\\/g, "/")}
ExecStart=/usr/bin/node ${projectA.replace(/\\/g, "/")}/app.js
Environment="PORT=3000"
Restart=always
        `.trim());

        fs.writeFileSync(path.join(systemdDir, "quotation.service"), `
[Unit]
Description=Quotation Service

[Service]
ExecStart=/bin/sh -c "echo starting"
ExecStart=/usr/bin/node ${projectB.replace(/\\/g, "/")}/server.js --port 3025
Restart=always
        `.trim());
    });

    after(() => {
        if (tmpDir && fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test("matches service by exact WorkingDirectory", () => {
        const result = findServiceForDirectory(projectA, { systemdDir });
        assert.equal(result.found, true);
        assert.equal(result.unitName, "appointment.keshavsoft.com.service");
        assert.equal(result.port, 3000);
    });

    test("handles multiple ExecStart entries gracefully", () => {
        const result = findServiceForDirectory(projectB, { systemdDir });
        assert.equal(result.found, true);
        assert.equal(result.unitName, "quotation.service");
        assert.equal(result.port, 3025);
    });
});
