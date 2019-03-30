const months = ["JAN", "FEB", "MAR","APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
        }
    return urlparameter;
}
Vue.component('monster', {
	props: ['monster'],
	template: `
		<div class="monster-data-container">
			<div class='monster-item monster-item-long'>
				<b>Elements:</b>
				<pixel-img v-for="element in monster.elements" :src="'images/icon-element-'+element+'.png'" :stretch="2"></pixel-img>
			</div>
			<div class="monster-item monster-item-long"><b>Skin: </b>{{monster.skin}}</div>
			<div class="monster-item monster-item-long"><b>Special: </b><span v-for="special in monster.special"> {{special}}</span></div>
			<div class="monster-item">{{monster.weight}}kg</div>
			<div class="monster-item">{{monster.height}}cm</div>
		</div>
	`,
});
Vue.component('monster-full', {
	props: ['monster'],
	template: `
		<div class="monster-full-container">
			<h2 class="monster-header monster-item-long">{{monster.name}}</h2>
			<div class='monster-item'>
				<b>Elements:</b>
				<pixel-img v-for="element in monster.elements" :src="'images/icon-element-'+element+'.png'" :stretch="2"></pixel-img>
			</div>
			<div class="monster-item"><b>Special: </b><span v-for="special in monster.special"> {{special}}</span></div>
			<div class="monster-item monster-item-long"><b>Skin: </b>{{monster.skin}}</div>
			<div class="monster-item">{{monster.weight}}kg</div>
			<div class="monster-item">{{monster.height}}cm</div>
			<div class="monster-item monster-item-long"><h3>BATTLE HISTORY</h3></div>
			<div v-for="battle in monster.battles">
				Battle: <a :href="'/battle.html?id='+battle.id">{{dateText(battle.date)}}</a> - {{wonText(battle.won)}} {{battleSeenText(battle.seen)}}
			</div>

		</div>
	`,
	methods: {
		wonText: function(won) {
			if (won) {
				return "won";
			} else {
				return "lost";
			}
		},
		dateText: function(date) {
			console.log(date);
			date = new Date(date);
			let year = date.getFullYear();
			let month = months[date.getMonth()];
			let day = date.getDate();
			let hours = date.getHours();
			let minutes = date.getMinutes();
			if (minutes < 10) {
				minutes = "0" + minutes;
			}
			var ampm = hours >= 12 ? 'pm' : 'am';
			hours = hours % 12;
			let dateString = month + " " + day + ", " + year + " " + hours + ":" + minutes + " " + ampm;
			return dateString;
		},
		battleSeenText: function(seen) {
			if (seen) {
				return "";
			} else {
				return "NEW!";
			}
		},
	},

});
var app = new Vue({
	el: '#app',
	data: {
		user: '',
		mom: {},
		dad: {},
		now: new Date(),
		monsters: [],
		currentMonster: {},
		elementFilter: 'all',
		skinFilter: 'all',
		specialFilter: 'all',
		newName: '',
	},
	computed: {
		unnamed: function() {
			let list = [];	
			for (let m in this.monsters) {
				let monster = this.monsters[m];
				if (monster.name === "" && monster.state === "idle") {
					list.push(monster);
				}
			}
			return list;
		},
		skins: function() {
			let list = ['all'];
			for (let m in this.monsters) {
				let monster = this.monsters[m];
				let skin = monster.skin;
				if (!list.includes(skin)) {
					list.push(skin);
				}
			}
			return list;
		},
		elements: function() {
			let list = ['all'];
			for (let m in this.monsters) {
				let monster = this.monsters[m];
				let elements = monster.elements;
				for (let e in elements) {
					let element = elements[e];
					if (!list.includes(element)) {
						list.push(element);
					}
				}
			}
			return list;
		},
		specials: function() {
			let list = ['all'];
			for (let m in this.monsters) {
				let monster = this.monsters[m];
				let specials = monster.special;
				for (let s in specials) {
					let special = specials[s];
					if (!list.includes(special)) {
						list.push(special);
					}
				}
			}
			return list;
		},
		filteredMonsters: function() {
			let list = [];
			for (let m in this.monsters) {
				let monster = this.monsters[m];
				let checkElements = (this.elementFilter === 'all' || monster.elements.includes(this.elementFilter));
				let checkSpecials = (this.specialFilter === 'all' || monster.special.includes(this.specialFilter));
				let checkSkin= (this.skinFilter === 'all' || monster.skin === this.skinFilter);
				if (checkElements && checkSpecials && checkSkin) {
					list.push(monster);
				}
			}
			return list;
		},
	},
	created() {
		this.user = getCookie('user');
		this.getMonsters();
		let getId = getUrlParam('id','');
		if (getId !== '') {
			this.currentMonster = this.getCurrentMonsterDataById(getId);
		}
		window.setInterval(() => {
			this.now = new Date();
		}, 1000);
	},
	methods: {
		async getMonsters() {
			try {
				let response = await axios.get("/api/monsters/"+this.user).then(result => {
					this.monsters = result.data;
					for (let m in this.monsters) {
						let monster = this.monsters[m];
						monster.updater = window.setInterval(() => {
							if (monster.state === 'pending battle') {
								this.refreshMonster(monster, 'state');
							}
						}, 5000);
					}
				});
			} catch(error) {
				console.log(error);
			}
		},
		async updateMonster(monster, key, value) {
			try {
				await this.updateMonsterById(monster._id, key, value).then(result => {
					monster[key] = value;
				}).catch(error => {
					console.log(error);
				});
			} catch(error) {
				console.log(error);
			}
		},
		async updateMonsterById(id, key, value) {
			let data = {};
			data.id = id;
			data.key = key;
			data.value = value;
			try {
				await axios.post("/api/monsters/data", {data:data}).then(result => {
					return result;
				});
			} catch(error) {
				console.log(error);
			}
		},
		async refreshMonster(monster, key) {
			try {
				await axios.get("/api/monsters/data/"+monster._id+"/"+key).then(result => {
					monster[key] = result.data;
					if (key === 'state') {
						monster['stateStart'] = new Date();
					}
				});
			} catch(error) {
				console.log(error);
			}
		},
		async getCurrentMonsterDataById(id, key) {
			try {
				await axios.get("/api/monsters/data/"+id+"/all").then(result => {
					console.log(result.data);
					this.currentMonster = result.data;
				});
			} catch(error) {
				console.log(error);
			}
		},
		async release(monster) {
			let index = this.monsters.indexOf(monster);
			this.updateMonsterById(monster._id, 'owner', '');
			this.monsters.splice(index,1);
		},
		async battle(monster) {
			let data = {};
			data.participantId = monster._id;
			try {
				monster.state = 'pending battle';
				let response = await axios.post("/api/battle/queue", {data:data}).then(result => {
					console.log(result.data);	
				});
			} catch(error) {
				console.log(error);
			}
		},
		addAsParent(monster) {
		},
		saveName() {
			let monster = this.unnamed[0];
			this.updateMonster(monster, 'name', this.newName).then(() => {
				this.newName = "";
			});
		},
		breed() {
		},
		async breedWild(monster) {
			try {
				let data = {};
				data.user = this.user;
				data.userMonster = monster;
				let response = await axios.put("/api/monsters/breedWild", {data:data}).then(result => {
					this.monsters.push(result.data);
				});
			} catch(error) {
				console.log(error);
			}
		},
		secondsToRested(monster, time) {
			if (monster.state === 'resting') {
				let now = this.now;
				let start = new Date(monster.stateStart);
				let end = new Date(monster.stateStart);
				end.setMinutes(end.getMinutes() + time);
				let dif = end.getTime() - now.getTime();
				if (dif <= 0) {
					this.updateMonster(monster, 'state', 'idle');
					console.log('rested');
				}
				dif = Math.round(dif / 1000);
				let minutes = Math.floor(dif / 60);
				let seconds = dif - (minutes * 60);
				if (seconds < 10) {
					seconds = "0" + seconds;
				}
				formatted = minutes + ":" + seconds;
				return formatted;
			}
		},
		secondsToBirth(monster) {
			if (monster.state === 'egg') {
				let birth = new Date(monster.birth);
				let now = this.now;
				let dif = birth.getTime() - now.getTime();
				if (dif <= 0) {
					this.updateMonster(monster, 'state', 'idle');
					console.log('egg rested');
				}
				dif = Math.round(dif / 1000);
				let minutes = Math.floor(dif / 60);
				let seconds = dif - (minutes * 60);
				if (seconds < 10) {
					seconds = "0" + seconds;
				}
				formatted = minutes + ":" + seconds;
				return formatted;
			}
		},
		eggBarPercent(monster, now) {
			let birth = new Date(monster.birth);
			let start = new Date(monster.stateStart);
			let totalTime = birth.getTime() - start.getTime();
			totalTime /= (1000 * 60);
			return this.barPercent(monster, now, totalTime);
		},
		barPercent(monster, now, time) {
			let start = new Date(monster.stateStart);
			let end = new Date(monster.stateStart);
			end.setMinutes(end.getMinutes() + time);
			let dif = end.getTime() - now.getTime();
			let total = end.getTime() - start.getTime();
			return Math.round((dif / total) * 100) + "%";
		},
	},
	
});
