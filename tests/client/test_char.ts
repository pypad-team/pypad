import "mocha";
import { expect } from "chai";

import { compareChar } from "../../client/char";

describe("char", () => {
    describe("compareChar", () => {
        it("compares to a smaller character", () => {
            const ch1 = { id: [{ digit: 2, peer: "1" }], counter: 1, data: "A" };
            const ch2 = { id: [{ digit: 1, peer: "1" }], counter: 1, data: "B" };
            const comparison = compareChar(ch1, ch2);
            expect(comparison).to.equal(1);
        });
        it("compares to a larger character", () => {
            const ch1 = { id: [{ digit: 1, peer: "1" }], counter: 1, data: "A" };
            const ch2 = { id: [{ digit: 2, peer: "1" }], counter: 1, data: "B" };
            const comparison = compareChar(ch1, ch2);
            expect(comparison).to.equal(-1);
        });
        it("compares to an equivalent character", () => {
            const ch1 = { id: [{ digit: 1, peer: "1" }], counter: 1, data: "A" };
            const ch2 = { id: [{ digit: 1, peer: "1" }], counter: 1, data: "B" };
            const comparison = compareChar(ch1, ch2);
            expect(comparison).to.equal(0);
        });
    });
});
