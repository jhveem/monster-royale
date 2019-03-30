const mongoose = require('mongoose');
const battleSchema = new mongoose.Schema({
	participants: [],
	date: Date,
	type: String,
	transcript: [{}],
	winner: String,
});
const Battle = mongoose.model('Battle', battleSchema, 'battles');

function getDataById(id) {
	return new Promise(function(resolve, reject) {
		Battle.findOne({_id:id}, function(err, data) {
			resolve(data);	
		}).catch(error => {
			console.log(error);
		});
	});
}

//deals key 1 receives this much damage from key 2
var elements = {
	fire: {
		fire: .5,
		water: 1.5,
		earth: 1.5,
		plague: .75,
		ice: .75,
		metal: .75,
	},
	water: {
		fire: .75,
		water: .5,
		earth: .75,
		ice: 1.5,
		plague: 1.5,
	},
	earth: {
		fire: .75,
		ice: .75,
		water: 1.5,
		wind: 1.5,
		earth: .5,
		plague: 1.5,
	},
	wind: {
		earth: .75,
		metal: 1.5,
		ice: 1.5,
		wind: .5,
	},
	plague: {
		fire: 1.5,
		water: .75,
		earth: .75,
		ice: 1.5,
		plague: .5,
	},
	ice: {
		plague: .75,
		fire: 1.5,
		earth: 1.5,
		metal: 1.5,
		wind: .75,
	},
	metal: {
		ice: .75,
		fire: 1.5,
		wind: .75,
	},
	none: {
		fire: 1,
		water: 1,
		earth: 1,
		wind: 1,
		plague: 1,
		ice: 1,
		metal: 1,
		none: 1,
	},
}

function choose(arr) {
	let index = Math.round(Math.random() * (arr.length - 1));
	let val = arr[index];
	return val;
}

function calcStrength(monster) {
	let strength = 1;
	strength = Math.pow(monster.weight, .25) / Math.pow(monster.height, .125) 
	let muscleMod = (1 + (monster.muscle / 20));
	strength *= muscleMod;
	if (monster.limbs == 2) {
		strength *= 1.2;
	}
	if (monster.limbs == 4) {
		strength *= 1.1;
	}
	if (strength < .5) {
		strength = .5;
	}
	return strength;
}

function calcSpeed(monster) {
	let speed = 1;
	speed = Math.pow(monster.height, .25) / Math.pow(monster.weight * 4, .25) + (10 / monster.weight); 
	let reflexMod = (1 + (monster.reflex / 20));
	speed *= reflexMod;
	if (monster.limbs == 6) {
		speed *= 1.2;
	}
	if (monster.limbs == 4) {
		speed *= 1.1;
	}
	if (speed < .5) {
		speed = .5;
	}
	return speed;
}

function calcAgility(monster) {

	return 1;
}

function calcVitality(monster) {
	return 100;
}

function calcDamage(attacker, defender, power, defense) {
	let attackerElement = choose(attacker.elements);
	let elementalMultiplier = defender.multiplier[attackerElement];
	if (hasTrait(defender.special, 'adapt')) {
		elementalMultiplier = attacker.multiplier[attackerElement];
	}
	if (defender.skin === 'element') {
		elementalMultiplier *= elementalMultiplier;
	}
	let strength = attacker.strength;
	let damage = ((power * 2) - defense) * strength * .1;
	damage *= elementalMultiplier;
	damage *= (1 + ((Math.random() - .5) / 5)); //just a little randomness
	if (damage < 1) {
		damage = 1;
	}
	return Math.round(damage);
}

function getTargetIndex(index) {
	if (index === 0) {
		return 1;
	} else {
		return 0;
	}
}
function hasTrait(list, trait) {
	return list.includes(trait);
}
function calcPower(monster) {
	let power = 50;
	if (hasTrait(monster.special, 'claws')) {
		power += 10;
	}
	if (hasTrait(monster.special, 'breath')) {
		power = 75;
	}
	if (hasTrait(monster.special, 'rage')) {
		power += 15;
	}
	return power;
}

function calcElementalMultiplier(monster) {
	let multiplier = elements.none;
	for (let e in monster.elements) {
		let element = monster.elements[e];
		for (let m in elements[element]) {
			let mult = elements[element][m];
			multiplier[m] *= mult;
		}
	}
	return multiplier;
}
function createTranscriptEntry(attacker, defender, type, number=0) {
	let entry = {};
	entry.attacker = {};
	entry.attacker.id = attacker._id;
	entry.attacker.vitality = attacker.vitality;
	entry.defender = {};
	entry.defender.id = defender._id;
	entry.defender.vitality = defender.vitality;
	entry.type = type;
	entry.number = number;
	return entry;
}
module.exports = {
	battle: function(participants) {
		let battle = new Battle;
		battle.participants = [participants[0], participants[1]];
		battle.type = "duel";
		battle.date = new Date();
		let transcript = []; 
		for (var p = 0; p < participants.length; p++) {
			let part = participants[p];
			participants[p].strength = calcStrength(part);
			participants[p].speed = calcSpeed(part);
			console.log(participants[p].name + ":" + participants[p].speed);
			participants[p].agility = calcAgility(part);
			console.log(participants[p].name + ":" + participants[p].agility);
			participants[p].vitality = calcVitality(part);
			participants[p].multiplier = calcElementalMultiplier(part); //percent received
			participants[p].regenerationUsed = false;
			participants[p].doubleStrike = 0;
		}
		let turns = [];
		if (participants[1].speed > participants[0].speed) {
			turns.push(1);
		}
		let turnCount = 0;
		while (participants[0].vitality > 0 && participants[1].vitality > 0 && turnCount < 100) {
			if (turns.length == 0) {
				for (var p = 0; p < participants.length; p++) {
					turns.push(p);
				}
			}
			let attackerIndex = turns[0];
			let attacker = participants[attackerIndex];
			let	defenderIndex = getTargetIndex(attackerIndex); 
			let defender = participants[defenderIndex];
			let power = calcPower(attacker);
			let defense = 10;
			if (hasTrait(defender.special, 'shell')) {
				defense += 10;
			}
			if (hasTrait(defender.special, 'rage')) {
				defense -= 5;
			}
			let damage = calcDamage(attacker, defender, power, defense);
			let dodge = false;
			if (hasTrait(defender.special, 'wings') && hasTrait(attacker.special, 'breath')===false) {
				let chance = Math.random();
				if (chance < .15) {
					dodge = true;
					transcript.push(createTranscriptEntry(attacker, defender, 'wings'));
				}
			}
			
			if (dodge === false) {
				defender.vitality -= damage;
				transcript.push(createTranscriptEntry(attacker, defender, 'damage', damage));
				attacker.doubleStrike += attacker.speed / 4;
				if (attacker.doubleStrike > 1) {
					attacker.doubleStrike -= 1;
					defender.vitality -= damage;
					transcript.push(createTranscriptEntry(attacker, defender, 'double strike', damage));
					console.log(attacker.name + " strikes again");
				}

				if (hasTrait(defender.special, 'spikes')) {
					attacker.vitality -= 5;
					transcript.push(createTranscriptEntry(attacker, defender, 'spikes', 5));
				}
			}
			if (hasTrait(defender.special, 'regeneration') && defender.regenerationUsed === false) {
				if (defender.vitality <= (calcVitality(defender) * .1) && defender.vitality > 0) {
					let healAmmount = Math.round(calcVitality(defender) * .5);
					defender.vitality += healAmmount;
					defender.regenerationUsed = true;
					transcript.push(createTranscriptEntry(attacker, defender, 'recover', healAmmount));
				}
			}
			if (hasTrait(attacker.special, 'photosynthesis')) {
				attacker.vitality += 5;
				transcript.push(createTranscriptEntry(attacker, defender, 'photosynthesis', 5));
			}
			turns.splice(0, 1);
			//draw if the battle takes too many turns
			turnCount += 1;
		}
		//winnerIndex of -1 means draw, check if noone died or both died
		let winnerIndex = -1;
		if (participants[0].vitality <= 0) {
			winnerIndex = 1;
		}
		if (participants[1].vitality <= 0) {
			if (winnerIndex === -1) {
				winnerIndex = 1;
			} else {
				winnerIndex = -1;
			}
		}
		battle.winner = 0;
		if (winnerIndex > -1) {
			battle.winner = participants[winnerIndex]._id;
		}
		transcript.push(createTranscriptEntry(0, 0, 'end')); 
		battle.transcript = transcript;
		return new Promise(function(resolve, reject) {
			battle.save(function(err, battle) {
				resolve(battle);
			});
		});
	},
	getDataById: getDataById,
};
