// Opening book data with chess opening variations in PGN format
export const openingBook = {
    italian: {
        classical: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. Re1 a6 8. Bb3 Ba7 9. h3 h6 10. Nbd2 Re8",
        aggressive: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Bxc3 9. d5 Bf6 10. Re1 Ne7",
        modern: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 a6 6. O-O d6 7. Re1 O-O 8. Nbd2 Be6 9. Bb3 Bxb3 10. axb3",
        knights: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Ncb4 9. Qe4 c6 10. d3",
        hungarian: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Be7 4. d3 Nf6 5. O-O O-O 6. Re1 d6 7. c3 Bg4 8. Nbd2 Nh5 9. h3 Bh5 10. Nf1"
    },
    ruylopez: {
        closed: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7",
        berlin: "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8 10. h3",
        morphy: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bc5 7. c3 d6 8. d4 Bb6 9. Re1 O-O 10. Nbd2"
    },
    queens: {
        declined: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7",
        accepted: "1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5 8. Bb3 Bb7 9. Rd1 Nbd7 10. Nc3",
        slav: "1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O Nbd7 9. Qe2 Bg6 10. e4"
    },
    sicilian: {
        najdorf: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e6 7. f3 b5 8. Qd2 Bb7 9. O-O-O Nbd7 10. h4",
        dragon: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. O-O-O Bd7 10. h4",
        accelerated: "1. e4 c5 2. Nf3 g6 3. d4 cxd4 4. Nxd4 Bg7 5. Nc3 Nc6 6. Be3 Nf6 7. Bc4 O-O 8. Bb3 d6 9. f3 Bd7 10. Qd2"
    }
};

// Opening display names for UI
export const openingNames = {
    italian: 'Italian Game',
    ruylopez: 'Ruy Lopez',
    queens: "Queen's Gambit",
    sicilian: 'Sicilian Defense'
};

// Line display names for UI
export const lineNames = {
    classical: 'Classical Variation',
    aggressive: "Bird's Attack",
    modern: 'Modern Defense',
    knights: 'Two Knights Defense',
    hungarian: 'Hungarian Defense',
    closed: 'Closed Defense',
    berlin: 'Berlin Defense',
    morphy: 'Morphy Defense',
    declined: 'Declined',
    accepted: 'Accepted',
    slav: 'Slav Defense',
    najdorf: 'Najdorf Variation',
    dragon: 'Dragon Variation',
    accelerated: 'Accelerated Dragon'
};
