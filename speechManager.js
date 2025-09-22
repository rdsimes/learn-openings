// Speech synthesis management for chess application
export class SpeechManager {
    constructor() {
        this.voicesLoaded = false;
        this.preferredVoice = null;
        this.isEnabled = true;
        this.initialize();
    }

    initialize() {
        if ('speechSynthesis' in window) {
            // Load voices
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    this.voicesLoaded = true;
                    
                    // Find preferred UK English female voice
                    this.preferredVoice = voices.find(voice => 
                        voice.lang.includes('en-GB') && 
                        (voice.name.toLowerCase().includes('female') || 
                         voice.name.toLowerCase().includes('woman') ||
                         voice.name.toLowerCase().includes('karen') ||
                         voice.name.toLowerCase().includes('kate'))
                    ) || voices.find(voice => 
                        voice.lang.includes('en-GB')
                    ) || voices.find(voice => 
                        voice.name.toLowerCase().includes('female') ||
                        voice.name.toLowerCase().includes('woman')
                    );
                    
                    if (this.preferredVoice) {
                        console.log(`Selected voice: ${this.preferredVoice.name} (${this.preferredVoice.lang})`);
                    }
                }
            };
            
            // Try to load voices immediately
            loadVoices();
            
            // Also listen for the voiceschanged event
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    createUtterance(text, options = {}) {
        if (!('speechSynthesis' in window) || !this.isEnabled) {
            return null;
        }

        const utterance = new SpeechSynthesisUtterance();
        utterance.text = text;
        utterance.rate = options.rate || 0.8;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 0.8;
        utterance.lang = options.lang || 'en-GB';

        // Use the preferred voice
        if (this.preferredVoice) {
            utterance.voice = this.preferredVoice;
        } else {
            // Fallback: try to find a voice now
            const voices = window.speechSynthesis.getVoices();
            const ukFemaleVoice = voices.find(voice => 
                voice.lang.includes('en-GB') && 
                (voice.name.toLowerCase().includes('female') ||
                 voice.name.toLowerCase().includes('woman'))
            ) || voices.find(voice => 
                voice.lang.includes('en-GB')
            );
            
            if (ukFemaleVoice) {
                utterance.voice = ukFemaleVoice;
            }
        }

        return utterance;
    }

    speak(text, options = {}) {
        if (!this.isEnabled || !('speechSynthesis' in window)) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const utterance = this.createUtterance(text, options);
            if (!utterance) {
                resolve();
                return;
            }

            utterance.onend = () => {
                console.log(`Finished speaking: ${text}`);
                resolve();
            };
            
            utterance.onerror = () => {
                console.log('Speech synthesis error');
                resolve(); // Still resolve to prevent hanging
            };
            
            window.speechSynthesis.speak(utterance);
            console.log(`Speaking: ${text}`);
        });
    }

    // Cancel any ongoing speech synthesis
    cancelSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            console.log('Speech synthesis cancelled');
        }
    }

    speakOpeningAnnouncement(openingName, lineName) {
        const text = `Playing ${openingName}, ${lineName}`;
        return this.speak(text, { rate: 0.9, pitch: 1.1 });
    }

    speakMovePair(moves) {
        const spokenMoves = moves.map(move => this.formatMoveForSpeech(move)).join(', ');
        return this.speak(spokenMoves);
    }

    speakCompletion(nextPlayer) {
        const text = `Opening complete. ${nextPlayer} to move.`;
        return new Promise((resolve) => {
            // Add a small delay before speaking the completion
            setTimeout(() => {
                this.speak(text, { rate: 0.9 }).then(resolve);
            }, 500);
        });
    }

    formatMoveForSpeech(moveNotation) {
        // Convert chess notation to spoken format (without unnecessary details)
        let spokenMove = moveNotation;
        
        // Replace common chess notation with spoken equivalents
        spokenMove = spokenMove.replace(/O-O-O/g, 'castles queenside');
        spokenMove = spokenMove.replace(/O-O/g, 'castles kingside');
        spokenMove = spokenMove.replace(/\+/g, ' check');
        spokenMove = spokenMove.replace(/#/g, ' checkmate');
        spokenMove = spokenMove.replace(/x/g, ' takes ');
        spokenMove = spokenMove.replace(/=/g, ' promotes to ');
        
        // Handle piece moves - only add piece name if it's not a pawn move
        if (/^[NBRQK]/.test(spokenMove)) {
            // Check for disambiguation (like Nbd7, Nge5, N1f3, etc.)
            const hasDisambiguation = /^[NBRQK][a-h1-8]/.test(moveNotation);
            
            if (hasDisambiguation) {
                // Keep disambiguation for clarity (e.g., "Knight b d7")
                spokenMove = spokenMove.replace(/^N([a-h1-8])/, 'Knight $1 ');
                spokenMove = spokenMove.replace(/^B([a-h1-8])/, 'Bishop $1 ');
                spokenMove = spokenMove.replace(/^R([a-h1-8])/, 'Rook $1 ');
                spokenMove = spokenMove.replace(/^Q([a-h1-8])/, 'Queen $1 ');
                spokenMove = spokenMove.replace(/^K([a-h1-8])/, 'King $1 ');
            } else {
                // Simple piece moves without disambiguation
                spokenMove = spokenMove.replace(/^N/, 'Knight ');
                spokenMove = spokenMove.replace(/^B/, 'Bishop ');
                spokenMove = spokenMove.replace(/^R/, 'Rook ');
                spokenMove = spokenMove.replace(/^Q/, 'Queen ');
                spokenMove = spokenMove.replace(/^K/, 'King ');
            }
        }
        // For pawn moves (no piece letter), just say the move as is
        
        return spokenMove.trim();
    }

    // Control methods
    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any ongoing speech
        }
    }

    isSupported() {
        return 'speechSynthesis' in window;
    }

    getAvailableVoices() {
        if (!this.isSupported()) return [];
        return window.speechSynthesis.getVoices();
    }

    setPreferredVoice(voiceName) {
        const voices = this.getAvailableVoices();
        const voice = voices.find(v => v.name === voiceName);
        if (voice) {
            this.preferredVoice = voice;
            console.log(`Voice changed to: ${voice.name}`);
        }
    }
}
