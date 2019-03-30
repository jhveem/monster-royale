var IMAGE_COUNTER = 0;
Vue.component('pixel-img', {
	props: {
		src: String,
		stretch: {
			type: Number,
			default: 1,
		},

	},
	data: function () {
		return {
			id: 0,
			canvas: [],
			img: [],
		}
	},
	watch: {
		src: function(newVal, oldVal) {
			this.initImg(newVal);
		},
	},
	mounted: function() {
		this.id= IMAGE_COUNTER;
		IMAGE_COUNTER += 1;
		let element = this.$refs.img;
		this.canvas = createPixelCanvas(this.src, this.stretch);
		this.img = setUpPixelImg(this.canvas, this.src, this.stretch);
		element.appendChild(this.canvas);
	},
	methods: {
		initImg(src) {
			let element = this.$refs.img;
			let canvas = element.children[0];
			setUpPixelImg(canvas, this.src, this.stretch);
		},
	},
	template: `
	<div ref="img" style="display: inline-block; vertical-align: middle;"></div>
	`,
});
function createPixelCanvas(src, stretch) {
	let canvas = document.createElement('canvas');
	canvas.setAttribute("style", "image-rendering: pixelated;");
	canvas.width = 0;
	canvas.height = 0;
	let ctx = canvas.getContext('2d');
	return canvas;
}
function setUpPixelImg(canvas, src, stretch) {
	let img = new Image();
	let ctx = canvas.getContext('2d');
	img.src = src;
	img.onload = function() {
		let ww = img.naturalWidth;
		canvas.width = ww;
		canvas.style.width = (ww * stretch) + "px";
		let hh = img.naturalHeight;
		canvas.height = hh;
		canvas.style.height= (hh * stretch) + "px";
		canvas.style.display = "inline-block";
		ctx.drawImage(img, 0, 0);
	}
	return img;
}
