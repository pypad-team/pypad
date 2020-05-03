import { Identifier, compareIdentifier } from "./identifier";

/** Character object */
export interface Char {
    id: Identifier;
    counter: number;
    data: string;
}

/**
 * Compare two character objects.
 *
 * @param ch1 - First character
 * @param ch2 - Second character
 * @returns - Value in (1, 0, -1) representing the comparison result
 */
export function compareChar(ch1: Char, ch2: Char): number {
    return compareIdentifier(ch1.id, ch2.id);
}
