import { Char } from "../../client/char";
import { CRDT } from "../../client/crdt";
import { expect } from "chai";
import "mocha";

function toText(document: Char[][]): string[] {
    return document.map(str => {
        return str.map(ch => ch.data).join("");
    });
}

describe("crdt", () => {
    describe("localInsert", () => {
        it("supports single insert", () => {
            const crdt = new CRDT(0);
            const delta = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };

            crdt.localInsert(delta);
            const document = toText(crdt.document);
            expect(document).to.deep.equal(["aaaa"]);
        });
        it("supports single insert with newline", () => {
            const crdt = new CRDT(0);
            const delta = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["aaaa", "bbbb"]
            };

            crdt.localInsert(delta);
            const document = toText(crdt.document);
            expect(document).to.deep.equal(["aaaa\n", "bbbb"]);
        });
        it("supports multiple inserts", () => {
            const crdt = new CRDT(0);
            const delta1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const delta2 = {
                action: "insert",
                start: { row: 0, column: 4 },
                end: { row: 0, column: 8 },
                lines: ["bbbb"]
            };

            crdt.localInsert(delta1);
            crdt.localInsert(delta2);
            const document = toText(crdt.document);
            expect(document).to.deep.equal(["aaaabbbb"]);
        });
        it("supports multiple inserts with newline", () => {
            const crdt = new CRDT(0);
            const delta1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const delta2 = {
                action: "insert",
                start: { row: 0, column: 2 },
                end: { row: 1, column: 2 },
                lines: ["bb", "bb"]
            };

            crdt.localInsert(delta1);
            crdt.localInsert(delta2);
            const document = toText(crdt.document);
            expect(document).to.deep.equal(["aabb\n", "bbaa"]);
        });
    });
    describe("localDelete", () => {
        it("supports single delete", () => {
            const crdt = new CRDT(0);
            const deltaInsert = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const deltaDelete = {
                action: "remove",
                start: { row: 0, column: 2 },
                end: { row: 0, column: 4 },
                lines: ["aa"]
            };

            crdt.localInsert(deltaInsert);
            crdt.localDelete(deltaDelete);
            const document = toText(crdt.document);
            expect(document).to.deep.equal(["aa"]);
        });
        it("supports single delete with newline", () => {
            const crdt = new CRDT(0);
            const deltaInsert = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["aaaa", "bbbb"]
            };
            const deltaDelete = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["aaaa", ""]
            };

            crdt.localInsert(deltaInsert);
            crdt.localDelete(deltaDelete);
            const document = toText(crdt.document);
            expect(document).to.deep.equal(["bbbb"]);
        });
        it("supports multiple deletes", () => {
            const crdt = new CRDT(0);
            const deltaInsert = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["aaaa", "bbbb"]
            };
            const deltaDelete1 = {
                action: "remove",
                start: { row: 1, column: 0 },
                end: { row: 1, column: 2 },
                lines: ["bb"]
            };
            const deltaDelete2 = {
                action: "remove",
                start: { row: 0, column: 2 },
                end: { row: 0, column: 4 },
                lines: ["aa"]
            };

            crdt.localInsert(deltaInsert);
            crdt.localDelete(deltaDelete1);
            crdt.localDelete(deltaDelete2);
            const document = toText(crdt.document);
            expect(document).to.deep.equal(["aa\n", "bb"]);
        });
        it("supports multiple deletes with newline", () => {
            const crdt = new CRDT(0);
            const deltaInsert = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["aaaa", "bbbb"]
            };
            const deltaDelete1 = {
                action: "remove",
                start: { row: 0, column: 3 },
                end: { row: 1, column: 1 },
                lines: ["a", "b"]
            };
            const deltaDelete2 = {
                action: "remove",
                start: { row: 0, column: 1 },
                end: { row: 0, column: 5 },
                lines: ["aabb"]
            };

            crdt.localInsert(deltaInsert);
            crdt.localDelete(deltaDelete1);
            crdt.localDelete(deltaDelete2);
            let document = toText(crdt.document);
            expect(document).to.deep.equal(["ab"]);
        });
    });
});
