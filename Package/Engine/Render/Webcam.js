/**
 * Represents a video feed from a webcam that can be used as an image.
 * These should be loaded using HengineWebcamResource and not constructed directly.
 * @prop Boolean recording | Whether or not the webcam is capturing new frames
 */
class WebcamCapture extends ImageType {
	constructor(video) {
		super(video.videoWidth, video.videoHeight);
		this.video = video;
		this.lastCaptureTime = -20;
		this.recording = true;
		this.image = new_OffscreenCanvas(this.width, this.height);
		this.c = this.image.getContext("2d");
	}
	/**
	 * Returns a copy of the current view from the webcam.
	 * @return Frame
	 */
	getFrame() {
		const image = this.makeImage();
		const frame = new Frame(image.width, image.height);
		frame.renderer.c.drawImage(image, 0, 0);
		return frame;
	}
	/**
	 * Stops the webcam from recording.
	 */
	pause() {
		this.recording = false;
	}
	/**
	 * Resumes recording from the webcam.
	 */
	play() {
		this.recording = true;
	}
	makeImage() {
		if ((this.recording && performance.now() - this.lastCaptureTime > 16)) {
			const v = this.video;
			const mwidth = Math.min(v.videoWidth, v.videoHeight);
			const ox = (v.videoHeight < v.videoWidth) ? (v.videoWidth - mwidth) / 2 : 0;
			const oy = (v.videoHeight > v.videoWidth) ? (v.videoHeight - mwidth) / 2 : 0;
			this.width = this.height = this.image.width = this.image.height = mwidth;
			this.c.drawImage(this.video, ox, oy, mwidth, mwidth, 0, 0, mwidth, mwidth);
			this.lastCaptureTime = performance.now();
		}

		return this.image;
	}
}
