/**
 * Robbie Ritchie, Nicole Roark
 * Dante Wu, Lei Liu
 * 
 * Dot Bomb
 * CSE201 
 * Group 16
 */


class Board {
	
	
	
	
}


class User {
	
	constructor(name, color) {
		
		this.name = name;
		this.color = color;
		
	}
	
	
}


/** 
 * Nodes should be able to have a list of neighbors, check if a node is one of 
 * their neighbors, add a neighbor, and remove a neighbor. It should also
 * keep track of how many dots are currently in the Node as well as which 
 * User is occupying the Node.
 */

class Node {
	
	//Used to create a new circular node with 
	//center coordinates (x,y) and radius r
	constructor(x, y, r) {
		
		this.x = x;
		this.y = y;
		this.r = r;
		this.neighbors = [];
		this.dotCount = 0;
		
	}
	
	addNeighbor(node) {
		
		if(!this.hasNeighbor(node)) {
			this.neighbors.push(node);
		}
		
		if(!node.hasNeighbor(this)) {
			node.neighbors.push(node);
		}
		
	}
	
	removeNeighbor(node) {
		
		if(this.hasNeighbor(node)) {
			this.neighbors.splice(this.neighbors.indexOf(node),1);
		}
		
		if(node.hasNeighbor(this)) {
			node.neighbors.splice(node.neighbors.indexOf(this),1);
		}
		
	}
	
	hasNeighbor(node) {
		
		if(!this.neighbors.indexOf(node)==-1) {
			this.removeNeighbor(node);
		}
		if(!node.neighbors.indexOf(this)==-1) {
			node.removeNeighbor(this);
		}
		
	}
	
}











