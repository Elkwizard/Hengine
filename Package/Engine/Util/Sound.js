class Note {
    constructor(notes, durations, octaves, volumes, types) {
        this.notes = notes;
        this.octaves = octaves;
        this.durations = durations;
        this.volumes = volumes;
        this.types = types;
    }
    play() {
        let promises = [];
        let table = Sound.noteFrequencyTable;
        for (let i = 0; i < this.notes.length; i++) {
            let freq = 440.00;
            freq = table[this.notes[i].toUpperCase() + this.octaves[i]];
            promises.push(
                Sound.wave(
                    freq,
                    this.durations[
                        Math.min(i, this.durations.length - 1)
                    ],
                    this.types[
                        Math.min(i, this.types.length - 1)
                    ],
                    this.volumes[
                        Math.min(i, this.volumes.length - 1)
                    ]
                )
            );
        }
        return new Promise(async function (resolve) {
            await Promise.all(promises);
            resolve();
        });
    }
    get() {
        return new Note(this.notes, this.durations, this.octaves, this.volumes, this.types);
    }
    octaveShift(octaves) {
        let n = this.get();
        n.octaves = n.octaves.map(e => Math.max(0, Math.min(8, e + octaves)));
        return n;
    }
    static fromNotes(...NOTES) {
        let notes = [];
        let durations = [];
        let octaves = [];
        let volumes = [];
        let types = [];
        for (let note of NOTES) {
            for (let i = 0; i < note.notes.length; i++) {
                notes.push(note.notes[i]);
                durations.push(note.durations[Math.min(i, note.durations.length - 1)]);
                octaves.push(note.octaves[Math.min(i, note.octaves.length - 1)]);
                volumes.push(note.volumes[Math.min(i, note.volumes.length - 1)]);
                types.push(note.types[Math.min(i, note.types.length - 1)]);
            }
        }
        return new this(notes, durations, octaves, volumes, types);
    }
    static fromNote(note = "C", octave = 4, duration = 1000, volume = 1, type = "sine") {
        return new this([note], [duration], [octave], [volume], [type]);
    }
    static fromChord(notes = ["C", "C"], octaves = [4, 5], duration = 1000, volume = 1, type = "sine") {
        return new this(notes, [duration], octaves, [volume], [type]);
    }
}
class Sound {
    constructor(src) {
        this.src = src;
        let aud = new Audio(this.src);
        this.sounds = [aud];
    }
    set onload(fn) {
        fn();
    }
    play(volume = 1) {
        volume = Math.max(0, Math.min(1, volume));
        let found = false;
        for (const SND of this.sounds) {
            if (!SND.currentTime) {
                SND.volume = volume;
                SND.play();
                found = true;
                break;
            }
        }
        if (!found) {
            let aud = new Audio(this.src);
            this.sounds.push(aud);
            aud.volume = volume;
            aud.play();
        }
    }
    static noteFrequency(noteInx) {
        return 15.4323309696 * 1.05946405842 ** noteInx;
    }
    static get noteFrequencyTable() {
        return {
            "C0": 16.35,
            "C#0": 17.32,
            "D0": 18.35,
            "D#0": 19.45,
            "E0": 20.60,
            "F0": 21.83,
            "F#0": 23.12,
            "G0": 24.50,
            "G#0": 25.96,
            "A0": 27.50,
            "A#0": 29.14,
            "B0": 30.87,
            "C1": 32.70,
            "C#1": 34.65,
            "D1": 36.71,
            "D#1": 38.89,
            "E1": 41.20,
            "F1": 43.65,
            "F#1": 46.25,
            "G1": 49.00,
            "G#1": 51.91,
            "A1": 55.00,
            "A#1": 58.27,
            "B1": 61.74,
            "C2": 65.41,
            "C#2": 69.30,
            "D2": 73.42,
            "D#2": 77.78,
            "E2": 82.41,
            "F2": 87.31,
            "F#2": 92.50,
            "G2": 98.00,
            "G#2": 103.83,
            "A2": 110.00,
            "A#2": 116.54,
            "B2": 123.47,
            "C3": 130.81,
            "C#3": 138.59,
            "D3": 146.83,
            "D#3": 155.56,
            "E3": 164.81,
            "F3": 174.61,
            "F#3": 185.00,
            "G3": 196.00,
            "G#3": 207.65,
            "A3": 220.00,
            "A#3": 233.08,
            "B3": 246.94,
            "C4": 261.63,
            "C#4": 277.18,
            "D4": 293.66,
            "D#4": 311.13,
            "E4": 329.63,
            "F4": 349.23,
            "F#4": 369.99,
            "G4": 392.00,
            "G#4": 415.30,
            "A4": 440.00,
            "A#4": 466.16,
            "B4": 493.88,
            "C5": 523.25,
            "C#5": 554.37,
            "D5": 587.33,
            "D#5": 622.25,
            "E5": 659.25,
            "F5": 698.46,
            "F#5": 739.99,
            "G5": 783.99,
            "G#5": 830.61,
            "A5": 880.00,
            "A#5": 932.33,
            "B5": 987.77,
            "C6": 1046.50,
            "C#6": 1108.73,
            "D6": 1174.66,
            "D#6": 1244.51,
            "E6": 1318.51,
            "F6": 1396.91,
            "F#6": 1479.98,
            "G6": 1567.98,
            "G#6": 1661.22,
            "A6": 1760.00,
            "A#6": 1864.66,
            "B6": 1975.53,
            "C7": 2093.00,
            "C#7": 2217.46,
            "D7": 2349.32,
            "D#7": 2489.02,
            "E7": 2637.02,
            "F7": 2793.83,
            "F#7": 2959.96,
            "G7": 3135.96,
            "G#7": 3322.44,
            "A7": 3520.00,
            "A#7": 3729.31,
            "B7": 3951.07,
            "C8": 4186.01,
            "C#8": 4434.92,
            "D8": 4698.63,
            "D#8": 4978.03,
            "E8": 5274.04,
            "F8": 5587.65,
            "F#8": 5919.91,
            "G8": 6271.93,
            "G#8": 6644.88,
            "A8": 7040.00,
            "A#8": 7458.62,
            "B8": 7902.13
        }
    }
    static async noteSequenceLoop(notes, iterations) {
        for (let n = 0; n < iterations; n++) {
            await Sound.noteSequence(notes);
        }
    }
    static async noteSequence(notes) {
        for (let i = 0; i < notes.length; i++) {
            await Sound.note(notes[i]);
        }
    }
    static wave(hertz, duration, type, volume) {
        const LERP_LENGTH = .1;
        let osc = Sound.context.createOscillator();
        osc.type = type;
        osc.frequency.value = hertz;
        osc.start();
        let gainNode = Sound.context.createGain();
        osc.connect(gainNode);
        const SEC_DURATION = duration / 1000;
        const CURRENT_TIME = Sound.context.currentTime;
        gainNode.gain.value = 0.00001;
        gainNode.gain.exponentialRampToValueAtTime(volume, CURRENT_TIME + SEC_DURATION * LERP_LENGTH);
        gainNode.gain.setValueAtTime(volume, CURRENT_TIME + SEC_DURATION - SEC_DURATION * LERP_LENGTH);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, CURRENT_TIME + SEC_DURATION);
        gainNode.connect(Sound.gainNode);
        return new Promise(function (resolve) {
            setTimeout(function () {
                osc.stop();
                gainNode.disconnect(Sound.gainNode);
                resolve();
            }, duration);
        });
    }
    static sawtooth(hertz, duration, volume = 1) {
        return Sound.wave(hertz, duration, "sawtooth", volume);
    }
    static sin(hertz, duration, volume = 1) {
        return Sound.wave(hertz, duration, "sine", volume);
    }
    static square(hertz, duration, volume = 1) {
        return Sound.wave(hertz, duration, "square", volume);
    }
    static triangle(hertz, duration, volume = 1) {
        return Sound.wave(hertz, duration, "triangle", volume);
    }
    static note(note) {
        return note.play();
    }
}
Sound.context = new AudioContext();
Sound.gainNode = Sound.context.createGain();
Sound.gainNode.connect(Sound.context.destination);
Sound.Note = Note;