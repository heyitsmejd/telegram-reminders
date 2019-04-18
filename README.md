# telegram-reminders

This is a simplified version of a private telegram bot that sends reminders for any task you desire based on schedules. Can run in any timezone. Uses Firebase for real time storage.

## Getting Started
To start the reminder, visit the [BotFather](https://telegram.me/BotFather) and setup your bot. 

Edit the app.js to contain

```
const telegramToken = 'YOUR-TELEGRAM-BOT-TOKEN'
```

Next, run app.js, add your bot on telegram and send a message

```
/chatID
```

This will let you know your chat Id, next make sure to update your chat id.  
```
const chatId = 'YOUR-CHAT-ID'
```

This bot uses DarkSky API to get free weather information, sign up at [DarkSky](https://darksky.net/dev).  
Once you've gotten your api token save it  
```
const darksky = 'https://api.darksky.net/forecast/YOUR-DARKSKY-TOKEN/'
```

Next, sign up for [Air Quality Index](https://aqicn.org/api/) to get updated air quality forecasts.  
Once done, make sure to save your token  
```
const airToken = 'YOUR-AIR-INDEX-TOKEN'
```

Sign up for [Firebase](https://firebase.google.com/), and download your credentials to ./firebase.json  
and update your databaseURL  
```
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'YOUR-FIREBASE-URL'
}); 
```
Finally, adjust your preferred city and timezone  
```
const myTimezone = 'YOUR-TIMEZONE' // 'Asia/Bangkok'
const myCity = { // Adjust to your preferred city.
	name: 'Bangkok',
	lat: '13.7563',
	long: '100.5018'
}
```

