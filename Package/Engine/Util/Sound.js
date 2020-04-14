class Sound {
    constructor(src) {
        let aud = new Audio(this.src);
        this.sounds = [aud];
        this.src = src;
    }
    set onload(fn) {
        fn();
    }
    play(volume = 1) {
        volume = Math.max(0, Math.min(1, volume));
        let found = false;
        for (const snd of this.sounds) {
            if (!snd.currentTime) {
                snd.volume = volume;
                snd.play();
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