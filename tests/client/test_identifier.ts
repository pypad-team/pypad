import "mocha";
import { expect } from "chai";

import { compareIdentifier, generateIdentifier } from "../../client/ts/identifier";

describe("identifier", () => {
    describe("compareIdentifier", () => {
        it("compares to short identifier with smaller digit", () => {
            const id1 = [{ digit: 2, peer: "1" }];
            const id2 = [{ digit: 1, peer: "1" }];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(1);
        });
        it("compares to short identifier with larger digit", () => {
            const id1 = [{ digit: 2, peer: "1" }];
            const id2 = [{ digit: 4, peer: "1" }];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(-1);
        });
        it("compares to short identifier with equal digits and smaller peer", () => {
            const id1 = [{ digit: 2, peer: "2" }];
            const id2 = [{ digit: 2, peer: "1" }];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(1);
        });
        it("compares to short identifier with equal digits and larger peer", () => {
            const id1 = [{ digit: 2, peer: "1" }];
            const id2 = [{ digit: 2, peer: "2" }];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(-1);
        });
        it("compares to long identifier with smaller digits", () => {
            const id1 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 8, peer: "1" }
            ];
            const id2 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 4, peer: "1" }
            ];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(1);
        });
        it("compares to long identifier with larger digits", () => {
            const id1 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 4, peer: "1" }
            ];
            const id2 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 8, peer: "1" }
            ];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(-1);
        });
        it("compares to long identifier with equal digits and smaller peer", () => {
            const id1 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 8, peer: "2" }
            ];
            const id2 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 8, peer: "1" }
            ];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(1);
        });
        it("compares to long identifier with equal digits and larger peer", () => {
            const id1 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 8, peer: "1" }
            ];
            const id2 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 8, peer: "2" }
            ];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(-1);
        });
        it("compares to long identifier with equal digits and equal peers", () => {
            const id1 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 8, peer: "1" }
            ];
            const id2 = [
                { digit: 2, peer: "1" },
                { digit: 4, peer: "1" },
                { digit: 8, peer: "1" }
            ];
            const comparison = compareIdentifier(id1, id2);
            expect(comparison).to.equal(0);
        });
    });

    describe("generateIdentifier", () => {
        const peer = "1";

        it("constructs an identifier between short identifiers with different digits", () => {
            const id1 = [{ digit: 1, peer: "1" }];
            const id2 = [{ digit: 10, peer: "1" }];
            const newId = generateIdentifier(id1, id2, [], peer);
            expect(compareIdentifier(id1, newId)).to.equal(-1);
            expect(compareIdentifier(id2, newId)).to.equal(1);
        });
        it("constructs an identifier between short identifiers with neighboring digits", () => {
            const id1 = [{ digit: 1, peer: "1" }];
            const id2 = [{ digit: 2, peer: "1" }];
            const newId = generateIdentifier(id1, id2, [], peer);
            expect(compareIdentifier(id1, newId)).to.equal(-1);
            expect(compareIdentifier(id2, newId)).to.equal(1);
        });
        it("constructs an identifier between short identifiers with equal digits", () => {
            const id1 = [{ digit: 1, peer: "1" }];
            const id2 = [{ digit: 1, peer: "2" }];
            const newId = generateIdentifier(id1, id2, [], peer);
            expect(compareIdentifier(id1, newId)).to.equal(-1);
            expect(compareIdentifier(id2, newId)).to.equal(1);
        });
        it("constructs an identifier between long identifiers with equal digits", () => {
            const id1 = [
                { digit: 1, peer: "1" },
                { digit: 1, peer: "1" }
            ];
            const id2 = [
                { digit: 1, peer: "2" },
                { digit: 1, peer: "2" }
            ];
            const newId = generateIdentifier(id1, id2, [], peer);
            expect(compareIdentifier(id1, newId)).to.equal(-1);
            expect(compareIdentifier(id2, newId)).to.equal(1);
        });
        it("constructs an identifier between long identifiers with equal digits and peers", () => {
            const id1 = [
                { digit: 1, peer: "1" },
                { digit: 1, peer: "1" }
            ];
            const id2 = [
                { digit: 1, peer: "1" },
                { digit: 2, peer: "1" }
            ];
            const newId = generateIdentifier(id1, id2, [], peer);
            expect(compareIdentifier(id1, newId)).to.equal(-1);
            expect(compareIdentifier(id2, newId)).to.equal(1);
        });
        it("constructs an identifier between very long identifiers with equal digits and peers", () => {
            const id1 = [
                { digit: 1, peer: "1" },
                { digit: 1, peer: "1" },
                { digit: 1, peer: "1" },
                { digit: 2, peer: "1" }
            ];
            const id2 = [
                { digit: 1, peer: "1" },
                { digit: 1, peer: "1" },
                { digit: 1, peer: "2" },
                { digit: 2, peer: "2" }
            ];
            const newId = generateIdentifier(id1, id2, [], peer);
            expect(compareIdentifier(id1, newId)).to.equal(-1);
            expect(compareIdentifier(id2, newId)).to.equal(1);
        });
        it("constructs 10 sequential identifiers", () => {
            let id1 = [{ digit: 1, peer: "1" }];
            const id2 = [{ digit: 10, peer: "1" }];
            // generate 10 identifiers between `id1` and `id2`
            for (let i = 0; i < 10; i++) {
                const newId = generateIdentifier(id1, id2, [], peer);
                expect(compareIdentifier(id1, newId)).to.equal(-1);
                expect(compareIdentifier(id2, newId)).to.equal(1);
                id1 = newId;
            }
        });
        it("constructs 100 sequential identifiers", () => {
            let id1 = [{ digit: 1, peer: "1" }];
            const id2 = [{ digit: 2, peer: "1" }];
            // generate 100 identifiers between `id1` and `id2`
            for (let i = 0; i < 20; i++) {
                const newId = generateIdentifier(id1, id2, [], peer);
                expect(compareIdentifier(id1, newId)).to.equal(-1);
                expect(compareIdentifier(id2, newId)).to.equal(1);
                id1 = newId;
            }
        });
    });
});
