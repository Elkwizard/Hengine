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
}