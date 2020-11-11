class Sound {
    constructor(src) {
        this.src = src;
        this.audio = new Audio(this.src);
    }
    play(volume = 1) {
        volume = Number.clamp(volume, 0, 1);
        this.audio.play(volume);
    }
}