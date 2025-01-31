//png is a placeholder, obviously not the final product
const image=document.getElementById('image');

let position = 0;//center position for now
let moveUp = true;
const speed = 2;

function moveLander(){
if(moveUp){
    position -= speed;
}
else{
    position += speed;
}
image.style.transform = 'translateY(${position}px';
//makes the image move to new position
}
//Lets spacebar move lander up, later will also lower fuel ammount
window.addEventListener('keydown', function(event){
    if(event.code == 'Space'){
        moveUp = true;
    }
});
//I can't pull up the server that this is on, so no promises that this actually runs, but it should allow for a goofy png lander to appear and move slowly down, and up if you hold space.
