class VideoView extends ImageType {
	constructor(src, loops = false) {
		super(1, 1);
		this.src = src;
		this.video = null;
		this.getVideo();
		this.loops = loops;
		this.loaded = false;
		this.lastCaptureTime = -20;
		this.playing = true;
		this.image = new_OffscreenCanvas(this.width, this.height);
		this.c = this.image.getContext("2d");
	}
	set loops(a) {
		this._loops = a;
		this.video.loop = a;
	}
	get loops() {
		return this._loops;
	}
	getVideo() {
		this.video = document.createElement("video");;
		this.video.src = this.src;
		this.video.muted = true;
		this.video.addEventListener("canplay", () => {
			this.loaded = true;
		});
		this.video.play();
	}
	getFrame() {
		let image = this.makeImage();
		let frame = new Frame(image.width, image.height);
		frame.renderer.c.drawImage(image, 0, 0);
		return frame;
	}
	pause() {
		this.playing = false;
		this.video.pause();
	}
	play() {
		this.playing = true;
		this.video.play();
	}
	makeImage() {
		if (this.loaded) {
			if ((this.playing && performance.now() - this.lastCaptureTime > 16)) {
				const v = this.video;
				this.width = v.videoWidth / devicePixelRatio;
				this.height = v.videoHeight / devicePixelRatio;
				this.image.width = v.videoWidth;
				this.image.height = v.videoHeight;
				this.c.drawImage(this.video, 0, 0, this.image.width, this.image.height);
				this.lastCaptureTime = performance.now();
			}
		}
		return this.image;
	}
}