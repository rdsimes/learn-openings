// PGN Parser utility to convert PGN files to JavaScript opening book format

// Function to fetch and parse a PGN file
async function parsePGNFile(filename) {
    try {
        console.log(`🔍 Fetching PGN file: ${filename}`);
        const response = await fetch(`book/${filename}`);
        const pgnContent = await response.text();
        console.log(`📄 PGN content length for ${filename}:`, pgnContent.length);
        console.log(`📝 First 200 chars of ${filename}:`, pgnContent.substring(0, 200));
        
        const parsedData = parsePGNContent(pgnContent);
        console.log(`✅ Parsed variations from ${filename}:`, Object.keys(parsedData));
        return parsedData;
    } catch (error) {
        console.error(`❌ Error loading PGN file ${filename}:`, error);
        return {};
    }
}

// Function to parse PGN content and extract variations
function parsePGNContent(pgnContent) {
    console.log('🔍 Starting PGN content parsing...');
    const variations = {};
    
    // Split the content by game sections (each game starts with [Event or similar)
    const games = pgnContent.split(/(?=\[Event)/g).filter(game => game.trim());
    console.log(`📊 Found ${games.length} games in PGN content`);
    
    games.forEach((game, index) => {
        console.log(`🎯 Processing game ${index + 1}:`);
        const lines = game.trim().split('\n');
        let variationName = '';
        let moves = '';
        
        // Extract variation name from headers
        lines.forEach(line => {
            if (line.startsWith('[Variation ')) {
                const match = line.match(/\[Variation\s+"([^"]+)"\]/);
                if (match) {
                    variationName = match[1];
                    console.log(`  📋 Found variation name from [Variation]: "${variationName}"`);
                }
            } else if (line.startsWith('[Opening ')) {
                const match = line.match(/\[Opening\s+"([^"]+)"\]/);
                if (match) {
                    // Only use opening name if no variation name found yet
                    if (!variationName) {
                        variationName = match[1];
                        console.log(`  📋 Found variation name from [Opening]: "${variationName}"`);
                    }
                }
            } else if (line.startsWith('[Event ')) {
                // Extract from Event header as fallback (e.g., "Sicilian Defense - Najdorf")
                const match = line.match(/\[Event\s+"([^"]+)"\]/);
                if (match && !variationName) {
                    const eventName = match[1];
                    // Try to extract variation from event name (after the dash)
                    const dashIndex = eventName.lastIndexOf(' - ');
                    if (dashIndex > 0) {
                        variationName = eventName.substring(dashIndex + 3);
                        console.log(`  📋 Found variation name from [Event]: "${variationName}"`);
                    }
                }
            }
            // Extract moves (lines that don't start with [)
            else if (!line.startsWith('[') && line.trim() && !line.startsWith(';')) {
                moves += line.trim() + ' ';
            }
        });
        
        // Clean up moves - remove comments, annotations, and result
        moves = moves
            .replace(/\{[^}]*\}/g, '') // Remove comments
            .replace(/\([^)]*\)/g, '') // Remove variations in parentheses
            .replace(/\$\d+/g, '') // Remove numeric annotations
            .replace(/[!?]+/g, '') // Remove punctuation annotations
            .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove game results
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        
        console.log(`  🎲 Cleaned moves (first 100 chars): "${moves.substring(0, 100)}..."`);
        
        // Generate a key from the variation name
        if (variationName && moves) {
            let key = variationName.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '') // Keep spaces temporarily
                .replace(/\s+/g, '') // Remove all spaces
                .replace(/variation|defense|attack|gambit|opening/g, '')
                .trim();
            
            // Handle specific cases for better key generation
            if (key.includes('najdorf')) key = 'najdorf';
            else if (key.includes('dragon')) key = 'dragon';
            else if (key.includes('accelerated')) key = 'accelerated';
            else if (key.includes('classical')) key = 'classical';
            else if (key.includes('modern')) key = 'modern';
            else if (key.includes('aggressive') || key.includes('bird')) key = 'aggressive';
            else if (key.includes('knights') || key.includes('twoknights')) key = 'knights';
            else if (key.includes('hungarian')) key = 'hungarian';
            else if (key.includes('closed')) key = 'closed';
            else if (key.includes('berlin')) key = 'berlin';
            else if (key.includes('morphy')) key = 'morphy';
            else if (key.includes('declined')) key = 'declined';
            else if (key.includes('accepted')) key = 'accepted';
            else if (key.includes('slav')) key = 'slav';
            else if (key === '' || key.length < 2) key = 'main';
            
            console.log(`  🔑 Generated key: "${key}" for variation: "${variationName}"`);
            variations[key] = moves;
        } else {
            console.log(`  ⚠️ Skipping game ${index + 1} - missing variation name or moves`);
            console.log(`    - Variation name: "${variationName}"`);
            console.log(`    - Moves length: ${moves.length}`);
        }
    });
    
    console.log(`✅ Final variations extracted:`, Object.keys(variations));
    return variations;
}

// Function to load all opening books and create the JavaScript structure
export async function loadOpeningBook() {
    console.log('🚀 Starting to load opening book...');
    const openingBook = {};
    
    // Define the PGN files and their corresponding keys
    const pgnFiles = {
        'italian': 'italian-game.pgn',
        'ruylopez': 'ruy-lopez.pgn',
        'queens': 'queens-gambit.pgn',
        'sicilian': 'sicilian-defense.pgn'
    };
    
    console.log('📁 PGN files to load:', pgnFiles);
    
    // Load all PGN files
    for (const [key, filename] of Object.entries(pgnFiles)) {
        console.log(`🔄 Loading ${key} from ${filename}...`);
        const variations = await parsePGNFile(filename);
        openingBook[key] = variations;
        console.log(`✅ Loaded ${key}:`, variations);
    }
    
    console.log('🎉 Final opening book structure:', openingBook);
    return openingBook;
}

// Display names for openings (keep these static as they're UI labels)
export const openingNames = {
    italian: 'Italian Game',
    ruylopez: 'Ruy Lopez',
    queens: "Queen's Gambit",
    sicilian: 'Sicilian Defense'
};

// Function to generate line names from variation keys
export function generateLineNames(openingBook) {
    console.log('🏷️ Generating line names from opening book:', openingBook);
    const lineNames = {};
    
    // Common mappings for better display names
    const nameMap = {
        'classical': 'Classical Variation',
        'aggressive': "Bird's Attack",
        'modern': 'Modern Defense',
        'knights': 'Two Knights Defense',
        'hungarian': 'Hungarian Defense',
        'closed': 'Closed Defense',
        'berlin': 'Berlin Defense',
        'morphy': 'Morphy Defense',
        'declined': 'Declined',
        'accepted': 'Accepted',
        'slav': 'Slav Defense',
        'najdorf': 'Najdorf Variation',
        'dragon': 'Dragon Variation',
        'accelerated': 'Accelerated Dragon',
        'main': 'Main Line'
    };
    
    console.log('📝 Available name mappings:', nameMap);
    
    // Generate line names from all variations in the opening book
    Object.entries(openingBook).forEach(([openingKey, opening]) => {
        console.log(`🔍 Processing opening: ${openingKey}`, opening);
        if (opening && typeof opening === 'object') {
            Object.keys(opening).forEach(lineKey => {
                console.log(`  🏷️ Processing line key: ${lineKey}`);
                if (!lineNames[lineKey]) {
                    const displayName = nameMap[lineKey] || 
                        lineKey.charAt(0).toUpperCase() + lineKey.slice(1).replace(/([A-Z])/g, ' $1');
                    lineNames[lineKey] = displayName;
                    console.log(`    ✅ Added line name: ${lineKey} -> ${displayName}`);
                } else {
                    console.log(`    ⏭️ Line name already exists: ${lineKey}`);
                }
            });
        } else {
            console.log(`  ⚠️ Opening ${openingKey} is not a valid object:`, opening);
        }
    });
    
    console.log('🎉 Final line names:', lineNames);
    return lineNames;
}
