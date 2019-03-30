Vue.component('main-menu', {
	data: function() {
		return {
			menu: [
				{name: "login", url: "login.html"},
				{name: "monsters", url: "monsters.html"},
			],
		};
	},
	props: {
		
	},
	template: `
			<nav class="navbar navbar-expand-lg navbar-light">
				<div class="navbar-header">
					<a class="navbar-brand" href="/index.html">Monster Royale</a>
				</div>
				<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarNav">
					<ul class="navbar-nav">
						<li class="nav-item" v-for="item in menu" v-bind:item="item"><a class="nav-link" :href="item.url">{{item.name}}</a></li>
					</ul>
				</div>
			</nav>
	`,
});
let vMenu = new Vue({
	el: "#main-menu",
	data: {
		test: "hi",
	},
	methods: {

	},
});
