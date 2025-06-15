/**
 * Represents a video that can have the current frame rendered.
 * These should be loaded using HengineVideoResource and not constructed directly.
 * @prop Boolean loops | Whether or not the video loops.
 * @prop<immutable> Boolean playing | Whether or not the video is currently playing
 */
class VideoView extends ImageType {
	constructor(video, loops = false) {
		super(video.videoWidth / __devicePixelRatio, video.videoHeight / __devicePixelRatio);
		this.video = video;
		this.loops = loops;
		this.lastCaptureTime = -20;
		this.playing = true;
		this.image = new_OffscreenCanvas(video.videoWidth, video.videoHeight);
		this.c = this.image.getContext("2d");
	}
	set loops(a) {
		this._loops = a;
		this.video.loop = a;
	}
	get loops() {
		return this._loops;
	}
	/**
	 * Returns a copy of the current frame of the video.
	 * @return Frame
	 */
	getFrame() {
		let image = this.makeImage();
		let frame = new Frame(image.width, image.height);
		frame.renderer.c.drawImage(image, 0, 0);
		return frame;
	}
	/**
	 * Pauses playback of the video.
	 */
	pause() {
		this.playing = false;
		this.video.pause();
	}
	/**
	 * Resumes playback of the video.
	 */
	play() {
		this.playing = true;
		this.video.play();
	}
	makeImage() {
		if ((this.playing && performance.now() - this.lastCaptureTime > 16)) {
			this.c.drawImage(this.video, 0, 0, this.image.width, this.image.height);
			this.lastCaptureTime = performance.now();
		}
		
		return this.image;
	}
}