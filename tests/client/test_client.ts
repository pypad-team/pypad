import { expect } from "chai";
import * as sinon from "sinon";
import "mocha";

/**
 * Client test to make sure tests are running
 */
describe("Client test", () => {
    it("Should return true", () => {
        // Setup mock function to return true
        const stub = sinon.stub();
        stub.returns(true);

        const result = stub();
        expect(result).to.equal(true);
    });
});
