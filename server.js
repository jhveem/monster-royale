const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const socket = require('socket.io');
const user = require('./scripts/user.js');
const monster = require('./scripts/monster.js');
const battle = require('./scripts/battle.js');

app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

//must be commented out when released
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/MonsterRoyale', {
	useNewUrlParser: true
});

for (var i = 0; i < 100; i++) {
	monster.generateNewMonster();
}

app.post('/battle/queue', async (req, res) => {
	let participantId = req.body.data.participantId;
	let opponenetId; 
	let participant;
	let opponent;
	monster.getData(participantId).then(results => {
		participant = results;
		return monster.getBattleOpponent(participant);
	}).then(results => {
		//run the battle and put participants in a resting state
		opponent = results;
		opponentId = opponent._id;
		let data = [participant, opponent];
		monster.update(participantId, "state", "resting");
		monster.update(opponentId, "state", "resting");
		return battle.battle(data);
	}).then(results => {
		//figure out if won or lost for each and then save the results
		let won = false;
		if (results.winner === participantId) {
			won = true;
		}
		let participantResults = {
			id: results._id,
			date: results.date,
			won: won,
			seen: false,
		};
		won = false;
		if (results.winner === opponentId) {
			won = true;
		}
		let opponentResults = {
			id: results._id,
			date: results.date,
			won: won,
			seen: false,
		};
		monster.updatePush(participantId, 'battles', participantResults);
		monster.updatePush(opponentId, 'battles', opponentResults);
		res.send(results);
	}).catch(error => {
		console.log(error);
	});
});
app.get('/battle/:id', async (req, res) => {
	let id = req.params["id"];
	battle.getDataById(id).then(result=> {
		let data = result;
		res.send(data);
	}).catch(error => {
		res.send("error");
	});

});

app.post('/battle/test', async (req, res) => {
	let participants = req.body.data.participants; 
	let participantData = []; 
	for (var p = 0; p < participants.length; p++) {
		participantData.push(monster.getData(participants[p]));
	}
	Promise.all(participantData).then(data => {
		let victor = battle.battle(data);
		res.send('the victor was ' + victor);
	});
});

app.put('/monsters/breed', async (req, res) => {
	user.getId(req.body.data.user).then(userId => {
		return monster.breed(req.body.data.mom, req.body.data.dad, userId);
	}).then(function(child) {
		return monster.getData(child._id);
	}).then(childData => {
		res.send(childData);
	}).catch(error => {
		console.log(error);
		res.send('failed to breed');
	});
});

app.put('/monsters/breedWild', async(req, res) => {
	let userId = "";
	user.getId(req.body.data.user).then(uid => {
		userId = uid;
		return monster.getWildMate(req.body.data.userMonster);
	}).then(wildMate => {
		let mom = wildMate;
		let dad = req.body.data.userMonster;
		if (wildMate.gender === "male") {
			mom = dad;
			dad = wildMate;
		}
		return monster.breed(mom, dad, userId, 10);
	}).then(child => {
		return monster.getData(child._id);
	}).then(childData => {
		res.send(childData);
	}).catch(error => {
		console.log(error);
	});
});
app.get('/monsters/data/:id/:key', async (req, res) => {
	let id = req.params["id"];
	let key = req.params["key"];
	monster.getData(id).then(result=> {
		let data = result;
		if (key !== 'all') {
			res.send(data[key]);
		} else {
			res.send(data);
		}
	}).catch(error => {
		res.send("error");
	});
});

app.post('/monsters/data', async (req, res) => {
	let incomingData = req.body.data;
	monster.update(incomingData.id, incomingData.key, incomingData.value).then(result=> {
		res.send(incomingData);
	}).catch(error => {
		res.send("error");
	});
});

app.get('/monsters/:user', async (req, res) => {
	let username = req.params["user"];
	user.getId(username).then(userId => {
		return monster.getUserMonsters(userId);
	}).then(function(monsters) {
		let promises = [];
		monsters.forEach(function(id) {
			promises.push(monster.getData(id));
		});
		return Promise.all(promises);
	}).then(monstersData => {
		res.send(monstersData);
	});

});

app.post('/user/create', async (req, res) => {
	let userId = "";
	user.createUser(req.body.data).then(function(result) {
		let sendData = {};
		sendData.message = result;
		sendData.user = req.body.data.name;
		res.send(sendData);
		return user.getId(req.body.data.name);
	}).then(function(uid) {
		userId = uid;
		return monster.generateNewMonster(userId);
	}).then(function(monsterId) {
		return monster.generateNewMonster(userId);
	}).then(function(monsterId) {
		//res.send(); //send the player their collection?
	}).catch(function(result){
		console.log(result);
	});
});

app.post('/user/login', async (req, res) => {
	user.login(req.body.data).then(function(result) {
		let sendData = {};
		sendData.message = result;
		sendData.name = req.body.data.name;
		res.send(sendData);
	}).catch(function(result){
		res.send(result);
		console.log(result);
	});
});

app.put('/user/password', async (req, res) => {
	user.updatePassword(req.body.data).then(function(result) {
		res.send(result);
	}).catch(function(result){
		res.send(result);
		console.log(result);
	});
});

app.listen(3000, () => console.log('Server listening on port 3000!'));
