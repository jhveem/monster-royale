const mongoose = require('mongoose');
const monsterSchema = new mongoose.Schema({
	name: String,	
	gender: String,
	state: String,
	stateStart: Date,
	birth: Date,
	owner: String,
	battles: [
		{
			id: String,
			won: Boolean,
			seen: Boolean,
			date: Date,
		},
	],
	mom: String,
	dad: String,
	weight: Number,
	height: Number,
	elements: [],
	skin: String,
	leg: Number,
	arm: Number,
	limbs: Number,
	muscle: Number,
	reflex: Number,
	intelligence: Number,
	erect: Boolean,
	special: [],

});
const Monster = mongoose.model('Monsters', monsterSchema, 'monsters');

function choose(arr) {
	let index = Math.round(Math.random() * (arr.length - 1));
	let val = arr[index];
	return val;
}

function calcChildNumber(mom, dad) {
	let combined = (mom + dad) / 2;
	let variation = (combined * .05) - ((combined * .1) * Math.random());
	let stat = Math.round(combined + variation);
	return stat;
}
function updatePush(id, key, value) {
	return new Promise(function(resolve, reject) {
		Monster.findOne({_id:id}).exec(function(err,monster) {
			if(err)throw err;
			if(monster) {
				monster[key].push(value);
				monster.save();
				resolve(monster);
			} else {
				reject('not found');
			}
		});
	});
};
function update(id, key, value) {
	return new Promise(function(resolve, reject) {
		Monster.findOne({_id:id}).exec(function(err,monster) {
			if(err)throw err;
			if(monster) {
				monster[key] = value;
				if (key === "state") {
					monster["stateStart"] = new Date();
				}
				monster.save();
				resolve(monster);
			} else {
				reject('not found');
			}
		});
	});
};

function calcChildTrait(mom, dad, max = 1) {
	let parentTraits = [];
	let unique = [];
	if (typeof(mom) !== 'object') {
		mom = [mom];
	}
	if (typeof(dad) !== 'object') {
		dad = [dad];
	}
	parentTraits = dad.concat(mom);
	childTraits = [];
	let chance = 0;
	for (let i = 0; i < max; i++) {
		childTraits.push(choose(parentTraits));
		chance = Math.random();
		if (chance < .25) {
			break;
		}
		//add in something to make sure there aren't duplicates
	}
	unique = childTraits.filter((item, index) => {return childTraits.indexOf(item) >= index;});
	return unique;
}
function getData(id) {
	return new Promise(function(resolve, reject) {
		Monster.findOne({_id:id}, function(err, data) {
			resolve(data);	
		}).catch(error => {
			console.log(error);
		});
	});
}

elements = ['none','fire','water','earth','wind','plague','metal','ice'];
skins = ["fur", "scales", "carapace", "feathers", "soft", "element"];
specials = ["regeneration", "spikes", "shell", "breath", "wings", "claws", "blubber", "photosynthesis", "camouflage", "adapt", "infertile", "rage", "venom", "none"]
module.exports = {
	elements: elements,
	skins: skins,

	generateNewMonster: function(ownerId = "") {
		return new Promise(function(resolve, reject) {
			let monster = new Monster;
			monster.name = "";
			monster.gender = choose(["male", "female"]);
			monster.state = "idle";
			monster.owner = ownerId;
			monster.birth = new Date();
			monster.birth.setMinutes(monster.birth.getMinutes() + 60);
			monster.stateStart = new Date();
			monster.mom = "";
			monster.dad = "";
			monster.weight = Math.round(Math.random() * 100 + 5);
			monster.height = Math.round(Math.random() * 200 + 5);
			monster.elements = choose(elements);
			monster.skin = choose(skins);
			monster.leg = Math.round(Math.random() * 10);
			monster.arm = Math.round(Math.random() * 10);
			monster.limbs = Math.round(Math.random() * 2 + 1) * 2;
			monster.erect = choose([false,true]);
			monster.special = choose(specials);
			monster.muscle = 1;
			monster.reflex = 1;
			monster.intelligence = 1;
			monster.save(function(err, monster) {
				resolve(monster._id);
			})
		});
	},

	breed: function(mom, dad, ownerId = "", birthTime = 5) {
		return new Promise(function(resolve, reject) {
			let child = new Monster; 
			child.name = "";
			child.gender = choose(["male","female"]);
			child.state = "egg";
			child.birth = new Date();
			child.birth.setMinutes(child.birth.getMinutes() + birthTime);
			child.stateStart = new Date();
			child.owner = ownerId; 
			child.mom = mom._id;
			child.dad = dad._id;
			child.weight = calcChildNumber(mom.weight, dad.weight);
			child.height = calcChildNumber(mom.height, dad.height);
			child.elements = calcChildTrait(mom.elements, dad.elements, 2); 
			child.skin = calcChildTrait(mom.skin, dad.skin)[0];
			child.leg = calcChildNumber(mom.leg, dad.leg);
			child.arm = calcChildNumber(mom.arm, dad.arm);
			child.limbs = calcChildTrait(mom.limbs, dad.limbs)[0];
			child.erect = calcChildTrait(mom.erect, dad.erect)[0];
			child.special = calcChildTrait(mom.special, dad.special, 3);
			child.muscle = 1;
			child.reflex = 1;
			child.intelligence = 1;
			child.save(function(err, monster) {
				resolve(monster._id);
			});
		});
	},

	getBattleOpponent: function(userMonster) {
		return new Promise(function(resolve, reject) {
			let userOwner = userMonster.owner;
			let criteria = {
				owner: {$ne:userOwner}, 
				state: "pending battle",
			};
			Monster.countDocuments(criteria).exec(function (err, count) {
				console.log(count);
				if (count > 0) {
					var random = Math.floor(Math.random() * count);
					Monster.findOne(criteria).skip(random).exec(function (err,result) {
						resolve(result);
					});
				} else {
					update(userMonster._id, "state", "pending battle");
					reject("no results found");
				}
			});
		});
	},

	getWildMate: function(userMonster) {
		return new Promise(function(resolve, reject) {
			let userGender = userMonster.gender;
			let findGender = "female";
			if (userGender === "female") {
				findGender = "male";
			};
			Monster.countDocuments({owner: "", gender: findGender}).exec(function (err, count) {
				if (count > 0) {
					var random = Math.floor(Math.random() * count);
					Monster.findOne({owner: "", gender: findGender}).skip(random).exec(function (err,result) {
						resolve(result);
					});
				} else {
					reject("no results found");
				}
			});
		});
	},

	getUserMonsters: function(userId) {
		return new Promise(function (resolve, reject) {
			Monster.find({owner:userId}).exec(function(err, monsters) {
				resolve(monsters);
			});
		});
	},

	getData: getData,
	getDatas: function(ids) {
		return new Promise(function(resolve, reject) {
			let monstersData = [];
			ids.forEach(function(id) {
				let monsterData = getData(id);
				monstersData.push(monsterData);
			});
			resolve(monstersData);
		});
	},
	update: update,
	updatePush: updatePush,
};
