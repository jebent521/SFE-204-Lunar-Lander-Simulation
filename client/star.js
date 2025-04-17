
function generateBoxShadows(numShadows, xOffsetRange, yOffsetRange, color) {
  const boxShadows = [];
  for (let i = 0; i < numShadows; i++) {
    const xOffset = Math.floor(Math.random() * (xOffsetRange[1] - xOffsetRange[0] + 1)) + xOffsetRange[0];
    const yOffset = Math.floor(Math.random() * (yOffsetRange[1] - yOffsetRange[0] + 1)) + yOffsetRange[0];

    const boxShadow = `${xOffset}px ${yOffset}px ${color}`;
    boxShadows.push(boxShadow);
  }
  return boxShadows;
}

// Example usage:
const numShadows = 700;
const xOffsetRange = [0, 2000];
const yOffsetRange = [0, 2000];
const color = 'rgb(255, 255, 255)';

const boxShadowList = generateBoxShadows(numShadows, xOffsetRange, yOffsetRange, color);

//to see large list of stars in the console: uncomment the below
//console.log(`${boxShadowList}`);

const stars = document.getElementById("stars");
stars.style.width = "1px";
stars.style.height = "1px";
stars.style.background = "transparent";
stars.style.borderRadius = '50%';
stars.style.boxShadow = `${boxShadowList}`;
stars.style.animation = 'animStar 40s linear infinite';

const style = document.createElement('style');
document.head.appendChild(style);
const sheet = style.sheet;
sheet.insertRule(`#stars::after { width: 1px; height: 1px; background: transparent;
  border-radius: 50%; box-shadow: ${boxShadowList}; }`, sheet.cssRules.length);

const numShadows2 = 400;
const boxShadowList2 = generateBoxShadows(numShadows2, xOffsetRange, yOffsetRange, color);

const stars2 = document.getElementById("stars2");
stars2.style.width = "2px";
stars2.style.height = "2px";
stars2.style.background = "transparent";
stars2.style.borderRadius = '50%';
stars2.style.boxShadow = `${boxShadowList2}`;
stars2.style.animation = 'animStar 80s linear infinite';

const numShadows3 = 100;
const boxShadowList3 = generateBoxShadows(numShadows3, xOffsetRange, yOffsetRange, color);

const stars3 = document.getElementById("stars3");
stars3.style.width = "3px";
stars3.style.height = "3px";
stars3.style.background = "transparent";
stars3.style.borderRadius = '50%';
stars3.style.boxShadow = `${boxShadowList3}`;
stars3.style.animation = 'animStar 120s linear infinite';

const stars1clone = stars.cloneNode();
stars1clone.style.animationDelay = "-5s";
stars1clone.style.opacity = 100;
document.getElementById("AllStars").appendChild(stars1clone);

const stars2clone = stars2.cloneNode();
stars2clone.style.animationDelay = "-10s";
stars2clone.style.opacity = 100;
document.getElementById("AllStars").appendChild(stars2clone);

const stars3clone = stars3.cloneNode();
stars3clone.style.animationDelay = "-15s";
stars3clone.style.opacity = 100;
document.getElementById("AllStars").appendChild(stars3clone);


const starAnimation = document.querySelectorAll(".starAnimation");
for (var i = 0; i < starAnimation.length; i++) {
  starAnimation[i].style.animationPlayState = 'running';
}

function setAnimate(value) {
  for (var i = 0; i < starAnimation.length; i++) {
    var style = starAnimation[i].style;
    if (!value) {
      style.animationPlayState = 'paused';
      document.body.className = 'paused';
    } else {
      style.animationPlayState = 'running';
      document.body.className = '';
    }
  }
}