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
function Graph(){
	this.nodes = [];
	this.players = [];
	
	
	/**
	 * Draws the graph to the given context
	 */
	this.draw = function(context){
		//draw edges first
		
		for(i=0; i<this.nodes.length; i++){
			var tempNode = this.nodes[i];
			for(j=0; j<tempNode.neighbors.length; j++){
				var neighbor = tempNode.neighbors[j];
				context.beginPath();
				context.moveTo(tempNode.x, tempNode.y);
				context.lineTo(neighbor.x, neighbor.y);
				context.stroke();
			}
		}
		
		//draw nodes on top
		for(i=0; i<this.nodes.length; i++){
			this.nodes[i].draw(context);
		}
	}
	
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

	/**
	 * draws the node to the given context element of a canvas
	 */
	this.draw = function(context){
		context.fillStyle = "#FF0000";
		//context.fillStyle = this.player.color;
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
		context.fill();
		context.fillStyle = "#000000";
		context.font = "12px Arial";
		context.fillText("" + this.dotCount, this.x-3, this.y+3);
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
			if(!this.hasNeighbor(node)) {
				this.neighbors.push(node);
			}
			if(!node.hasNeighbor(this)) {
				node.neighbors.push(node);
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
		
		if(!this.neighbors.indexOf(node)==-1) {
			this.removeNeighbor(node);
		}
		if(node!=null){
			if(!node.neighbors.indexOf(this)==-1) {
				node.removeNeighbor(this);
			}
		}
	};
}