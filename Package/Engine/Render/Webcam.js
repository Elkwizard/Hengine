class WebcamCapture extends ImageType {
	constructor() {
		super(1, 1);
		this.video = null;
		this.loaded = false;
		this.getWebcam();
		this.lastCaptureTime = -20;
		this.recording = true;
		this.image = new_OffscreenCanvas(this.width, this.height);
		this.c = this.image.getContext("2d");
	}
	async getWebcam() {
		const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
		const videoHTML = document.createElement("video");
		videoHTML.srcObject = mediaStream;
		videoHTML.oncanplay = () => {
			console.log("Webcam Streaming");
			this.video = videoHTML;
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
		if (this.video) {
			this.loaded = true;
			if ((this.recording && performance.now() - this.lastCaptureTime > 16)) {
				const v = this.video;
				let mwidth = Math.min(v.videoWidth, v.videoHeight);
				let ox = (v.videoHeight < v.videoWidth) ? (v.videoWidth - mwidth) / 2 : 0;
				let oy = (v.videoHeight > v.videoWidth) ? (v.videoHeight - mwidth) / 2 : 0;
				this.width = mwidth;
				this.height = mwidth;
				this.image.width = mwidth;
				this.image.height = mwidth;
				this.c.drawImage(this.video, ox, oy, mwidth, mwidth, 0, 0, mwidth, mwidth);
				this.lastCaptureTime = performance.now();
			}
		}
		return this.image;
	}
}