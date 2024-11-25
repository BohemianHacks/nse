require("bootstrap");
require("./style/style.scss");
window.p5 = new require("./js/p5.min.js");

// TO DO:

// GLOBAL VARIABLES OBJECT
window.gvs = {
    P : 12.5,
    Q : 0,
    x : 0.4,
    yB : 0.5,
    show_yB : false,
    show_labels : true,
    plot : {
        margins: [[80, 350], [80, 80]],
        labels: [["temperature (°C)", ""], ["benzene + water", "benzene mole fraction"]],
        domain: [0, 1, 0.2, 0.05],
        range: [100, 220, 20, 5],
    },
    intersection_point : 0.555,
    bubble_point : 156,
    T_initial : 120,
    T : 120,
    moles_liquid_water : 0.5,
    moles_liquid_benzene : 0.5,
    moles_vapor : 0,
    vapor_composition : 0.555,
    Q_subcooled: 0,
    Q_bubble: 0,
    Q_dew: 0,
};

const containerElement = document.getElementById("p5-container");

const sketch = (p) => {

    p.setup = function() {
        p.createCanvas(800, 530);
        p.noLoop();
        gvs.p = p;
        gvs.calcAll = require("./js/calcs.js");
        gvs.drawAll = require("./js/draw.js");
        require("./js/inputs.js");
        
        p.windowResized = function() {

        }
    };

    p.draw = function() {
        p.background(253);
        gvs.calcAll();
        gvs.drawAll(p);
    };

};

const P5 = new p5(sketch, containerElement);