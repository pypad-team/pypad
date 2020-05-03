const BASE = 256;
const BOUNDARY = 0.25 * BASE;

/** Position identifier */
interface Position {
    digit: number;
    peer: string;
}

/** Position identifier list */
export type Identifier = Position[];

/**
 * Compare two position identifiers.
 *
 * @param pos1 - First position identifier
 * @param pos2 - Second position identifier
 * @returns - Value in (1, 0, -1) representing the comparison result
 */
function comparePosition(pos1: Position, pos2: Position): number {
    if (pos1.digit == pos2.digit) {
        if (pos1.peer == pos2.peer) {
            return 0;
        } else {
            if (pos1.peer < pos2.peer) {
                return -1;
            } else {
                return 1;
            }
        }
    } else {
        if (pos1.digit < pos2.digit) {
            return -1;
        } else {
            return 1;
        }
    }
}

/**
 * Compare two position identifier lists.
 *
 * **Note:** Based on the specification described in Section 4.1 of Weiss et al.
 * Lists are compared using most significant digits, and peer identifiers are
 * used as tiebreakers.
 *
 * @param id1 - First position identifier list
 * @param id2 - Second position identifier list
 * @returns - Value in (1, 0, -1) representing the comparison result
 */
export function compareIdentifier(id1: Identifier, id2: Identifier): number {
    for (let i = 0; i < Math.min(id1.length, id2.length); i++) {
        const comparison = comparePosition(id1[i], id2[i]);
        if (comparison != 0) {
            return comparison;
        }
    }
    if (id1.length < id2.length) {
        return -1;
    } else if (id1.length > id2.length) {
        return 1;
    } else {
        return 0;
    }
}

/**
 * Generate a position identifier between two position identifiers.
 *
 * @param prevPos - Smaller position identifier
 * @param nextPos - Larger position identifier
 * @param peer - Peer identifer of the function caller
 * @returns - Generated position identifier
 */
function generatePosition(prevPos: Position, nextPos: Position, peer: string): Position {
    if (nextPos.digit - prevPos.digit <= 1) {
        throw new Error("position ordering");
    }
    const min = prevPos.digit + 1;
    const max = Math.min(nextPos.digit, prevPos.digit + BOUNDARY);
    const digit = Math.floor(Math.random() * (max - min)) + min;
    return { digit: digit, peer: peer };
}

/**
 * Generate a position identifier list between two position identifier lists.
 * Note that `prevId` must be smaller than `nextId`.
 *
 * @param prevId - Smaller position identifier list
 * @param nextId - Larger position identifier list
 * @param currentId - Current position identifier list, must be initialized to `[]`
 * @param peer - Peer identifier of the function caller
 * @returns - Generated position identifier list
 */
export function generateIdentifier(
    prevId: Identifier,
    nextId: Identifier,
    currentId: Identifier,
    peer: string
): Identifier {
    const [prevHead, ...prevTail] = prevId;
    const [nextHead, ...nextTail] = nextId;
    const prevPos = prevHead || { digit: 0, peer: peer };
    const nextPos = nextHead || { digit: BASE, peer: peer };

    if (nextPos.digit - prevPos.digit > 1) {
        currentId.push(generatePosition(prevPos, nextPos, peer));
        return currentId;
    } else if (nextPos.digit - prevPos.digit === 1) {
        currentId.push(prevPos);
        return generateIdentifier(prevTail, [], currentId, peer);
    } else if (nextPos.digit - prevPos.digit === 0) {
        if (prevPos.peer < nextPos.peer) {
            currentId.push(prevPos);
            return generateIdentifier(prevTail, [], currentId, peer);
        } else if (prevPos.peer === nextPos.peer) {
            currentId.push(prevPos);
            return generateIdentifier(prevTail, nextTail, currentId, peer);
        } else {
            throw new Error("identifier ordering");
        }
    } else {
        throw new Error("identifier ordering");
    }
}
