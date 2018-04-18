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
var graph = new Graph();
var id = 0;

graph.nodes.push(new Node(30,30,20,0));
graph.nodes.push(new Node(120,30,20,1));
graph.nodes.push(new Node(30,120,20,2)); 
graph.nodes[0].addNeighbor(graph.nodes[1]);
graph.addNeighborsByDistance(61);


app.listen(port);

io.sockets.on('connection', function (socket) {
	graph.players.push(new Player(getRandomColor(), id));
	socket.emit('welcome', id);
	id++;
	
	socket.emit('graphUpdate', graph);

    socket.on("click", function(coord, id) {
		if(graph.players[graph.turnIndex].id == id){
			console.log(coord);
			graph.makeMove(coord.x, coord.y);
			socket.emit('graphUpdate', graph);
		}
    });
});


function RectGraph(width, height){

	Graph.call(this);
	//RectGraph.prototype = Object.create(Graph.Prototype);
	//RectGraph.prototype.constructor = RectGraph;
	
	this.width = width;
	this.height = height;

	
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
function Graph(){
	this.canvas;
	this.ctx;
	this.nodes = [];
	this.players = [];
	this.turnIndex = 0; // used to keep track of game
	this.splodeTimeOut = 500;
	this.timer = 0;
	this.animating = false;
	this.splodeList = [];
	
	this.getNodeByID = function(id) {
		for(i=0;i<this.nodes.length;i++){
			var node = this.nodes[i];
			if(node.id==id) {
				return node;
			}
		}
	}
	
	/**
	 * Draws the graph to the given context

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
	*/
	
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
function Node(x,y,radius, id){
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.id = id;
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
			if(this.id==node.id) {
				return true;
			}
		}
		return false;
	};

	this.toString = function() {
		document.write("("+this.x+","+this.y+") ");
	};
}

function Player(color, id){
	this.color = color;
	this.id = id;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}