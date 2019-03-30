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
var app = new Vue({
	el: '#app',
	data: {
		battle: {},
	},
	computed: {
		unnamed: function() {
			return '';
		},
	},
	created() {
		this.user = getCookie('user');
		let getId = getUrlParam('id','');
		if (getId !== '') {
			this.getBattleById(getId);
		}
	},
	methods: {
		async getBattleById(battleId) {
			try {
				let response = await axios.get("/battle/"+battleId).then(result => {
					this.battle = result.data;
					console.log(this.battle.date);
				});
			} catch(error) {
				console.log(error);
			}
		},
		displayTranscript(entry) {
			let type = entry.type;
			let string = type;
			let part = this.battle.participants;
			if (type === 'end') {
				let winnerName = part[0].name;
				if (part[1]._id === this.battle.winner) {
					winnerName = part[1].name;
				}
				console.log(this.battle.winner);
				string = winnerName + " wins!";	
			} else {
			let attacker = entry.attacker;
			let defender = entry.defender;
			if (part[0]._id === attacker.id) {
					attacker.name = part[0].name;
					defender.name = part[1].name;
				} else {
					attacker.name = part[1].name;
					defender.name = part[0].name;
				}
				if (defender.vitality < 0) {defender.vitality = 0};
				if (attacker.vitality < 0) {attacker.vitality = 0};
				if (type === 'damage') {
					string = attacker.name + " attacked " + defender.name + " for " + entry.number + "! " + defender.name + " has " + defender.vitality + " life left.";
				} else if (type === 'spikes') {
					string = attacker.name + " hurt itself on  " + defender.name + "'s spikes.";
				}
			}
			return string;
		},
	},
});
