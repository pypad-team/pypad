declare var ace: any;
declare var Peer: any;

enum Status {
    Host = 1,
    Follower
}

enum MessageType {
    Insert = 1,
    Delete
}

/**
 * Error to indicate an invalid action performed due to invalid state of connection
 */
class InvalidActionError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidActionError.prototype);
    }
}