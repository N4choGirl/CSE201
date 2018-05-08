
var handler = function(req, res) {
    fs.readFile('./index.html', function (err, data) {
        if(err) throw err;
        res.writeHead(200);
        res.end(data);
    });
}
var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var port = 3000;
var fs = require('fs');
var Graph = require('./src/Graph.js').Graph;
var RectGraph = require('./src/Boards.js').RectGraph;
var Player = require('./src/Player.js').Player;
var Node = require('./src/Node.js').Node;


var graph = new RectGraph(8,8);
var id = 1;
var roomPlayers = [];
var sockets = [];
var maxNameLength = 30;
var gameQueue = [];
var gameInProgress = false;
var maxPlayersPerGame = 8;


app.listen(port);

io.sockets.on('connection', function (socket) {
	var newPlayer = new Player(getRandomColor(), id++);
	//console.log(newPlayer.color);
	roomPlayers.push(newPlayer);
	sockets.push(socket);
	socket.emit('welcome', newPlayer.id);
	socket.emit('chat message', 'Welcome to Dot Bomb! type /help to see a list of commands!');
	io.sockets.emit('playerUpdate', roomPlayers);

	
	socket.emit('graphUpdate', graph);
	
	
	
	
	
	
	socket.on('disconnect', function() {
		var i = sockets.indexOf(socket);
		if(i > -1){
			//console.log('disconnected: ' + roomPlayers[i].name);
			
			var inGameIndex = graph.players.indexOf(roomPlayers[i]);
			if(inGameIndex > -1){ // player is in the game
				//console.log('game player left');
				// TODO decide how to handle this situation
				graph.players.splice(inGameIndex,1);
			}
			
			sockets.splice(i,1);
			roomPlayers.splice(i,1);
			io.sockets.emit('playerUpdate', roomPlayers);
			io.emit('graphUpdate', graph);

		} else {
			//console.log('error in disconnect event');
		}
	});
	
	
	/*
	*	Chat message recieved
	*/
	socket.on('chat message', function(msg){
		if(msg.content.charAt(0) == '/'){ // chat command recognized
			
			//console.log(msg);
			var params = msg.content.split(' ');
			
			var command = params[0].slice(1);
			
			switch (command) {
				/*
				* Name change command
				*/
				case 'name':
					var newName;
					try {
						if(params[1]){ // ensure a name was given
							var newName = params[1];
							
							for(var j=2; j<params.length; j++){ // append parts of the name seperated by spaces
								newName = newName + " " + params[j];
							}
							
							if(newName.length > maxNameLength){
								throw 'tooLong'
							} else if(newName.length == 0){
								throw 'noName'
							}
							
							//console.log(newName);
							var thisPlayer = getPlayerById(msg.playerId);
							var oldName = thisPlayer.name;
							thisPlayer.name = newName;
							
							io.emit('chat message', 'Server: ' + oldName + ' has changed their name to ' + newName);
							io.emit('playerUpdate', roomPlayers); 
							io.emit('graphUpdate', graph);
						} else { // no name was given
							throw 'noName';
							
						}
					}
					catch(err) {
						if(err == 'noName'){
							socket.emit('chat message', 'error: enter a name parameter e.g. /name John');
						} else if(err == 'tooLong'){
							socket.emit('chat message', 'error: please enter a name under ' + maxNameLength + ' characters long'); 
						}
					}
					break;
				case 'help':
					socket.emit('chat message', 'Commands:');
					socket.emit('chat message', '/color [#FFFFFF] changes your color to the given hex color');
					socket.emit('chat message', '/join adds you to the queue to join the game');
					socket.emit('chat message', '/leave removes you from the queue to join the game');
					socket.emit('chat message', '/name [newName]   change your name');
					socket.emit('chat message', '/position shows your current position in queue');
					socket.emit('chat message', '/tutorial will give you a simple game walkthrough');
					break;
				case 'join':
					try{
						var i = sockets.indexOf(socket);
						var j = gameQueue.indexOf(roomPlayers[i]);
						//console.log(i);
						//console.log(j);
						
						if( j == -1){
							gameQueue.push(roomPlayers[i]);
							io.emit('chat message', roomPlayers[i].name + ' has joined the queue at position ' + gameQueue.length );
							// TODO display where in queue you are
						} else {
							throw 'inQueue';
						}
					} catch (err) {
						if(err == 'inQueue'){
							socket.emit('chat message', 'already in queue');
						}
					}
					break;
				case 'leave' :
					try{
						var i = sockets.indexOf(socket);
						var j = gameQueue.indexOf(roomPlayers[i]);	
						
						if( j > -1){
							gameQueue.splice(j, 1);
							io.emit('chat message', roomPlayers[i].name + ' has left the queue, new queue length: ' + gameQueue.length);
						} else {
							throw 'notInQueue';
						}
					} catch (err) {
						if(err == 'notInQueue'){
							socket.emit('chat message', 'not in queue');
						}
					}
					break;
					
				case 'position' :
					try {
						var i = sockets.indexOf(socket);
						var j = gameQueue.indexOf(roomPlayers[i]);
						if(j == -1){
							throw 'notInQueue';
						}
						socket.emit('chat message', 'You are position ' + (j+1) + ' out of ' + gameQueue.length + ' in queue');
						
					} catch(err) {
						if(err == 'notInQueue'){
							socket.emit('chat message', 'not in queue');
						}
					}
					
					break;
				case 'start' :
					try{
						if(gameInProgress){
							return; // TODO throw something here
						}
						// fill graph with players
						var message = 'Adding: ';
						
						//console.log(graph.players);
						//console.log(gameQueue);
						if(gameQueue.length < 2){
							throw 'notEnoughPlayers'
						}
						var gameNum = 1;
						while(graph.players.length <= 8 && gameQueue.length > 0){
							// TODO check for different colors
							var currPlayer = gameQueue.shift();
							currPlayer.color = assignColor(gameNum);
							message = message + currPlayer.name;
							//console.log(currPlayer.name);
							if(!(graph.players.length == 8 || gameQueue.length == 0)){
								message = message + ', ';
							}
							graph.players.push(currPlayer);
							gameNum++;
						}
						
						message = message + ' to the game';
						io.emit('chat message', message);
						io.emit('chat message', 'Assigning players new colors');
						io.emit('playerUpdate', roomPlayers); 

						
						graph.active = true;
						gameInProgress = true;
						io.emit('graphUpdate', graph);
					} catch(err) {
						if(err == 'notEnoughPlayers'){
							io.emit('chat message', 'Not enough players (' + gameQueue.length + ') in queue to start the game');
						}
					}
					break;
				case 'end' :
					if(!gameInProgress){
						return; //TODO throw something?
					}
					io.emit('chat message', 'The game has been reset'); // TODO by who?
					resetGame(50);
					break;
				
				case 'color':
					//console.log('color command');
					try{
						var i = sockets.indexOf(socket);
						var player = roomPlayers[i];
						
						

						var color = params[1];
						if(color == null)
							throw 'noColor';
						if(!isHex(color))
							throw 'invalid';
						
						//if(graph.checkColor(color)) {
							// no problems, change the color
							//console.log(color);
							player.color = color;
							io.emit('playerUpdate', roomPlayers); 
							io.emit('graphUpdate', graph);
						
						/*
						} else {
							throw 'colorTooClose';
						}
						*/
						
						
					} catch (err){
						if(err === 'colorTooClose'){
							socket.emit('chat message', "That color is too close to another player's");
						} else if(err == 'invalid'){
							socket.emit('chat message', "Color provided is invalid, please give hex in the form #000000");
						} else if(err == 'noColor'){
							socket.emit('chat message', "No color provided");
						}
					}
					break;
				case 'tutorial':
					socket.emit('chat message', '*******************************************************************');
					socket.emit('chat message', 'Type /join to join the queue');
					socket.emit('chat message', 'Once enough people are in the queue, type /start to start the game.');
					socket.emit('chat message', 'The goal is to fill the entire board with your player color.');
					socket.emit('chat message', 'When it is your turn, click on a circle that is either empty');
					socket.emit('chat message', 'or is one you control. Each time you click on a circle, the');
					socket.emit('chat message', 'number of dots in that circle increses by 1. When the amount');
					socket.emit('chat message', 'of dots in a circle is greater than the amount of neighbors it has,');
					socket.emit('chat message', 'the dot will overflow, taking over the surrounding circles and');
					socket.emit('chat message', 'placing one dot in each. If at any point you would like to leave');
					socket.emit('chat message', 'the game, you can typ /end to end the entire game or you can simply');
					socket.emit('chat messgae', 'reload your web page so that the other players can finish the game.');
					socket.emit('chat message', '*******************************************************************');
				
					break;
				default:
					socket.emit('chat message', 'Unrecognized command');
					break;
				
			}
			
		} // end commands
		else{ // a normal chat message
			io.emit('chat message', getPlayerById(msg.playerId).name + ': ' + msg.content);
			io.emit('graphUpdate', graph);
		}
	});
	
	/*
	* Click event
	*/
    socket.on("click", function(coord, clickId) {
		
		if(!gameInProgress){
			return;
		}
		
		if(graph.players[graph.turnIndex].id == clickId){
			graph.makeMove(coord.x, coord.y);
			var index = graph.getWinner();
			if(index > -1){
				gameWon(graph.players[index]);
			}
			io.sockets.emit('graphUpdate', graph);
			var winnerFound = false;
			var interval = setInterval(function(){
				if(graph.splodeList.length > 0 && !winnerFound){
					graph.updateNode();
					
					index = graph.getWinner;
					if(index > -1){
						winnerFound = true;
						//console.log('Winner: ' + graph.players[index].name);
						gameWon(graph.players[index]);

					}
					
					io.sockets.emit('graphUpdate', graph);
				}
				else{
					clearInterval(interval);
				}
			}, 200);
		}
    });
});

/**
Sends text (no server nameplate) to a socket
**/
function serverMessage(socket, message){
	socket.emit('chat message', message);
}

function getQueuePosition(socket){
	var i = sockets.indexOf(socket);
	var thePlayer;
	if(i > -1)
		thePlayer = roomPlayers[i];
	else{
		//console.log('queuePosition error ');
		return;
	}
	
	return gameQueue.indexOf(thePlayer);
}

function gameWon(winner){
	io.emit('chat message', winner.name + ' has won!');
	io.emit('chat message', 'resetting game in 5 seconds');
	resetGame(5000);
}

function resetGame(timeout){
	setTimeout(function() {
		gameInProgress = false;
		graph = new RectGraph(8,8);
		io.emit('playerUpdate', roomPlayers); 
		io.emit('graphUpdate', graph);
		io.emit('chat message', 'ready to start a new game');
	}, timeout);
}




function assignColor(num) {
	if(num==1) return '#DD0000'; // red
	if(num==4) return '#FF8C00'; // orange
	if(num==2) return '#FFFF00'; // yellow
	if(num==5) return '#00E51A'; // green
	if(num==3) return '#000CFF'; // dark blue
	if(num==6) return '#A000DB'; // purple
	if(num==7) return '#FF00E9'; // pink
	if(num==8) return '#00B6FF'; // light blue
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getPlayerById(id) {
	for(var j=0; j<roomPlayers.length; j++){
		if(roomPlayers[j].id == id)
			return roomPlayers[j];
	}
	return null;

}

function isHex(str) {
	return str.match(/^#[a-f0-9]{6}$/i) != null;
}