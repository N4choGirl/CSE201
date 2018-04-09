/**
 * Robbie Ritchie, Nicole Roark
 * Dante Wu, Lei Liu
 * 
 * Dot Bomb
 * CSE201 
 * Group 16
 */

/**
 * A graph is essentially a collection of nodes.
 * Which nodes are neighbors to each other relies on the Node class
 */
function Graph(canvas){
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.nodes = [];
	this.players = [];
	this.turnIndex = 0; // used to keep track of game
	this.splodeTimeOut = 500;
	this.timer = 0;
	this.animating = false;
	this.splodeList = [];
	
	
	/**
	 * Draws the graph to the given context
	 */
	this.draw = function(){
		
		this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
		
		//draw edges first
		
		for(i=0; i<this.nodes.length; i++){
			var tempNode = this.nodes[i];
			for(j=0; j<tempNode.neighbors.length; j++){
				var neighbor = tempNode.neighbors[j];
				ctx.beginPath();
				ctx.moveTo(tempNode.x, tempNode.y);
				ctx.lineTo(neighbor.x, neighbor.y);
				ctx.stroke();
			}
		}
		
		//draw nodes on top
		for(i=0; i<this.nodes.length; i++){
			this.nodes[i].draw(ctx);
		}
	};
	
	this.makeMove = function(x, y){
		//console.log("" + x + y);
		// check nodes for intersection
		for(i=0; i< this.nodes.length; i++){
			var node = this.nodes[i];
			// node intersects
			//debugger;
			if(node.contains(x,y)){
				debugger;
					if(	node.player == this.players[this.turnIndex] ||
						node.player == null){
							debugger;
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
		debugger;
		var node = this.splodeList.shift();
		//debugger;
		

		debugger;
		if(node.dotCount > node.neighbors.length){
			var neighInc = 0;
			
			while(node.dotCount > node.neighbors.length){
				node.dotCount = node.dotCount - node.neighbors.length;
				neighInc++;
			}
			
			for(i=0; i<node.neighbors.length; i++){
				var neigh = node.neighbors[i];
				neigh.dotCount = neigh.dotCount + neighInc;
				neigh.player = node.player;
				this.splodeList.push(neigh);
			}
		}


	};
	
	/**
	 * Goes through a graph's nodes and connects any nodes within dist of each other
	 * note: distance is between  nodes' centers 
	 */
	this.addNeighborsByDistance = function(dist){
		// double loop through nodes
		for(i=0; i<this.nodes.length; i++){
			for(j=0; j<this.nodes.length; j++){
				
				var dx = (this.nodes[i].x - this.nodes[j].x);
				var dy = (this.nodes[i].y - this.nodes[j].y);
				
				if(Math.sqrt(dx*dx + dy*dy) <= dist){
					this.nodes[i].addNeighbor(this.nodes[j]);
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
function Node(x,y,radius){
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.dotCount  = 0;
	this.neighbors = [];
	this.player = null;

	/**
	 * draws the node to the given context element of a canvas
	 */
	this.draw = function(context){
		if(this.player == null)
			context.fillStyle = "#d1d1d1";
		else
			context.fillStyle = this.player.color;
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
		context.fill(); // node color (inside)
		context.fillStyle = "#000000";
		context.stroke(); // outline
		context.font = "12px Arial";
		context.fillText("" + this.dotCount, this.x-3, this.y+4);
		//context.fillText("" + this.neighbors.length, this.x-3, this.y+13);
	};
	
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
					this.neighbors.push(node);
				}
				if(!node.hasNeighbor(this)) {
					node.neighbors.push(this);
				}
			}
		}
	};
	
	this.removeNeighbor = function(node) {
		if(node!=null){
			if(this.hasNeighbor(node)) {
				this.neighbors.splice(this.neighbors.indexOf(node),1);
			}
			if(node.hasNeighbor(this)) {
				node.neighbors.splice(node.neighbors.indexOf(this),1);
			}
		}
	};
	
	this.hasNeighbor = function(node) {
		if(node!=null) {
			for(var i=0;i<this.neighbors.length;i++){
				if(this.neighbors[i].equals(node)) {
					return true;
				}
			}
		}
		return false;
//		if(this.neighbors.indexOf(node)==-1) {
//			return false;
//		}
//		return true;
	};
	
	this.equals = function(node) {
		if(node!=null) {
			if(this.x==node.x) {
				if(this.y==node.y) {
					return true;
				}
			}
		}
		return false;
	};

	this.toString = function() {
		document.write("("+this.x+","+this.y+") ");
	};
}

function Player(color){
	this.color = color;
}

function wait(ms){
	   var start = new Date().getTime();
	   var end = start;
	   while(end < start + ms) {
	     end = new Date().getTime();
	   }
}