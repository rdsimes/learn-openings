// Opening book data dynamically loaded from PGN files
import { loadOpeningBook, openingNames as staticOpeningNames, generateLineNames } from './pgnParser.js';

// Global variables to hold the loaded data
let openingBook = {};
let lineNames = {};

// Static opening names for UI
export const openingNames = staticOpeningNames;

// Function to initialize the opening book from PGN files
export async function initializeOpeningBook() {
    console.log('🎯 OpeningBook: Starting initialization...');
    openingBook = await loadOpeningBook();
    console.log('🎯 OpeningBook: Loaded opening book:', openingBook);
    
    lineNames = generateLineNames(openingBook);
    console.log('🎯 OpeningBook: Generated line names:', lineNames);
    
    console.log('🎯 OpeningBook: Initialization complete');
    return openingBook;
}

// Export functions to get the current data
export function getOpeningBook() {
    console.log('🎯 OpeningBook: getOpeningBook() called, returning:', openingBook);
    return openingBook;
}

export function getLineNames() {
    console.log('🎯 OpeningBook: getLineNames() called, returning:', lineNames);
    return lineNames;
}
