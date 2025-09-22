// Opening book data dynamically loaded from PGN files
import { loadOpeningBook, openingNames as staticOpeningNames, generateLineNames } from './pgnParser.js';

// Global variables to hold the loaded data
let openingBook = {};
let lineNames = {};

// Static opening names for UI
export const openingNames = staticOpeningNames;

// Function to initialize the opening book from PGN files
export async function initializeOpeningBook() {
    openingBook = await loadOpeningBook();
    lineNames = generateLineNames(openingBook);
    return openingBook;
}

// Export functions to get the current data
export function getOpeningBook() {
    return openingBook;
}

export function getLineNames() {
    return lineNames;
}
