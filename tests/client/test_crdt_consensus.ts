import "mocha";
import { expect } from "chai";

import { TestNetwork } from "./util";

describe("crdt_consensus", () => {
    // CRDT reaches consensus during multiple concurrent insert/delete operations,
    // assuming messages are received in-order.
    describe("simple consensus; reliable net", () => {
        it("supports inserts into 2 crdts", () => {
            const net = new TestNetwork(2);
            const deltaPeer0 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const deltaPeer1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["bbbb"]
            };

            net.peerInsert(0, deltaPeer0);
            net.peerInsert(1, deltaPeer1);
            net.run(false);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports inserts into 4 crdts", () => {
            const net = new TestNetwork(4);
            const deltaPeer0 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const deltaPeer1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["bbbb"]
            };
            const deltaPeer2 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["cccc"]
            };
            const deltaPeer3 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["dddd"]
            };

            net.peerInsert(0, deltaPeer0);
            net.peerInsert(1, deltaPeer1);
            net.peerInsert(2, deltaPeer2);
            net.peerInsert(3, deltaPeer3);
            net.run(false);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports inserts/deletes from 2 crdts", () => {
            const net = new TestNetwork(2);
            const deltaInsertPeer0 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const deltaDeletePeer0 = {
                action: "remove",
                start: { row: 0, column: 2 },
                end: { row: 0, column: 4 },
                lines: ["aa"]
            };
            const deltaInsertPeer1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["bbbb"]
            };
            const deltaDeletePeer1 = {
                action: "remove",
                start: { row: 0, column: 2 },
                end: { row: 0, column: 4 },
                lines: ["bb"]
            };

            net.peerInsert(0, deltaInsertPeer0);
            net.peerInsert(1, deltaInsertPeer1);
            net.peerDelete(0, deltaDeletePeer0);
            net.peerDelete(1, deltaDeletePeer1);
            net.run(false);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports inserts/deletes from 4 crdts", () => {
            const net = new TestNetwork(4);
            const deltaInsertPeer0 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["aaaa", "bbbb"]
            };
            const deltaDeletePeer0 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["aaaa", ""]
            };
            const deltaInsertPeer1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["cccc", "dddd"]
            };
            const deltaDeletePeer1 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["cccc", ""]
            };
            const deltaInsertPeer2 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["eeee", "ffff"]
            };
            const deltaDeletePeer2 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["eeee", ""]
            };
            const deltaInsertPeer3 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["gggg", "hhhh"]
            };
            const deltaDeletePeer3 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["gggg", ""]
            };

            net.peerInsert(0, deltaInsertPeer0);
            net.peerInsert(1, deltaInsertPeer1);
            net.peerInsert(2, deltaInsertPeer2);
            net.peerInsert(3, deltaInsertPeer3);
            net.peerDelete(0, deltaDeletePeer0);
            net.peerDelete(1, deltaDeletePeer1);
            net.peerDelete(2, deltaDeletePeer2);
            net.peerDelete(3, deltaDeletePeer3);
            net.run(false);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
    });
    // CRDT reaches consensus during multiple concurrent insert/delete operations,
    // assuming messages are received out-of-order.
    describe("simple consensus; unreliable net", () => {
        it("supports inserts into 2 crdts", () => {
            const net = new TestNetwork(2);
            const deltaPeer0 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const deltaPeer1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["bbbb"]
            };

            net.peerInsert(0, deltaPeer0);
            net.peerInsert(1, deltaPeer1);
            net.run(true);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports inserts into 4 crdts", () => {
            const net = new TestNetwork(4);
            const deltaPeer0 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const deltaPeer1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["bbbb"]
            };
            const deltaPeer2 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["cccc"]
            };
            const deltaPeer3 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["dddd"]
            };

            net.peerInsert(0, deltaPeer0);
            net.peerInsert(1, deltaPeer1);
            net.peerInsert(2, deltaPeer2);
            net.peerInsert(3, deltaPeer3);
            net.run(true);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports inserts/deletes from 2 crdts", () => {
            const net = new TestNetwork(2);
            const deltaInsertPeer0 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["aaaa"]
            };
            const deltaDeletePeer0 = {
                action: "remove",
                start: { row: 0, column: 2 },
                end: { row: 0, column: 4 },
                lines: ["aa"]
            };
            const deltaInsertPeer1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 0, column: 4 },
                lines: ["bbbb"]
            };
            const deltaDeletePeer1 = {
                action: "remove",
                start: { row: 0, column: 2 },
                end: { row: 0, column: 4 },
                lines: ["bb"]
            };

            net.peerInsert(0, deltaInsertPeer0);
            net.peerInsert(1, deltaInsertPeer1);
            net.peerDelete(0, deltaDeletePeer0);
            net.peerDelete(1, deltaDeletePeer1);
            net.run(true);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports inserts/deletes from 4 crdts", () => {
            const net = new TestNetwork(4);
            const deltaInsertPeer0 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["aaaa", "bbbb"]
            };
            const deltaDeletePeer0 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["aaaa", ""]
            };
            const deltaInsertPeer1 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["cccc", "dddd"]
            };
            const deltaDeletePeer1 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["cccc", ""]
            };
            const deltaInsertPeer2 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["eeee", "ffff"]
            };
            const deltaDeletePeer2 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["eeee", ""]
            };
            const deltaInsertPeer3 = {
                action: "insert",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 4 },
                lines: ["gggg", "hhhh"]
            };
            const deltaDeletePeer3 = {
                action: "remove",
                start: { row: 0, column: 0 },
                end: { row: 1, column: 0 },
                lines: ["gggg", ""]
            };

            net.peerInsert(0, deltaInsertPeer0);
            net.peerInsert(1, deltaInsertPeer1);
            net.peerInsert(2, deltaInsertPeer2);
            net.peerInsert(3, deltaInsertPeer3);
            net.peerDelete(0, deltaDeletePeer0);
            net.peerDelete(1, deltaDeletePeer1);
            net.peerDelete(2, deltaDeletePeer2);
            net.peerDelete(3, deltaDeletePeer3);
            net.run(true);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
    });
    // CRDT reaches consensus during randomized, concurrent insert/delete operations,
    // assuming messages are received in-order.
    describe("random consensus; reliable net", () => {
        it("supports 10 inserts into 4 crdts", () => {
            const net = new TestNetwork(4);
            for (let i = 0; i < 10; i++) {
                net.randomInsertDelete(1.0);
            }
            net.run(false);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 1000 inserts into 4 crdts", () => {
            const net = new TestNetwork(4);
            for (let i = 0; i < 1000; i++) {
                net.randomInsertDelete(1.0);
            }
            net.run(false);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 1000 inserts into 4 crdts intermittent net", () => {
            const net = new TestNetwork(4);
            // TODO re-enable
            //for (let i = 0; i < 100; i++) {
            //    for (let j = 0; j < 10; j++) {
            //        net.randomInsertDelete(1.0);
            //    }
            //    net.run(false);
            //}

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 10 insert/deletes into 4 crdts", () => {
            const net = new TestNetwork(4);
            for (let i = 0; i < 10; i++) {
                net.randomInsertDelete(0.5);
            }
            net.run(false);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 1000 insert/deletes into 4 crdts", () => {
            const net = new TestNetwork(4);
            for (let i = 0; i < 1000; i++) {
                net.randomInsertDelete(0.5);
            }
            net.run(false);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 1000 insert/deletes into 4 crdts intermittent net", () => {
            const net = new TestNetwork(4);
            // TODO reenable
            //for (let i = 0; i < 100; i++) {
            //    for (let j = 0; j < 10; j++) {
            //        net.randomInsertDelete(0.5);
            //    }
            //    net.run(false);
            //}

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
    });
    // CRDT reaches consensus during randomized, concurrent insert/delete operations,
    // assuming messages are received out-of-order.
    describe("random consensus; unreliable net", () => {
        it("supports 10 inserts into 4 crdts", () => {
            const net = new TestNetwork(4);
            for (let i = 0; i < 10; i++) {
                net.randomInsertDelete(1.0);
            }
            net.run(true);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 1000 inserts into 4 crdts", () => {
            const net = new TestNetwork(4);
            // TODO reenable
            //for (let i = 0; i < 1000; i++) {
            //    net.randomInsertDelete(1.0);
            //}
            //net.run(true);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 1000 inserts into 4 crdts intermittent net", () => {
            const net = new TestNetwork(4);
            // TODO reenable
            //for (let i = 0; i < 100; i++) {
            //    for (let j = 0; j < 10; j++) {
            //        net.randomInsertDelete(1.0);
            //    }
            //    net.run(true);
            //}

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 10 insert/deletes into 4 crdts", () => {
            const net = new TestNetwork(4);
            for (let i = 0; i < 10; i++) {
                net.randomInsertDelete(0.5);
            }
            net.run(true);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 1000 insert/deletes into 4 crdts", () => {
            const net = new TestNetwork(4);
            // TODO reenable
            //for (let i = 0; i < 1000; i++) {
            //    net.randomInsertDelete(0.5);
            //}
            //net.run(true);

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
        it("supports 1000 insert/deletes into 4 crdts intermittent net", () => {
            const net = new TestNetwork(4);
            // TODO reenable
            //for (let i = 0; i < 100; i++) {
            //    for (let j = 0; j < 10; j++) {
            //        net.randomInsertDelete(0.5);
            //    }
            //    net.run(true);
            //}

            net.peers.forEach(peer => {
                expect(peer.crdt.document).to.deep.equal(net.peers[0].crdt.document);
            });
        });
    });
});
