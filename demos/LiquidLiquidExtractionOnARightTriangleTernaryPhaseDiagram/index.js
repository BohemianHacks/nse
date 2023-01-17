

window.g = {
  cnv: undefined,
 
  gridTruth: false,
  compTruth: false,
  pointType_2 : 'plot-points',

  radius: 8,
  points: [],
  nP: 1,
  dragPoint: null,

  
  R : [1,-100], // m and b values for right edge of triangle
}


function setup() {
  g.cnv = createCanvas(700, 600);

  g.cnv.parent("graphics-wrapper");

  document.getElementsByTagName("main")[0].remove();
  for (let i = 0; i < g.nP; i++) {
    g.points.push(createVector(200, 350));
  }

}

function draw() {
  background(250);
  triangleDraw();
 
 
 
  
}

// For determining equilateral or right triangle
// const triangleType = document.getElementById('triangle-type').children;

// // Determines which radio button is selected
// for (let i = 0; i < triangleType.length; i++) {
//   triangleType[i].addEventListener("click", function () {
//     for (let j = 0; j < triangleType.length; j++) {
//       triangleType[j].classList.remove("selected");
//     };
//     triangleType[i].classList.add("selected");
//     g.triangle = triangleType[i].value;
//     switch (g.triangle) {
//       case 'right-triangle':
//         g.points[0].x = 200;
//         g.points[0].y = 350;
//         break;
//       case 'equilateral-triangle':
//         g.points[0].x = 300;
//         g.points[0].y = 305;
//         break;
//     }
//   });
// };

const pointType = document.getElementById("point-type").children;
const gridLines = document.getElementById("grid-lines");
const carrierComp = document.getElementById("carrier-compositions");

gridLines.addEventListener("change", () => {
  g.gridTruth = gridLines.checked;
});
carrierComp.addEventListener("change", () =>{
  g.compTruth = carrierComp.checked;
});

for(let i = 0; i < pointType.length; i++){
  pointType[i].addEventListener("click",function (){
    for(let j = 0; j < pointType.length; j++){
      pointType[j].classList.remove("selected");
    };
    pointType[i].classList.add("selected");
    g.pointType_2 = pointType[i].value;
  });
};


// For manipulating the position of dot within the triangle
function mousePressed() {
  for (let i = g.points.length - 1; i >= 0; i--) {
    const isPressed = inCircle(g.points[i], g.radius);
    if (isPressed) {
      g.dragPoint = g.points.splice(i, 1)[0];
      g.points.push(g.dragPoint);

    }
  }
}
function mouseDragged() {
  g.dragPoint.x = mouseX;
  g.dragPoint.y = mouseY;
}

function mouseReleased() {
  g.dragPoint = null;
}
function inCircle(pos, radius) {
  return dist(mouseX, mouseY, pos.x, pos.y) < radius;
}


// Copied from Mathematica's source code
const phaseInfo = [[0.1, 0], [0.1021, 0.05104], [0.105, 0.098], [0.108, 0.1422], [0.113, 0.183], [0.1181, 0.22], [0.125, 0.254], [0.132, 0.2853], [0.14, 0.313], [0.149, 0.338], [0.159, 0.36], [0.17, 0.379], [0.181, 0.396], [0.194, 0.4093], [0.2082, 0.42], [0.222, 0.429], [0.2382, 0.435], [0.254, 0.438], [0.271, 0.44], [0.29, 0.438], [0.309, 0.435], [0.329, 0.429], [0.3503, 0.422], [0.372, 0.4123], [0.395, 0.4], [0.419, 0.387], [0.444, 0.371], [0.4703, 0.354], [0.497, 0.335], [0.525, 0.315], [0.554, 0.292], [0.584, 0.269], [0.615, 0.244], [0.647, 0.217], [0.68, 0.19], [0.714, 0.161], [0.749, 0.131], [0.785, 0.099], [0.8231, 0.067], [0.861, 0.034], [0.9, 0.]];
// Adds additional points to help the resolution on whether or not the dot is within the phase envelope
for (let i = 0; i < phaseInfo.length - 1; i += 2) {
  let x, y;
  x = phaseInfo[i][0] + 1 / 2 * (phaseInfo[i + 1][0] - phaseInfo[i][0]);
  y = phaseInfo[i][1] + 1 / 2 * (phaseInfo[i + 1][1] - phaseInfo[i][1]);
  phaseInfo.splice(i + 1, 0, [x, y]);
}
