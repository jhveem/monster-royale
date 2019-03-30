const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
	name: String,	
	password: String,
	gold: Number,
	monsters: [],
});
const User = mongoose.model('User', userSchema, 'users');
module.exports = {
	createUser: function(data) {
		return new Promise(function(resolve, reject) {
			//look to see if the username is already taken
			User.find({name: data.name}, (err, users) => {
				return users;
			}).then(function(users) {
				//if there are no matches for entries with that name
				if (users.length === 0) {
					//hash the password before saving
					bcrypt.hash(data.password, 10, function(err, hash) {
						data.password = hash;
						//set up the new entry
						const user = new User({
							name: data.name,
							password: data.password,
							gold: 100,
						});
						//save the entry
						user.save();
						//was created
						resolve("account created");
					});
				} else {
					//not created
					reject("account already exists");
				}
			});
			
		});
	},
	login: function(data) {
		return new Promise(function(resolve, reject) {
			User.findOne({name: data.name}, function(err, user) {
				if (user != null) {
					bcrypt.compare(data.password, user.password, function(err, passwordMatch) {
						if (passwordMatch) {
							resolve("logged in");
						} else {
							reject("invalid password");
						}
					});
				} else {
					reject("invalid username");
				}
			});
		});
	},
	getId: function(username) {
		return new Promise(function(resolve, reject) {
			User.findOne({name: username}, function(err, user) {
				if (user !== null) {
					resolve(user._id);
				} else {
					reject("");
				}
			});
		});
	},

	updatePassword: function(data) {
		return new Promise(function(resolve, reject) {
			User.findOne({name: data.name}, function(err, user) {
				if (user != null) {
					bcrypt.compare(data.oldPassword, user.password, function(err, res) {
						if (res) {
							bcrypt.hash(data.password, 10, function(err, hash) {
								User.updateOne(
									{"name": data.name},
									{"$set": {"password": hash}},
									{"upsert": false}
								).then(result => {
									if (result.nModified == 1) {
										resolve("password changed");
									} else {
										reject("invalid username");
									}
								});
							});
						} else {
							reject("invalid password");
						}
					});
				} else {
					reject("invalid username");
				}
			});
		});
	},

	addMonster: function(username, monsterId) {
		return new Promise(function(resolve, reject) {
			User.updateOne(
				{"name": username},
				{$push: {"monsters":monsterId}},
				{"upsert":false}
			).then(result => {
				if (result.nModified == 1) {
					resolve("added");
				} else {
					reject("could not add");
				}
			});
		});
	},
	getMonsters: function(username) {
		return new Promise(function(resolve, reject) {
			User.findOne({name: username}, function(err, user) {
				if (user != null) {
					resolve(user.monsters);
				} else {
					reject('');
				}
			});
		});

	},
};
