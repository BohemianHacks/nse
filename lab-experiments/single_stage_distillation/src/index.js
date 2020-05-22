import './style/style.scss';
import 'bootstrap';
import * as p5 from 'p5';
window.p5 = p5;
import './grafica/grafica.js';
import './grafica/plotFunctions.js';
import * as setup from './js/setup.js';
import * as loop from './js/loop.js';
import * as Separator from './js/Separator.js';

/******** ADD HTML FROM HTML FOLDER ********/
const html = require('./html/main.html').toString();
const doc = document.createElement('div');
doc.id = "main-application-wrapper";
doc.innerHTML = html;
document.body.appendChild(doc);

window.separator = Separator();

window.userInputs = {
  PressureController: {
    auto: false,
    lift: separator.lift,
    Kc: 0,
    Tau: 3600
  },

  TemperatureController: {
    auto: false,
    power: separator.Q,
    Kc: 0,
    Tau: 3600
  },
  
  LevelController: {
    auto: false,
    flowRate: separator.L,
    Kc: 0,
    Tau: 3600
  },
}

let animation = (sk) => {
  setup(sk, 5);
  loop(sk);
}


let P5 = new p5(animation);