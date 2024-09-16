/**
 * Represents a video feed from a webcam that can be used as an image.
 * These should be loaded using HengineWebcamResource and not constructed directly.
 * @prop Boolean recording | Whether or not the webcam is capturing new frames
 */
class WebcamCapture extends ImageType {
	constructor(video) {
		const minDim = Math.min(video.videoWidth, video.videoHeight);
		super(minDim, minDim);
		this.video = video;
		this.lastCaptureTime = -20;
		this.recording = true;

		this.image = new_OffscreenCanvas(minDim, minDim);
		this.c = this.image.getContext("2d");

		this.offsetX = (video.videoWidth - minDim) / 2;
		this.offsetY = (video.videoHeight - minDim) / 2;
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
		if ((this.recording && performance.now() - this.lastCaptureTime > 15)) {
			const size = this.width;
			this.c.drawImage(this.video, this.offsetX, this.offsetY, size, size, 0, 0, size, size);
			this.lastCaptureTime = performance.now();
		}

		return this.image;
	}
}
