/**
 * Represents a channel on which tones can be played.
 */
class SynthChannel {
    constructor(synth) {
        this.synth = synth;
        this.osc = new OscillatorNode(synth.c);
        this.gain = new GainNode(synth.c, {
            gain: 0
        });
        this.osc.connect(this.gain);
        
        this.osc.start();

        this.playing = false;
        this.fadeOut = 0;
    }
    setVolume(volume, time = this.synth.time, extraBuffer = 0) {
        this.synth.adjustGain(time, SynthChannel.BUFFER + extraBuffer);
        this.gain.gain.setTargetAtTime(
            volume, // target
            time / 1000, // start time
            (SynthChannel.BUFFER + extraBuffer) / 1000 // time constant
        );
    }
    start({
        note,
        octave,
        frequency = Synth.noteToHertz(note, octave),
        volume = 1,
        wave = "sine",
        fadeOut = 0,
    }) {
        this.playing = true;
        this.gain.connect(this.synth.destination);
        this.osc.frequency.value = frequency;
        this.osc.type = wave;

        // adjust synth gain
        this.synth.active++;
        this.setVolume(volume);

        this.fadeOut = fadeOut;
    }
	/**
	 * Stops the tone from playing, optionally after a delay.
	 * Returns a promise that resolves when the tone stops.
	 * @param Number wait? | The interval (in milliseconds) to wait before stopping the sound. Default is 0
	 * @return Promise
	 */
    stop(wait = 0) {
        const endTime = this.synth.time + wait;

        // adjust synth gain
        this.synth.active--;
        this.setVolume(0, endTime, this.fadeOut);

        setTimeout(() => {
            this.gain.disconnect(this.synth.destination);
            this.playing = false;
        }, wait + 5 * (this.fadeOut + SynthChannel.BUFFER));

        return new Promise(resolve => setTimeout(resolve, wait));
    }
}
SynthChannel.BUFFER = 15;

/**
 * @name class Tone
 * This is not an actual class, but rather an interface for tone specifications.
 * @prop Number duration? | The duration (in milliseconds) of the tone. If not specified, the tone can be stopped at will
 * @prop Number frequency? | The frequency of the tone in Hertz. If not specified, `.note` must be
 * @prop String note? | The letter name of the the note, optionally with a "#" appended for sharp or a "b" for flat. If not specified, `.frequency` must be
 * @prop Number octave? | Which octave on a piano the note would appear in. Default is 4. This is ignored if `.frequency` is specified
 * @prop Number volume? | The volume of the tone on [0, 1]. Default is 1
 * @prop String wave? | The name of the waveform for the tone. This is one of (`"sine"`, `"sawtooth"`, `"triangle"`, `"square"`). Default is `"sine"`
 */

/**
 * Represents a synthesizer which can create pure tones.
 * ```js
 * const synth = new Synth();
 * synth.playSequence([
 * 	{ frequency: 440, duration: 1000 }, // one second A note
 * 	{ duration: 500, volume: 0 } // half second pause
 * 	{ note: "A", duration: 1000 } // one second A note
 * ]);
 * ```
 */
class Synth {
	/**
	 * Creates a new Synth.
	 */
    constructor() {
        this.c = new (window.AudioContext ?? window.webkitAudioContext)({
            sampleRate: 44100
        });
        this.channels = new Set();
        this.active = 0;
        this.destination = new GainNode(this.c);
        this.destination.connect(this.c.destination);
    }
    get time() {
        return this.c.currentTime * 1000;
    }
    adjustGain(time, buffer) {
        const active = 2 + this.active;
        this.destination.gain.setTargetAtTime(
            1 / active,
            time / 1000,
            buffer / 1000
        );
    }
	/**
	 * Plays a tone. If the tone has a specified duration, this returns a promise that resolves when it completes. Otherwise, this returns the `.stop()` method of the SynthChannel playing this tone.
	 * @param Tone tone | The specification of the tone to play.
	 * @return (Number => void)/Promise
	 */
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
			if (this.channels.size >= Synth.MAX_CHANNELS) { // too many
				const stop = duration => this.pause(duration);
				if (info.duration !== undefined) return stop(info.duration);
				return stop;
			} 
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
	/**
	 * Plays a sequence of tones with specified durations. Returns a promise that resolves when they have all completed.
	 * @param Tone[] all | The specifications of the tones to play. See the class description
	 * @param Tone globals? | All the properties of this object will be used as defaults for the properties of tones specified in `all`. Default is `{ }`
	 */
    async playSequence(all, globals = {}) {
        for (const info of all)
            await this.play({ ...globals, ...info });
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

Synth.MAX_CHANNELS = 400;
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

/**
 * Represents an ongoing playback of a Sound.
 * @prop Number volume | The volume of the playback on [0, 1]
 */
class SoundInstance {
    constructor(channel, volume) {
		this.channel = channel;
        this.isDone = false;
        this._volume = volume;
        this.channel.play(volume);
        this.done = this.channel.done.then(() => {
            this.isDone = true;
			this.finalTime = this.time;
        });
    }
	/**
	 * Returns the current time in milliseconds since playback began.
	 * @return Number
	 */
	get time() {
		return this.finalTime ?? this.channel.time;
	}
    get volume() {
        return this._volume;
    }
    set volume(v) {
        if (!this.isDone) this.channel.volume = v; 
        this._volume = v; 
    }
	/**
	 * Stops playback of the sound.
	 */
    stop() {
        this.channel.stop();
    }
}

class SoundChannel {
	constructor(src, loops) {
		this.audio = new Audio(src);
		this.audio.loop = loops;
		this.loops = loops;
		this.resolve = null;
		this.done = null;
		this.playing = false;
	}
	get time() {
		return this.audio.currentTime * 1000;
	}
	set volume(v) {
		this.audio.volume = v;
	}
	get volume() {
		return this.audio.volume;
	}
	stop() {
		this.resolve?.();
	}
	play(volume) {
		this.done = new Promise(resolve => {
			this.resolve = value => {
				this.playing = false;
				this.resolve = null;
				this.audio.pause();
				resolve(value);
			};

			this.audio.onended = this.loops ? null : this.resolve;
		
			this.playing = true;
			this.volume = volume;
			this.audio.currentTime = 0;

			if (SoundChannel.canPlay) this.audio.play().catch(() => null);
			else {
				this.audio.play().then(() => {
					SoundChannel.canPlay = true;
				}).catch(() => {
					const startTime = performance.now();

					SoundChannel.delayed.push(() => {
						let time = (performance.now() - startTime) / 1000;
						if (this.loops) time %= this.audio.duration;
		
						if (time < this.audio.duration) {
							this.audio.currentTime = time;
							this.audio.play().catch(() => null); // ignore
						} else this.resolve();
					});
				});
			}
		});
	}
}

SoundChannel.canPlay = false;
SoundChannel.delayed = [];

window.addEventListener("mousedown", () => {
	if (!SoundChannel.canPlay) {
		SoundChannel.canPlay = true;
		SoundChannel.delayed.forEach(play => play());
	}
});

/**
 * Represents an external sound clip.
 * These should be loaded using HengineSoundResource and not constructed directly.
 * @prop Boolean loops | Whether or not the sound loops upon completion. This value is read-only
 * @prop Number duration | The length, in milliseconds, of the sound
 */
class Sound {
    constructor(src, loops = false) {
        this.src = src;
		this.loops = loops;
		this.channels = [new SoundChannel(this.src, this.loops)];
		this.duration = 0;
		this.channels[0].audio.addEventListener("loadeddata", () => {
			this.duration = this.channels[0].audio.duration * 1000;
		});
    }
	/**
	 * Starts playback of the sound in a new instance, which is returned.
	 * Multiple sound instances can play at once.
	 * @param Number volume | The volume of the playback on [0, 1]
	 * @return SoundInstance
	 */
    play(volume = 1) {
		let channel = this.channels
			.find(channel => !channel.playing);
		if (!channel) {
			channel = new SoundChannel(this.src, this.loops);
			this.channels.push(channel);
		}
        return new SoundInstance(channel, volume);
    }
}