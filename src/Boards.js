/**
 * This File contains all of the extensions/implementations of the graph class
 */

module.exports = {
	RectGraph: RectGraph
}

var Graph = require('./Graph.js').Graph;
var Node = require('./Node.js').Node;

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
