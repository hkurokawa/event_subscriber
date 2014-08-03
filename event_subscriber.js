var twitter = require('twitter');
var credential = require('./credential');
const BOT_ID = 'event_subscribe';
const COMMAND_SUBSCRIBE = 'subscribe';
const COMMAND_UNSUBSCRIBE = 'unsubscribe';

var DEBUG = false;

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.lastIndexOf(str, 0) == 0;
  };
};

var processData = function(data) {
    var id        = ('user' in data && 'screen_name' in data.user) ? data.user.screen_name : null;
    var text      = ('text' in data) ? data.text.replace(new RegExp('^@' + BOT_ID + ' '), '') : '';
    var ifMention = ('in_reply_to_user_id' in data) ? (data.in_reply_to_user_id !== null) : false;

    if (!ifMention || id == BOT_ID || !id) return;

    if (text.startsWith(COMMAND_SUBSCRIBE + ' ')) {
        reply(id, "Subscribed: " + getKeywords(COMMAND_SUBSCRIBE, text));
        return;
    } else if (text.startsWith(COMMAND_UNSUBSCRIBE + ' ')) {
        reply(id, "Unsubscribed: " + getKeywords(COMMAND_UNSUBSCRIBE, text));
        return;
    }
    
    console.log('Unrecognized message: [' + id + '], [' + text + ']');
    reply(id, 'Unrecognized message: ' + text);
};

var getKeywords = function(cmd, text) {
    return text.substring(cmd.length).split('/ *, */');
};

var reply = function(id, text) {
    var msg = '@' + id + ' ' + text;
    if (DEBUG) {
        console.log('Reply Message> ' + msg);
    } else {
        bot.updateStatus(msg , function (data) {
            console.log(data);
        });
    }
};

// Main part
// Parse the arguments
DEBUG = process.argv.indexOf('-d') >= 0;
// Start the process
if (DEBUG) {
    console.log('Running in DEBUG mode.');
    var readline = require('readline');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.setPrompt('> ');
    rl.prompt();
    rl.on('line', function(text){
        processData({
            user: {
                screen_name: 'debug_user'
            },
            text: text,
            in_reply_to_user_id: 0
        });
        rl.prompt();
    }).on('exit', function(){
        console.log('exit.');
        process.exit(0);
    });
} else {
    var bot = new twitter(credential.twitter);
    bot.stream('user', function(stream) {
        stream.on('data', processData);
    });
}
