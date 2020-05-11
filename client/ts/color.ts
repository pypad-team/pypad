import { PeerData } from "./peer";
import { DuplicateColorError, NoColorFoundError } from "./error";

/** Color HSL representation */
export interface Color {
    h: number;
    s: number;
    l: number;
    id?: number;
}

const RED = { h: 0, s: 67, l: 41, id: 0 };
const LT_GREEN = { h: 114, s: 39, l: 62, id: 1 };
const LT_BLUE = { h: 229, s: 100, l: 81, id: 2 };
const CYAN = { h: 180, s: 67, l: 49, id: 3 };
const ORANGE = { h: 28, s: 100, l: 60, id: 4 };
const YELLOW = { h: 60, s: 93, l: 58, id: 5 };
const PINK = { h: 0, s: 100, l: 90, id: 6 };
const TAN = { h: 28, s: 57, l: 84, id: 7 };

const ALL_COLORS = [RED, LT_GREEN, LT_BLUE, CYAN, ORANGE, YELLOW, PINK, TAN];

/** Generate a random color */
export function generateColor(): Color {
    // set values for h, s, l generation
    const MIN_H1 = 0;
    const MAX_H1 = 180;
    const MIN_H2 = 270;
    const MAX_H2 = 360;
    const MIN_S = 50;
    const MAX_S = 100;
    const MIN_L = 50;
    const MAX_L = 80;
    if (Math.random() < (MAX_H1 - MIN_H1) / (MAX_H1 - MIN_H1 + MAX_H2 - MIN_H2)) {
        // generate first range of h values
        return {
            h: Math.random() * (MAX_H1 - MIN_H1) + MIN_H1,
            s: Math.random() * (MAX_S - MIN_S) + MIN_S,
            l: Math.random() * (MAX_L - MIN_L) + MIN_L
        };
    } else {
        // generate second range of h values
        return {
            h: Math.random() * (MAX_H2 - MIN_H2) + MIN_H2,
            s: Math.random() * (MAX_S - MIN_S) + MIN_S,
            l: Math.random() * (MAX_L - MIN_L) + MIN_L
        };
    }
}

/** Generate a random color based on what other peers are already colored */
export function generatePeerColor(peers: Map<string, PeerData>): Color {
    // get all the preset colors that have been used
    const usedColors = new Set();
    peers.forEach((peerData: PeerData): void => {
        if (peerData.color.id === undefined) {
            return;
        }
        if (usedColors.has(peerData.color.id)) {
            throw new DuplicateColorError("duplicate color found");
        }
        usedColors.add(peerData.color.id);
    });
    // generate random color if all preset colors have been used
    if (usedColors.size >= ALL_COLORS.length) {
        return generateColor();
    }
    // randomize color orders and return one that has not been used
    ALL_COLORS.sort(() => Math.random() - 0.5);
    for (let i = 0; i < ALL_COLORS.length; i++) {
        const color = ALL_COLORS[i];
        if (!usedColors.has(color!.id)) {
            return color;
        }
    }
    throw new NoColorFoundError("no new color found");
}
