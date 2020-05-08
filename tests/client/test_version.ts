import "mocha";
import { expect } from "chai";

import { VersionVector } from "../../client/ts/version";

describe("version", () => {
    describe("updateRemoteVersion", () => {
        it("handles single version update", () => {
            const vector = new VersionVector("A");
            const version = { uuid: "B", counter: 1, pending: [] };

            vector.updateRemoteVersion(version);
            const updatedVersion = vector.remoteVersions.get("B");
            expect(updatedVersion).to.deep.equal({
                uuid: "B",
                counter: 1,
                pending: []
            });
        });
        it("handles multiple version updates", () => {
            const vector = new VersionVector("A");
            const version1 = { uuid: "B", counter: 1, pending: [] };
            const version2 = { uuid: "B", counter: 2, pending: [] };
            const version3 = { uuid: "B", counter: 3, pending: [] };
            const version4 = { uuid: "B", counter: 4, pending: [] };

            vector.updateRemoteVersion(version1);
            vector.updateRemoteVersion(version2);
            vector.updateRemoteVersion(version3);
            vector.updateRemoteVersion(version4);
            const updatedVersion = vector.remoteVersions.get("B");
            expect(updatedVersion).to.deep.equal({
                uuid: "B",
                counter: 4,
                pending: []
            });
        });
        it("handles single version update out of order", () => {
            const vector = new VersionVector("A");
            const version = { uuid: "B", counter: 4, pending: [] };

            vector.updateRemoteVersion(version);
            const updatedVersion = vector.remoteVersions.get("B");
            expect(updatedVersion).to.deep.equal({
                uuid: "B",
                counter: 4,
                pending: [1, 2, 3]
            });
        });
        it("handles multiple version updates out of order", () => {
            const vector = new VersionVector("A");
            const version1 = { uuid: "B", counter: 4, pending: [] };
            const version2 = { uuid: "B", counter: 2, pending: [] };
            const version3 = { uuid: "B", counter: 8, pending: [] };
            const version4 = { uuid: "B", counter: 6, pending: [] };

            vector.updateRemoteVersion(version1);
            vector.updateRemoteVersion(version2);
            vector.updateRemoteVersion(version3);
            vector.updateRemoteVersion(version4);
            const updatedVersion = vector.remoteVersions.get("B");
            expect(updatedVersion).to.deep.equal({
                uuid: "B",
                counter: 8,
                pending: [1, 3, 5, 7]
            });
        });
    });
    describe("committed", () => {
        it("does not commit if uuid unknown", () => {
            const vector = new VersionVector("A");
            const versionTest = { uuid: "B", counter: 2, pending: [] };

            expect(vector.committed(versionTest)).to.be.false;
        });
        it("does not commit if counter too large", () => {
            const vector = new VersionVector("A");
            const version = { uuid: "B", counter: 1, pending: [] };
            const versionTest = { uuid: "B", counter: 2, pending: [] };

            vector.remoteVersions.set("B", version);
            expect(vector.committed(versionTest)).to.be.false;
        });
        it("commits if counter not in pending", () => {
            const vector = new VersionVector("A");
            const version = { uuid: "B", counter: 4, pending: [1] };
            const versionTest = { uuid: "B", counter: 2, pending: [] };

            vector.remoteVersions.set("B", version);
            expect(vector.committed(versionTest)).to.be.true;
        });
        it("does not commit if counter in pending", () => {
            const vector = new VersionVector("A");
            const version = { uuid: "B", counter: 4, pending: [2] };
            const versionTest = { uuid: "B", counter: 2, pending: [] };

            vector.remoteVersions.set("B", version);
            expect(vector.committed(versionTest)).to.be.false;
        });
    });
});
