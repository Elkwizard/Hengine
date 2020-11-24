class WebcamCapture extends ImageType {
	constructor() {
		super(1, 1);
		this.data = { video: null };
		this.loaded = false;
		WebcamCapture.getWebcam(this.data);
		this.lastCaptureTime = -20;
		this.recording = true;
		this.image = new_OffscreenCanvas(this.width, this.height);
		this.c = this.image.getContext("2d");
	}
	static async getWebcam(home) {
		const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
		const videoHTML = document.createElement("video");
		videoHTML.srcObject = mediaStream;
		videoHTML.oncanplay = function () {
			console.log("Webcam Streaming");
			home.video = videoHTML;
		};
		videoHTML.play();
	}
	getFrame() {
		let image = this.makeImage();
		let frame = new Frame(image.width, image.height);
		frame.renderer.c.drawImage(image, 0, 0);
		return frame;
	}
	pause() {
		this.recording = false;
	}
	play() {
		this.recording = true;
	}
	makeImage() {
		if (this.data.video) {
			this.loaded = true;
			if ((this.recording && performance.now() - this.lastCaptureTime > 16)) {
				const v = this.data.video;
				let mwidth = Math.min(v.videoWidth, v.videoHeight);
				let ox = (v.videoHeight < v.videoWidth) ? (v.videoWidth - mwidth) / 2 : 0;
				let oy = (v.videoHeight > v.videoWidth) ? (v.videoHeight - mwidth) / 2 : 0;
				this.width = mwidth;
				this.height = mwidth;
				this.image.width = mwidth;
				this.image.height = mwidth;
				this.c.drawImage(this.data.video, ox, oy, mwidth, mwidth, 0, 0, mwidth, mwidth);
				this.lastCaptureTime = performance.now();
			}
		}
		return this.image;
	}
}