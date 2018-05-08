/**
 * Robbie Ritchie, Nicole Roark
 * Dante Wu, Lei Liu
 * 
 * Dot Bomb
 * CSE201 
 * Group 16
 */

 module.exports = {
	 Player : Player
 }
 
function Player(color, id){
	this.color = color;
	this.id = id;
	this.name = 'Player ' + id;
}
