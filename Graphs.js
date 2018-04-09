/**
 * This File contains all of the extensions/implementations of the graph class
 */

function RectGraph(width, height, canvas){

	Graph.call(this, canvas);
	//RectGraph.prototype = Object.create(Graph.Prototype);
	//RectGraph.prototype.constructor = RectGraph;
	
	this.width = width;
	this.height = height;
	console.log(canvas.width);
	
	var radius = 22;
	var xStart = radius;
	var yStart = radius;
	// distances by which nodes are placed
	var xDist = (canvas.width - 2 * radius)/(width - 1);
	var yDist = (canvas.height - 2 * radius)/(height - 1);

	
	for(i=0; i<width; i++){
		for(j=0; j<height; j++){
			this.nodes.push(new Node(xStart + i*xDist, yStart + j*yDist, radius));
		}
	}
	
	debugger;
	
	this.addNeighborsByDistance(65);
}