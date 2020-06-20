class WebcamCapture extends ImageType {
	constructor() {
		super(1, 1, false);
		this.data = { video: null };
		WebcamCapture.getWebcam(this.data);
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
	makeImage() {
		if (this.data.video) {
			const v = this.data.video;
			if (v.videoWidth) this.width = v.videoWidth; 
			if (v.videoHeight) this.height = v.videoHeight;
			const img = new_OffscreenCanvas(this.width, this.height);
			img.getContext("2d").drawImage(this.data.video, 0, 0);
			return img;
		} else return WebcamCapture.EMPTY;
	}
}
WebcamCapture.EMPTY = new_OffscreenCanvas(1, 1);