/* Color RGB representation */
export interface Color {
    r: number;
    g: number;
    b: number;
}

export function generateColor(): Color {
    return {
        r: Math.random() * 256,
        g: Math.random() * 256,
        b: Math.random() * 256
    };
}

export const RED = { r: 255, g: 0, b: 0 };
export const BLUE = { r: 0, g: 0, b: 255 };
export const GREEN = { r: 0, g: 255, b: 0 };
