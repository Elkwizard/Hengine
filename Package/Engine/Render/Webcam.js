class WebcamCapture extends ImageType {
	constructor() {
		super(1, 1, false);
		this.data = { video: null };
		WebcamCapture.getWebcam(this.data);
		this.lastCaptureTime = 0;
		this.lastCapture = null;
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
	makeImage() {
		if (this.data.video) {
			if (performance.now() - this.lastCaptureTime > 16 || !this.lastCapture) {
				const v = this.data.video;
				let mwidth = Math.min(v.videoWidth, v.videoHeight);
				let ox = (v.videoHeight < v.videoWidth) ? (v.videoWidth - mwidth) / 2 : 0;
				let oy = (v.videoHeight > v.videoWidth) ? (v.videoHeight - mwidth) / 2 : 0;
				this.width = mwidth;
				this.height = mwidth;
				const img = new_OffscreenCanvas(mwidth, mwidth);
				img.getContext("2d").drawImage(this.data.video, ox, oy, mwidth, mwidth, 0, 0, mwidth, mwidth);
				this.lastCapture = img;
				this.lastCaptureTime = performance.now();
				return img;
			} else {
				return this.lastCapture;
			}
		} else return WebcamCapture.EMPTY;
	}
}
WebcamCapture.EMPTY = new_OffscreenCanvas(1, 1);