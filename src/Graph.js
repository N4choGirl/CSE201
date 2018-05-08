/**
 * Robbie Ritchie, Nicole Roark
 * Dante Wu, Lei Liu
 * 
 * Dot Bomb
 * CSE201 
 * Group 16
 */

 module.exports = {
	 Graph : Graph
 }
 
/**
 * A graph is essentially a collection of nodes.
 * Which nodes are neighbors to each other relies on the Node class
 */
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
			//console.log(r);
			//console.log(g);
			//console.log(b);
			// Check difference
			keepOn=false;
			if(r + b + g > 30){
				keepOn = true;
			}
		}
		if(!keepOn){
			socket.emit('chat message', 'This color is unavailable');
		}
		return keepOn;
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
						//console.log(this.nodes[i].x, + ", "  + this.nodes[i
					}
				}
			}
		}
	};
	

}
