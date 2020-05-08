import "mocha";
import { expect } from "chai";

import { Char } from "../../client/ts/char";
import { TestClient } from "./util";

function toText(document: Char[][]): string[] {
    return document.map(str => {
        return str.map(ch => ch.data).join("");
    });
}

describe("crdt", () => {
    describe("localInsert", () => {
        it("supports single insert", () => {
            const client = new TestClient();
            const delta = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };

            client.crdt.localInsert(delta);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aaaa"]);
        });
        it("supports single insert with newline", () => {
            const client = new TestClient();
            const delta = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["aaaa", "bbbb"]
            };

            client.crdt.localInsert(delta);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aaaa\n", "bbbb"]);
        });
        it("supports multiple inserts", () => {
            const client = new TestClient();
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

            client.crdt.localInsert(delta1);
            client.crdt.localInsert(delta2);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aaaabbbb"]);
        });
        it("supports multiple inserts with newline", () => {
            const client = new TestClient();
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

            client.crdt.localInsert(delta1);
            client.crdt.localInsert(delta2);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aabb\n", "bbaa"]);
        });
    });
    describe("localDelete", () => {
        it("supports single delete", () => {
            const client = new TestClient();
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

            client.crdt.localInsert(deltaInsert);
            client.crdt.localDelete(deltaDelete);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aa"]);
        });
        it("supports single delete with newline", () => {
            const client = new TestClient();
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

            client.crdt.localInsert(deltaInsert);
            client.crdt.localDelete(deltaDelete);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["bbbb"]);
        });
        it("supports multiple deletes", () => {
            const client = new TestClient();
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

            client.crdt.localInsert(deltaInsert);
            client.crdt.localDelete(deltaDelete1);
            client.crdt.localDelete(deltaDelete2);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aa\n", "bb"]);
        });
        it("supports multiple deletes with newline", () => {
            const client = new TestClient();
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

            client.crdt.localInsert(deltaInsert);
            client.crdt.localDelete(deltaDelete1);
            client.crdt.localDelete(deltaDelete2);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["ab"]);
        });
        it("supports multiple inserts and deletes with newline", () => {
            const client = new TestClient();
            const deltaInsert1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["", ""]
            };
            const deltaInsert2 = {
                action: "insert",
                start: { row: 1, column: 0 },
                end: { row: 2, column: 0 },
                lines: ["", ""]
            };
            const deltaDelete1 = {
                action: "remove",
                start: { row: 1, column: 0 },
                end: { row: 2, column: 0 },
                lines: ["", ""]
            };
            const deltaDelete2 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["", ""]
            };

            client.crdt.localInsert(deltaInsert1);
            client.crdt.localInsert(deltaInsert2);
            client.crdt.localDelete(deltaDelete1);
            client.crdt.localDelete(deltaDelete2);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal([""]);
        });
    });
    describe("remoteInsert", () => {
        it("inserts character into start of document", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 1, peer: "1" }], counter: 0, data: "b" };

            client.crdt.remoteInsert(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["baaaa"]);
        });
        it("inserts character into end of document", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 50, peer: "1" }], counter: 0, data: "b" };

            client.crdt.remoteInsert(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aaaab"]);
        });
        it("inserts character into end of line", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 45, peer: "1" }], counter: 0, data: "b" };

            client.crdt.remoteInsert(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aaaab\n", "aaaa"]);
        });
        it("inserts character into start of line", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 55, peer: "1" }], counter: 0, data: "b" };

            client.crdt.remoteInsert(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aaaa\n", "baaaa"]);
        });
        it("inserts newline character", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 25, peer: "1" }], counter: 0, data: "\n" };

            client.crdt.remoteInsert(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aa\n", "aa\n", "aaaa"]);
        });
        it("inserts multiple newline characters", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch1 = { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" };
            const ch2 = { id: [{ digit: 60, peer: "1" }], counter: 0, data: "\n" };

            client.crdt.remoteInsert(ch1);
            client.crdt.remoteInsert(ch2);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aaaa\n", "\n", ""]);
        });
        it("inserts newline character into end of line", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 55, peer: "1" }], counter: 0, data: "\n" };

            client.crdt.remoteInsert(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aaaa\n", "\n", "aaaa"]);
        });
        it("inserts multiple characters into document", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch1 = { id: [{ digit: 24, peer: "1" }], counter: 0, data: "\n" };
            const ch2 = { id: [{ digit: 74, peer: "1" }], counter: 0, data: "\n" };
            const ch3 = { id: [{ digit: 26, peer: "1" }], counter: 0, data: "b" };
            const ch4 = { id: [{ digit: 76, peer: "1" }], counter: 0, data: "b" };

            client.crdt.remoteInsert(ch1);
            client.crdt.remoteInsert(ch2);
            client.crdt.remoteInsert(ch3);
            client.crdt.remoteInsert(ch4);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aa\n", "baa\n", "aa\n", "baa"]);
        });
    });
    describe("remoteDelete", () => {
        it("deletes chracter from start of document", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" };

            client.crdt.remoteDelete(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["bba"]);
        });
        it("deletes character from end of document", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" };

            client.crdt.remoteDelete(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["abb"]);
        });
        it("deletes character from end of line", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" };

            client.crdt.remoteDelete(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["abb\n", "abba"]);
        });
        it("deletes character from start of line", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" };

            client.crdt.remoteDelete(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["abba\n", "bba"]);
        });
        it("deletes newline character", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch = { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" };

            client.crdt.remoteDelete(ch);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["abbaabba"]);
        });
        it("deletes multiple characters from document", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const ch1 = { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" };
            const ch2 = { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" };
            const ch3 = { id: [{ digit: 60, peer: "1" }], counter: 0, data: "a" };

            client.crdt.remoteDelete(ch1);
            client.crdt.remoteDelete(ch2);
            client.crdt.remoteDelete(ch3);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["abbbba"]);
        });
    });
    describe("initDocument", () => {
        it("initializes text", () => {
            const client = new TestClient();

            client.crdt.initDocument("aabb");
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aabb"]);
        });
        it("initializes text with newline", () => {
            const client = new TestClient();

            client.crdt.initDocument("aabb\naabb\nbbaa\nbbaa");
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["aabb\n", "aabb\n", "bbaa\n", "bbaa"]);
        });
    });
    describe("resetDocument", () => {
        it("resets document", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const initDocument = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "c" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "d" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "d" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "c" }
                ]
            ];

            client.crdt.resetDocument(initDocument);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["cddc"]);
        });
        it("resets document with newline", () => {
            const client = new TestClient();
            client.crdt.document = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "a" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "b" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "a" }
                ]
            ];
            const initDocument = [
                [
                    { id: [{ digit: 10, peer: "1" }], counter: 0, data: "c" },
                    { id: [{ digit: 20, peer: "1" }], counter: 0, data: "d" },
                    { id: [{ digit: 30, peer: "1" }], counter: 0, data: "d" },
                    { id: [{ digit: 40, peer: "1" }], counter: 0, data: "c" },
                    { id: [{ digit: 50, peer: "1" }], counter: 0, data: "\n" }
                ],
                [
                    { id: [{ digit: 60, peer: "1" }], counter: 0, data: "c" },
                    { id: [{ digit: 70, peer: "1" }], counter: 0, data: "d" },
                    { id: [{ digit: 80, peer: "1" }], counter: 0, data: "d" },
                    { id: [{ digit: 90, peer: "1" }], counter: 0, data: "c" }
                ]
            ];

            client.crdt.resetDocument(initDocument);
            const document = toText(client.crdt.document);
            expect(document).to.deep.equal(["cddc\n", "cddc"]);
        });
    });
});
