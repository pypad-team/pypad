import { expect } from "chai";
import * as sinon from "sinon";
import "mocha";

/**
 * Server test to make sure tests are running
 */
describe("Server test", () => {
  it("Should return true", () => {
    // Setup mock function to return true
    var stub = sinon.stub();
    stub.returns(true);

    const result = stub();
    expect(result).to.equal(true);
  });
});
