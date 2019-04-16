/// Initial variables and setup
const chatId = 'YOUR-CHAT-ID'
const telegramToken = 'YOUR-TELEGRAM-BOT-TOKEN'
const airToken = 'YOUR-AIR-INDEX-TOKEN'
const darksky = 'https://api.darksky.net/forecast/YOUR-DARKSKY-TOKEN/'
const myTimezone = 'YOUR-TIMEZONE' // 'Asia/Bangkok'
const myCity = { // Adjust to your preferred city.
	name: 'Bangkok',
	lat: '13.7563',
	long: '100.5018'
}
var admin = require('firebase-admin');
const serviceAccount = require('./firebase.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'YOUR-FIREBASE-URL'
});


const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(telegramToken, {polling: true});
var CronJob = require('cron').CronJob;
const database = admin.firestore();
const settings = {
    timestampsInSnapshots: true
};
database.settings(settings);
module.exports = {
    database
}
let task;
let notifications = [];

/// Functions

const checkNotifications= function() {
	return new Promise(function(resolve, reject) {
		database.collection("notifications").get().then(function(querySnapshot) {
		    resolve(querySnapshot)
		});	
	})
}
const createReply = function() {
	console.log('========')
	let string = [];
	notifications.forEach(i => {
		var build = { 'text' : i.notification, 'callback_data' : i.notification}
		string.push(build)
	})
	return string
}

const getForecast = (city, chatId) => {
	axios.get(`http://api.waqi.info/feed/${city.name}/?token=${airToken}`)
		.then(response => {
			var qualityIndex = response.data.data.aqi
			axios.get(darksky + city.lat +','+city.long +'?units=si').then(i => {
				var todayForecast = i.data.daily.data[0].summary
				var uvIndex = i.data.daily.data[0].uvIndex
				var highTemp = i.data.daily.data[0].temperatureHigh
				var realFeelHigh = i.data.daily.data[0].apparentTemperatureHigh
				var realFeelLow = i.data.daily.data[0].apparentTemperatureLow
				var lowTemp = i.data.daily.data[0].temperatureLow
				var airQualityMessage;
				if(qualityIndex <= 50){
					airQualityMessage = `The current air quality is *GOOD* at ${qualityIndex} \n
						Air quality is considered satisfactory, and air pollution poses little or no risk`
				}	else if (qualityIndex >= 51 || qualityIndex <= 100) {
					airQualityMessage = `The current air quality is *Moderate* at ${qualityIndex} \n
						Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.`
				}   else if (qualityIndex >= 101 || qualityIndex <= 150) {
					airQualityMessage = `The current air quality is *Unhealthy for Sensitive Groups* at ${qualityIndex} \n
						Members of sensitive groups may experience health effects. The general public is not likely to be affected.`
				}   else if (qualityIndex >= 151 || qualityIndex <= 200) {
					airQualityMessage = `The current air quality is *Unhealthy* at ${qualityIndex} \n
						Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects`
						
				}   else if (qualityIndex >= 201 || qualityIndex <= 300) {
					airQualityMessage = `The current air quality is *Very Unhealthy* at ${qualityIndex} \n
						Health warnings of emergency conditions. The entire population is more likely to be affected.`
				}   else if (qualityIndex > 300) {
					airQualityMessage = `The current air quality is *Hazardous* at ${qualityIndex} \n
						Health alert: everyone may experience more serious health effects`
				}
					bot.sendMessage(chatId,`Today's forecast: ${todayForecast} \n
						The high temp for today will be ${Math.round(highTemp)}, but will feel like ${Math.round(realFeelHigh)} \n
						The low temp for today will be ${Math.round(lowTemp)}, but will feel like ${Math.round(realFeelLow)} \n
						The UV index for today will be ${Math.round(uvIndex)}. \n
						${airQualityMessage}`, {
						parse_mode: 'Markdown'
					})
				})
		}).catch(function (error) {
			console.log(error);
		})	
}

const setupNotifcationsArray = querySnapshot => {
	new Promise(function(resolve, reject)  {
		console.log('Reforming notifications Array.')
		notifications = [];
    	querySnapshot.forEach(function(doc) {
    		console.log('====')
    		let id = doc.id
	    	var data = doc.data()
	    	notifications.push({ id : id, data : data})
   		});	
   		resolve(notifications)
   		if(querySnapshot.length < 1){
   			reject()
   		}
	})
}

const setupProgram = function() {
	return new Promise(function(resolve, reject) {
	    crons = [];
		var day = new Date();
		let tempDate = days[day.getDay()];
		let startTime = new Date()
		checkNotifications().then( returned => setupNotifcationsArray(returned))
				  .catch(e => console.log(e))
				  .then( next => {
					notifications.forEach(i => {
							if(i.data.nextDay == tempDate){
								startJob(i.data.notification)
							} else {
								startJob(i.data.notification)
							}
					})
					let canSetOptions = true;
					resolve('Setup is finished')
				}).catch(e => {
			console.log(e) 
			reject(e)
		})
	})
}

const startJob = (task, startDay) => {
	var day = new Date();
	let tempDate = days[day.getDay()];
	let startTime = new Date()
	let finishedTask = notifications.find(i => i.data.notification == task)
	if(!finishedTask.data.hasFinished && finishedTask.data.nextDay == tempDate){
	  	bot.sendMessage(chatId,`REMINDER PLEASE TAKE ${task}`, {
			reply_markup: {
				inline_keyboard: [[
					{
					    text: `I've taken ${task}.`,
					    callback_data: `finished-task-${task}`
					},
					{
					    text: `Remind me later..`,
					    callback_data: `remind-later-${tasktask}`
					}
			]]
		}
	});  
	}
	console.log(`starting cron job for ${task}`)
	job = new CronJob('00 00 10 * * 0-6', () =>  {
		if(!finishedTask.data.hasFinished && finishedTask.data.nextDay == tempDate){
	  				bot.sendMessage(chatId,`REMINDER PLEASE TAKE ${task}`, {
					    reply_markup: {
					      inline_keyboard: [[
					        {
					          text: `I've finished ${task}.`,
					          callback_data: `finished-task-${task}`
					        },
					        {
					          text: `Remind me later..`,
					          callback_data: `remind-later-${task}`
					        }
					      ]]
					    }
					});  	
		}		  
	}, null, true, myTimezone);
	job.start()
}

/// Bot commands
let canSetOptions = true;

bot.onText(/\/chatID/, (msg, match) => {
	bot.sendMessage(msg.chat.id, `Your chat id is ${msg.chat.id}.`)
})

bot.onText(/\/check/, (msg, match) => {
	checkNotifications().then(querySnapshot => {
    querySnapshot.forEach(function(doc) {
    	var data = doc.data()
        bot.sendMessage(msg.chat.id,`You're currently scheduled to do ${data.notification} ${data.schedule}` )
    });	
	})
});

bot.onText(/\/finishedtask/, (msg, match) => {
	if(msg.chat.id != chatId)
	return
	var string = createReply()
	bot.sendMessage(msg.chat.id,'Which task did you do today?', {
		reply_markup: {
			inline_keyboard: [ string ]
		}
	});
});

bot.onText(/\/help|commands/, (msg, match) => {
  var helpString = `
  The following commands are available to you:\n
  You may add a new task with /addtask \n
  You may check what notifications you've added with /check \n
  You may delete a task using /delete \n
  You can check today's forecast using /forecast \n
  If you've already finished a task before the notification, you can let me know by typing /finishedtask \n
  When answering one of my questions please right click or tab my message and hit "Reply"`
  bot.sendMessage(msg.chat.id,helpString);
})

bot.onText(/\/forecast/, (msg, match) => {
  	getForecast(myCity, msg.chat.id)	
})

bot.onText(/\/done/, (msg, match) => {
	if(msg.chat.id != chatId)
	return
	var day = new Date();
	let tempDate = days[(day.getDay()) % 7];
	var dayNum = (day.getDay() % 7)
	var filterDay = days.find(i => i == tempDate)
	var nextDay;
	var chosen = chosenSchedule.sort((a, b) => a - b);
	var isSameDay = false;
	if(chosen.some( i => i == dayNum)){
		nextDay = dayNum
	} else if (chosen.some(i => i > dayNum)){
		nextDay = chosen.find(x => x > dayNum)
	}
	else {
		nextDay = chosen.find(i => i < dayNum)
	}
	var chosenDays = chosen.map(i => i = days[i])
		      database.collection('notifications').add({
			notification: task,
			schedule : chosenDays,
			hasFinished: false,
			startDay: tempDate,
			nextDay: days[nextDay]
		      }).then(function() {
		      		var convertString = function() {
		      			let built = ''
		      			chosenSchedule.forEach(i => {
		      				built += days[i] + ' '
		      			})
		      			return built
		      		}
		      		bot.sendMessage(msg.chat.id,`You've set up to take ${task} on ${convertString()}.`).then(function(sended) {
			            var chatId = sended.chat.id;
			            var messageId = sended.message_id;
			        })
		      	    // setupProgram
		      	    chosenSchedule = []
		      		console.log(`we've reset the chosen`)
		      	    setupProgram().then(() => { 
		      	    	//startJob(task) 
		      	    }).catch(e => console.log(e))
				})
				.catch(function(error) {
				    console.error("Error writing document: ", error);
				});	

});
bot.onText(/\/delete/, (msg, match) => {
	if(msg.chat.id != chatId)
	return
	var deleteQuery = []
	notifications.forEach(i => {
		deleteQuery.push({ text: i.data.notification, callback_data: `delete-${i.data.notification}`})
	})
	bot.sendMessage(msg.chat.id,'What task do you want to delete?', {
				    reply_markup: {
				      inline_keyboard: [ 
				        deleteQuery
			]
		}
	});

});
bot.onText(/\/addtask/, (msg, match) => {
	if(msg.chat.id != chatId)
		return
	bot.sendMessage(msg.chat.id,`Got it. What's the name of the task?`, ).then(function(sended) {
            var chatId = sended.chat.id;
            var messageId = sended.message_id;
            bot.onReplyToMessage(chatId, messageId, function (message) {
            	  task = message.text
           		  console.log(task)
          	      canSetOptions = true;
				  bot.sendMessage(msg.chat.id,'Got it, and how often do you need to do it??', {
				    reply_markup: {
				      inline_keyboard: [[
				        {
				          text: 'Daily',
				          callback_data: 'Daily'
				        },{
				          text: 'Every other day',
				          callback_data: 'Every-Other-Day'
				        },{
				          text: 'Schedule',
				          callback_data: 'Schedule'
				        }
				      ]]
				    }
				  });
            });
        })

});
let dates;

const daysShort = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
const daysShortVar = [
	{text:'Sun', callback_data:0},
	{text:'Mon', callback_data:1},
	{text:'Tue', callback_data:2},
	{text:'Wed', callback_data:3},
	{text:'Thu', callback_data:4},
	{text:'Fri', callback_data:5},
	{text:'Sat', callback_data:6},
]
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let week = [0,1,2,3,4,5,6]
let chosenSchedule = []
bot.on("callback_query", (callbackQuery) => {
  var day = new Date();
  let tempDate = days[day.getDay()];
  let message = callbackQuery.message;
  let data = callbackQuery.data
  if(data == week.find(i => i == data)){
  	if(!chosenSchedule.find(i => i == data)){
  		chosenSchedule.push(data)
  	} else {
  		console.log(`you've already added that day!`)
  	}
  }
	let foundTask = notification.find(i => i.notification == data);
	if(data == 'Today'){
		var start = days[(day.getDay() + 0) % 7]
		var next = days[(day.getDay() + 2) % 7]
		database.collection('notifications').add({
			notification: task,
			schedule : 'every-other-day',
			hasFinished: false,
			startDay: start,
			nextDay: start
		}).then(function() {
		    setupProgram().then(() => {  }).catch(e => console.log(e))
				    
		})
		.catch(function(error) {
				    console.error("Error writing document: ", error);
		});
		bot.sendMessage(message.chat.id,`Added ${task} to be done every other day starting today!`)
	}
	if(data.includes('finished-task')){
		var notificationsubString = data.substring(13, data.length);
		let finishedTask = notifications.find(i => i.data.notification == notificationsubString)
		if(finishedTask.data.hasFinished){
			bot.sendMessage(message.chat.id,`You've already finished ${notificationsubString} today!`)
		}	
		else {			
			if(finishedTask.data.schedule == 'every-other-day'){
				finishedTask.data.nextDay = days[(day.getDay() + 2) % 7]
			}  else { //This would be schedule and daily get next in array.
				let currentIndex = finishedTask.data.schedule.indexOf(tempDate)
				let nextIndex = (currentIndex + 1) % finishedTask.data.schedule.length;
				finishedTask.data.nextDay = finishedTask.data.schedule[nextIndex]
			}
			database.collection('notifications').doc(finishedTask.id).update({
			    hasFinished: false,
			    nextDay: finishedTask.data.nextDay
			});
			if(notifications.filter(i => i.data.nextDay == tempDate).length == 0 || notifications.filter(i => i.data.nextDay == tempDate && !i.data.hasFinished).length == 0){
				bot.sendMessage(chatId,`You've finished everything today. Solid work champ.`)
			}
		}
		
	}
	if(data.includes('delete-')){
		var deleteSubString = data.substring(7, data.length);
		console.log(deleteSubString)
		let deleteTask = notifications.find(i => i.data.notification == deleteSubString)
		console.log(deleteTask)
		database.collection('notifications').doc(deleteTask.id).delete().then(function(){
		    setupProgram().then(() => { bot.sendMessage(chatId,`Removed ${deleteSubString}.`)  }).catch(e => console.log(e))
				    
			})
		.catch(e => console.log(e))
	}
	if(data == 'Schedule'){
				 bot.sendMessage(message.chat.id,`Please choose the days you want to do ${task}, then type /done.`, {
			reply_markup: {
				inline_keyboard: [daysShortVar]
			}
		})
	}
	if(data.includes('remind-later')){
		var task = data.substring(13, data.length);
		bot.sendMessage(message.chat.id,`I'll remind you to take ${task} in 30 minutes!`)
		setTimeout(function(){
						bot.sendMessage(chatId,`REMINDER PLEASE TAKE ${task}`, {
						    reply_markup: {
						      inline_keyboard: [[
						        {
						          text: `I've finished ${task}.`,
						          callback_data: `finished-task-${task}`
						        },
						        {
						          text: `Remind me later..`,
						          callback_data: `remind-later-${task}`
						        }
						      ]]
						    }
						  });			
		}, 1800000)
	}

	if(data == 'Tomorrow'){
		var start = days[(day.getDay() + 1) % 7]
		var next = days[(day.getDay() + 3) % 7]
		database.collection('notifications').add({
			notification: task,
			schedule : 'every-other-day',
			hasFinished: false,
			startDay: start,
			nextDay: next
		}).then(function() {
		    setupProgram().then(() => { bot.sendMessage(message.chat.id,`Added ${task} to be done every other day starting tomorrow!`)  }).catch(e => console.log(e))
				    
		})
		.catch(function(error) {
				    console.error("Error writing document: ", error);
		});
		
	}
	if(data == 'Daily' || data == 'Every-Other-Day' || data == 'Schedule'){
  	dates = data;
  	let canSetOptions = false;
    if(notifications.find(i => i.data.notification == task)){
    	return
    }
		if(data == 'Every-Other-Day'){
			 bot.sendMessage(message.chat.id,`Do you want to start taking ${task} today or tomorrow? `, {
				reply_markup: {
					inline_keyboard: [[
					    {
					        text: 'Today',
					        callback_data: 'Today'
					    },{
					        text: 'Tomorrow',
					        callback_data: 'Tomorrow'
					    }
					]]
				}
			});
		} else if ( data == 'Daily'){
				  var start = days[(day.getDay()) % 7]
				  var next = days[(day.getDay() + 1) % 7]
				  bot.sendMessage(message.chat.id,`Added ${notification} to be taken daily!`,)
			      database.collection('notificatison').add({
					    notification: task,
					    schedule : days,
					    hasFinished: false,
					    startDay: start,
					    nextDay: start
			      }).then(function() {

			      	    setupProgram().then(() => { }).catch(e => console.log(e))
					})
					.catch(function(error) {
					    console.error("Error writing document: ", error);
					});
		} else if ( data == 'Schedule'){
			console.log('start scheduling..')
		}
	}
	if(foundTask){
		bot.sendMessage(message.chat.id,`You finished ${foundTask.notification} right?`)
	}
});

// Crons

const warningCron = new CronJob('00 00 20 * * *', function() {
	var day = new Date();
	let tempDate = days[day.getDay()];
	notifications.forEach(i => {
		if(!i.data.hasFinished && i.data.nextDay == tempDate){
			bot.sendMessage(chatId,`REMINDER PLEASE TAKE ${i.data.notification}`, {
				reply_markup: {
					inline_keyboard: [[
					    {
					        text: `I've taken ${i.data.notification}.`,
					        callback_data: `finished-task-${i.data.notification}`
					    },{
					    	text: `Remind me later..`,
					        callback_data: `remind-later-${i.data.notification}`
					    }
					]]
				}
			});  
		}
	})
	if(notification.filter(i => i.data.nextDay == tempDate).length == 0 || notifications.filter(i => i.data.nextDay == tempDate && !i.data.hasFinished).length == 0){
		bot.sendMessage(chatId,`You have no remaining tasks for the day.`)
	}
	console.log('Reset all crons');
}, null, true, myTimezone);


const dailyCron = new CronJob('00 00 12 * * 0-6', () =>  {
		console.log('Starting Daily Cron')
		var day = new Date();
		let tempDate = days[day.getDay()];
		let startTime = new Date()
		checkNotifications().then( returned => setupnotificationsArray(returned))
				  .catch(e => console.log(e))
				  .then( next => {
					notifications.forEach(i => {
						if(!i.data.hasFinished && tempDate == i.data.nextDay){
							startJob(i.data.notification)
						}
					})
					if(notifications.filter(i => i.data.nextDay == tempDate).length == 0 || notifications.filter(i => i.data.nextDay == tempDate && !i.data.hasFinished).length == 0){
						bot.sendMessage(chatId,`Good morning! Today you have no tasks to do.`)
					}
					axios.get(`http://api.waqi.info/feed/${myCity.name}/?token=${airToken}`)
	.then(response => {
				getForecast(myCity, chatId)
	}).catch(function (error) {
		console.log(error);
	})
				}).catch(e => {
			console.log(e) 
			reject(e)
		})
	  	 
}, null, true, myTimezone);

/// Star work

setupProgram().then(() => { console.log('finished setup') }).catch(e => console.log(e))

console.log('bot started')
  var connectedString = `
  I've just come online. \n
  You may check what commands are availble using /commands.`

bot.sendMessage(chatId,connectedString);
dailyCron.start()
warningCron.start()