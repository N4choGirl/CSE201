
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
	var newPlayer = new Player(graph.checkColor(getRandomColor()), id++);
	console.log(newPlayer.color);
	roomPlayers.push(newPlayer);
	sockets.push(socket);
	socket.emit('welcome', newPlayer.id);
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
			console.log('error in disconnect event');
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
					socket.emit('chat message', '/name @newName   change your name');
					break;
				case 'joinQueue':
					try{
						var i = sockets.indexOf(socket);
						var j = gameQueue.indexOf(roomPlayers[i]);
						console.log(i);
						console.log(j);
						
						if( j == -1){
							gameQueue.push(roomPlayers[i]);
							socket.emit('chat message', 'You are position ' + gameQueue.length + ' in queue');
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
				case 'leaveQueue' :
					try{
						var i = gameQueue.indexOf(socket);
						
						if( i > -1){
							gameQueue.splice(i, 1);
						} else {
							throw 'notInQueue';
						}
					} catch (err) {
						if(err == 'notInQueue'){
							socket.emit('chat message', 'not in queue');
						}
					}
					break;
				case 'startGame' :
					try{
						if(gameInProgress){
							return; // TODO throw something here
						}
						// fill graph with players
						var message = 'Adding: ';
						
						console.log(graph.players);
						console.log(gameQueue);
						if(gameQueue.length < 2){
							throw 'notEnoughPlayers'
						}
						while(graph.players.length <= 8 && gameQueue.length > 0){
							// TODO check for different colors
							var currPlayer = gameQueue.shift();
							message = message + currPlayer.name;
							console.log(currPlayer.name);
							if(!(graph.players.length == 8 || gameQueue.length == 0)){
								message = message + ', ';
							}
							graph.players.push(currPlayer);
						}
						
						message = message + ' to the game';
						io.emit('chat message', message);
						
						
						graph.active = true;
						gameInProgress = true;
						io.emit('graphUpdate', graph);
					} catch(err) {
						if(err == 'notEnoughPlayers'){
							io.emit('chat message', 'Not enough players (' + gameQueue.length + ') in queue to start the game');
						}
					}
					break;
				case 'endGame' :
					if(!gameInProgress){
						return; //TODO throw something?
					}
					io.emit('chat message', 'The game has been reset'); // TODO by who?
					resetGame(50);
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
		console.log('queuePosition error ');
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


function RectGraph(rows, columns){

	Graph.call(this);

	// distances by which nodes are placed
	var xDist = 100/(rows + 1);
	var yDist = 100/(columns + 1);
	var dist = Math.min(xDist, yDist);
	var xStart = dist;
	var yStart = dist;
	var radius = dist/3;
	
	var count = 0;
	for(i=0; i<rows; i++){
		for(j=0; j<columns; j++){
			this.nodes.push(new Node(xStart + i*xDist, yStart + j*yDist, radius, count));
			count++;
		}
	}
	
	
	
	this.addNeighborsByDistance(dist + 1);
}
function Graph(){
	this.nodes = [];
	this.players = [];
	this.turnIndex = 0; // used to keep track of game
	this.splodeList = [];
	this.active = false;
	
	this.checkColor = function(hexNum){ //hexNum is in hex but without the '#'
	// get red/green/blue int values of hex1
		var r1 = parseInt(hexNum.substring(1, 3), 16);
		var g1 = parseInt(hexNum.substring(3, 5), 16);
		var b1 = parseInt(hexNum.substring(5, 7), 16);
		var keepOn = true;
		for(var i=0;keepOn && this.players.length>i;i++) {
			var tempPlayer = this.players[i];
			var tempHex = tempPlayer.color.substring(1);
			// get red/green/blue int values of hex2
			var r2 = parseInt(tempHex.substring(1, 3), 16);
			var g2 = parseInt(tempHex.substring(3, 5), 16);
			var b2 = parseInt(tempHex.substring(5, 7), 16);
			// calculate differences between reds, greens and blues
			var r = Math.abs(r1 - r2);
			var g = Math.abs(g1 - g2);
			var b = Math.abs(b1 - b2);
			console.log(r);
			console.log(g);
			console.log(b);
			// Check difference
			keepOn=false;
			if(r>=80 || g>=80 || b>=80){
				keepOn = true;
			}
		}
		if(!keepOn){
			hexNum = getRandomColor();
			hexNum = this.checkColor(hexNum);
		}
		return hexNum;
	}
	
	this.addPlayer = function(newPlayer){
		var index = this.players.indexOf(newPlayer);
		//console.log(index);
		if(index == -1){
			this.players.push(newPlayer);
		}
	};
	this.removePlayer = function(toRemove){
		var index = this.players.indexOf(toRemove);
		if(index > -1){
			this.players.splice(index, 1);
		}
	};
	
	/**
		Checks if the game has a winner yet
		returns -1 if no winner
		returns the index of the winner in graph.players
	**/
	this.getWinner = function(){
		var tempPlayer = this.nodes[0].player;
		if(tempPlayer == null)
			return -1; 
		
		for(var l=1; l<this.nodes.length; l++){
			var tempNode = this.nodes[l];
			if(tempNode.player != tempPlayer)
				return -1;
		}
		//console.log("Player: " + tempPlayer);
		return this.players.indexOf(tempPlayer);
	};
	
	this.getNodeByID = function(id) {
		for(i=0;i<this.nodes.length;i++){
			var node = this.nodes[i];
			if(node.id==id) {
				return node;
			}
		}
	}
	

	
	this.makeMove = function(x, y){
		//console.log("" + x + y);
		// check nodes for intersection
		for(i=0; i< this.nodes.length; i++){
			var node = this.nodes[i];
			// node intersects
			//debugger;
			if(node.contains(x,y)){
					if(	node.player == this.players[this.turnIndex] ||
						node.player == null){
							node.dotCount++;
							node.player = this.players[this.turnIndex];
							this.splodeList.push(node);
							this.updateNode();
							this.turnIndex = (this.turnIndex + 1)%this.players.length;
					}
			}
				
		}
	};
	
	this.updateNode = function (){
		var node = this.splodeList.shift();
		//console.log("node: " + node);
		//console.log("neigh: " + node.neighbors);
		if(node.dotCount > node.neighbors.length){
			var neighInc = 0;
			
			while(node.dotCount > node.neighbors.length){
				node.dotCount = node.dotCount - node.neighbors.length;
				neighInc++;
			}
			
			//console.log("start");
			
			//console.log(node.neighbors.length);
			for(j=0; j<node.neighbors.length; j++){
				//console.log(j);
				var neigh = this.getNodeByID(node.neighbors[j]);
				//console.log(j);
				neigh.dotCount = neigh.dotCount + neighInc;
				neigh.player = node.player;
				this.splodeList.push(neigh);
			}
			
			//console.log("end");
			//console.log(this.getWinner());
			//console.log("");
		}


	};
	
	/**
	 * Goes through a graph's nodes and connects any nodes within dist of each other
	 * note: distance is between  nodes' centers 
	 */
	this.addNeighborsByDistance = function(distance){
		// double loop through nodes
		for(i=0; i<this.nodes.length; i++){
			for(j=0; j<this.nodes.length; j++){
				if( j != i) {
					var node1 = this.nodes[i];
					var node2 = this.nodes[j];
					var dx = (this.nodes[i].x - this.nodes[j].x);
					var dy = (this.nodes[i].y - this.nodes[j].y);
					
					if(Math.sqrt(dx*dx + dy*dy) <= distance){
						this.nodes[i].addNeighbor(this.nodes[j]);
						//Console.log(this.nodes[i].x, + ", "  + this.nodes[i
					}
				}
			}
		}
	};
	

}


/** 
 * Nodes should be able to have a list of neighbors, check if a node is one of 
 * their neighbors, add a neighbor, and remove a neighbor. It should also
 * keep track of how many dots are currently in the Node as well as which 
 * User is occupying the Node.
 */
function Node(x,y,radius, id){
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.id = id;
	this.dotCount  = 0;
	this.neighbors = [];
	this.player = null;


	
	this.contains = function(x, y){
		var dx = this.x - x;
		var dy = this.y - y;
		if(Math.sqrt(dx*dx + dy*dy) < this.radius)
			return true;
		return false;
	}
	
	this.addNeighbor = function(node) {
		if(node!=null){
			if(!node.equals(this)){
				if(!this.hasNeighbor(node)) {
					this.neighbors.push(node.id);
				}
				if(!node.hasNeighbor(this)) {
					node.neighbors.push(this.id);
				}
			}
		}
	};
	
	this.removeNeighbor = function(node) {
		if(node!=null){
			if(this.hasNeighbor(node)) {
				this.neighbors.splice(this.neighbors.indexOf(node.id),1);
			}
			if(node.hasNeighbor(this)) {
				node.neighbors.splice(node.neighbors.indexOf(this.id),1);
			}
		}
	};
	
	this.hasNeighbor = function(node) {
		if(node!=null) {
			for(var i=0;i<this.neighbors.length;i++){
				if(this.neighbors[i] == node.id) {
					return true;
				}
			}
		}
		return false;
	};
	
	this.equals = function(node) {
		if(node!=null) {
			if(this.id==node.id) {
				return true;
			}
		}
		return false;
	};

	this.toString = function() {
		//document.write("("+this.x+","+this.y+") ");
	};
}

function Player(color, id){
	this.color = color;
	this.id = id;
	this.name = 'Player ' + id;
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