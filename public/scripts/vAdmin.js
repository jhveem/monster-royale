var app = new Vue({
	el: '#app',
	data: {
		playerData: {},
		user: getCookie('user'),
	},
	create() {

	},
	methods: {
		logout() {
			setCookie("user","");
			this.user = "";
		},
		async createPlayer(playerData) {
			try {
				let response = await axios.post("/user/create", {
					data: this.playerData,
				}).then(result => {
					console.log(result.data);	
					if (result.data.message === "account created") {
						setCookie("user", result.data.user, 1);
						this.user = result.data.user;
					}
				});
				this.playerData = {};
			} catch (error) {
				console.log(error);
			}
		},
		async login(playerData) {
			try {
				console.log('login attempt');
				console.log(playerData);
				let response = await axios.post("/user/login", {
					data: this.playerData,
				}).then(result => {
					console.log(result.data);
					if (result.data.message === "logged in") {
						console.log('logged in');
						setCookie("user", result.data.name, 1);
						this.user = result.data.name;
					}
				});
			} catch (error) {
				console.log(error);
			}
		},
		async updatePassword(playerData) {
			try {
				let response = await axios.put("/user/password", {
					data: this.playerData,
				}).then(result => {
					console.log(result.data);	
				});
				//this.playerData = {};
			} catch (error) {
				console.log(error);
			}
		},
	},
});
