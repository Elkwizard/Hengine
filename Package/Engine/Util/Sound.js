class SynthChannel {
    constructor(synth) {
        this.synth = synth;
        this.osc = synth.c.createOscillator();
        this.gain = synth.c.createGain();
        this.osc.connect(this.gain);
        this.gain.connect(synth.destination);
        this.gain.gain.setValueAtTime(0, this.synth.time);
        this.osc.start();

        this.playing = false;
    }
    setVolume(volume, time = this.synth.time) {
        this.gain.gain.setTargetAtTime(volume, time, SynthChannel.BUFFER_S);
    }
    start({
        note,
        octave,
        frequency = Synth.noteToHertz(note, octave),
        volume = 1,
        wave = "sine"
    }) {
        this.osc.frequency.value = frequency;
        this.osc.type = wave;
        this.setVolume(volume);
        this.playing = true;
    }
    stop(wait = 0) {
        const endTime = this.synth.time + wait / 1000;

        this.setVolume(0, endTime);

        setTimeout(() => {
            this.playing = false;
        }, wait + 5 * SynthChannel.BUFFER_MS);

        return new Promise(resolve => setTimeout(resolve, wait));
    }
}
SynthChannel.BUFFER_S = 0.005;
SynthChannel.BUFFER_MS = SynthChannel.BUFFER_S * 1000;

class Synth {
    constructor() {
        this.c = new (window.AudioContext ?? window.webkitAudioContext)({
            sampleRate: 48000
        });
        this.channels = new Set();
        this.destination = this.c.createDynamicsCompressor();
        this.destination.connect(this.c.destination);
    }
    get time() {
        return this.c.currentTime;
    }
    async playSequence(all, globals = {}) {
        for (const info of all)
            await this.play({ ...globals, ...info });
    }
    play(info) {
        if (info.duration !== undefined && info.volume === 0)
            return this.pause(info.duration);

        let channel;
        for (const ch of this.channels)
            if (!ch.playing) {
                channel = ch;
                break;
            }
        if (!channel) {
            channel = new SynthChannel(this);
            this.channels.add(channel);
        }

        channel.start(info);

        if (info.duration !== undefined)
            return channel.stop(info.duration);
        return channel.stop.bind(channel);
    }
    pause(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }
    static noteToHertz(note = "A", octave = 4) {
        return Synth.EXP_FACTOR * Synth.EXP_BASE ** (Synth.NOTE_INDEX_MAP[note[0].toUpperCase() + note.slice(1).toLowerCase()] + octave * 12);
    }
    static hertzToNote(hertz) {
        const x = Math.round(Math.log(hertz / Synth.EXP_FACTOR) / Synth.EXP_BASE_LOG);
        const note = Synth.INDEX_NOTE_MAP[x % 12];
        const octave = Math.floor(x / 12);
        return { note, octave };
    }
}

Synth.EXP_BASE = 2 ** (1 / 12);
Synth.EXP_FACTOR = 16.35;
Synth.EXP_BASE_LOG = Math.log(Synth.EXP_BASE);
Synth.NOTE_INDEX_MAP = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11,
};
Synth.INDEX_NOTE_MAP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

class Sound {
    constructor(src) {
        this.src = src;
        this.audioStates = new Map();
        this.addAudio();
    }
    get audio() {
        return [...this.audioStates.keys()][0];
    }
    addAudio() {
        const audio = new Audio(this.src);
        this.audioStates.set(audio, false);
        return audio;
    }
    play(volume = 1) {
        return new Promise(resolve => {
            let amountPlaying = 0;
            let audio;
            for (const [aud, playing] of this.audioStates) {
                if (playing) amountPlaying++;
                else audio = aud;
            }

            if (amountPlaying >= this.audioStates.size - 1)
                this.addAudio();

            if (!audio)
                audio = this.addAudio();

            this.audioStates.set(audio, true);
            audio.onended = () => {
                this.audioStates.set(audio, false);
                resolve();
            };

            // play
            audio.volume = volume;
            audio.play();
        });
    }
}