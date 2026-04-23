import assert from "node:assert/strict";
import test from "node:test";

import { getBinaryTempDir } from "./paths";

test("getBinaryTempDir resolves ~/.pi/agent/pi-lab/tmp/webfetch", () => {
	assert.equal(
		getBinaryTempDir("/tmp/home"),
		"/tmp/home/.pi/agent/pi-lab/tmp/webfetch",
	);
});
