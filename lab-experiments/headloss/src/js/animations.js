export function switchLogic(elts) {
  const switchX = elts.switchElt.getAttribute("x");
  const switchY = elts.switchElt.getAttribute("y");
  const destinationX = 108.44429;
  const destinationY = 32.344028;
  const switchTransform = elts.switchElt.getAttribute("transform");
  const destinationTransform = "rotate(38)";

  elts.switchG.addEventListener("click", () => {
    if (state.switchOn === false) {
      elts.switchElt.setAttribute("x", destinationX);
      elts.switchElt.setAttribute("y", destinationY);
      elts.switchElt.setAttribute("transform", destinationTransform);
      state.switchOn = true;
      let currentLength = 0;
      const interval = setInterval(() => {
        if (
          currentLength < elts.intakeLiquidMaxLength &&
          Number(elts.sourceLiquid.getAttribute("height")) > 0
        ) {
          currentLength += 2;
          elts.intakeLiquid.style.strokeDashoffset = Math.max(
            0,
            elts.intakeLiquidMaxLength - currentLength
          );
        } else {
          if (state.valveOpen === true) {
            flowThroughApparatus(elts);
          }
          clearInterval(interval);
        }
      }, 16.67);
    } else {
      elts.switchElt.setAttribute("x", switchX);
      elts.switchElt.setAttribute("y", switchY);
      elts.switchElt.setAttribute("transform", switchTransform);
      state.switchOn = false;
      let currentLength = elts.intakeLiquidMaxLength;
      if (Number(elts.sourceLiquid.getAttribute("height")) > 0) {
        const interval = setInterval(() => {
          if (currentLength > 0) {
            currentLength -= 2;
            elts.intakeLiquid.style.strokeDashoffset =
              elts.intakeLiquidMaxLength - currentLength;
          } else {
            clearInterval(interval);
          }
        }, 16.67);
      }
    }
  });

  elts.switchG.addEventListener("mouseover", () => {
    elts.switchG.style.cursor = "pointer";
    elts.switchG.style.filter = "url(#shadow)";
  });

  elts.switchG.addEventListener("mouseout", () => {
    elts.switchG.style.filter = "none";
  });
}

export function valveLogic(elts) {
  let mouseX = 0;
  let mouseY = 0;

  document.body.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const setValveOpen = () => {
    calculateState();
    const rect = elts.valveCircle.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const diffX = Math.max(0, mouseX - cx);
    const diffY = Math.max(0, cy - mouseY);
    let open = 0;
    if (diffX === 0 && diffY === 0) {
      open = 0;
    } else {
      open = 1 - (2 * Math.atan(diffY / diffX)) / Math.PI;
    }

    if (open > 0) {
      state.valveOpen = true;
    } else {
      state.valveOpen = false;
    }
    const angle = open * 90;
    const circlePtX = elts.valveCircle.getAttribute("cx");
    const circlePtY = elts.valveCircle.getAttribute("cy");
    elts.valveRect.setAttribute(
      "transform",
      `rotate(${angle} ${circlePtX} ${circlePtY})`
    );

    open = Math.sin((open ** 0.6 * Math.PI) / 2);

    state.flowRate = state.maxFlowRate * open;
    if (state.switchOn === true && state.flowing === false && state.valveOpen) {
      flowThroughApparatus(elts);
    }
  };

  let mouse = false;

  const callEvent = () => {
    if (mouse) {
      setTimeout(() => {
        setValveOpen();
        callEvent();
      }, 16.67);
    } else {
      return;
    }
  };

  elts.valve.addEventListener("mousedown", () => {
    mouse = true;
    callEvent();
  });

  document.body.addEventListener("mouseup", () => {
    mouse = false;
  });
}

function calculateState() {
  const V = state.flowRate; // flow rate (mL/s)
  const tubeArea = Math.PI * Math.pow(state.r, 2);
  state.v = V / tubeArea; // cm/s
  const nu = 0.0089; // kinematic viscosity (cm^2/s)
  state.Re = (state.r * 2 * state.v) / nu; // Reynolds number
  state.laminar = state.Re < 3500;
  if (state.laminar) {
    state.f = 64 / state.Re; // Darcy friction factor
  } else {
    state.f = 0.25 / Math.log10(5.74 / Math.pow(state.Re, 0.9)) ** 2;
  }
  const L4 = 10 / 3; // characteristic length (cm)
  const L3 = L4 + 7.62;
  const L2 = L3 + 7.62;
  const L1 = L2 + 7.62;

  const P1 = (state.rho * state.v ** 2 * state.f * L1) / (2 * state.r) || 0; // pressure drop (dyne/cm^2)
  const P2 = (state.rho * state.v ** 2 * state.f * L2) / (2 * state.r) || 0;
  const P3 = (state.rho * state.v ** 2 * state.f * L3) / (2 * state.r) || 0;
  const P4 = (state.rho * state.v ** 2 * state.f * L4) / (2 * state.r) || 0;

  const cmPerDyneCm2 = 0.00102; // conversion factor for dyne/cm^2 to cm of head

  state.P1 = P1 * cmPerDyneCm2; // cm of head
  state.P2 = P2 * cmPerDyneCm2;
  state.P3 = P3 * cmPerDyneCm2;
  state.P4 = P4 * cmPerDyneCm2;
}

function flowThroughApparatus(elts) {
  let currentLength = 0;
  state.flowing = true;

  const sourceStartHeight = Number(elts.sourceLiquid.getAttribute("height"));
  const sourceStartY = Number(elts.sourceLiquid.getAttribute("y"));
  const wasteStartHeight = 26.25;
  const wasteStartY = Number(elts.wasteLiquid.getAttribute("y"));
  const frameRate = 60; // frames per second
  const ms = 1000 / frameRate; // milliseconds per frame
  const s = ms / 1000; // seconds per frame
  let sourceHeight = sourceStartHeight;
  let wasteHeight = Number(elts.wasteLiquid.getAttribute("height"));
  let wasteY = wasteStartY;
  const emptySource = sourceHeight === 0;

  const tubePtsPerFrame = () => {
    const tubeLength = 200; // pts
    const tubeCmPerFrame = state.v * s; // cm per frame
    const tubePtsPerCm = tubeLength / 40; // pts per cm
    return tubeCmPerFrame * tubePtsPerCm; // pts per frame
  };

  const handleBeakers = () => {
    const V = state.flowRate; // flow rate (mL/s)
    const beakerFractionPerSecond = V / 500; // s^-1
    const beakerFractionPerMillisecond = beakerFractionPerSecond / 1000; // ms^-1
    const beakerFractionPerFrame = beakerFractionPerMillisecond * ms; // frame^-1
    const beakerPtsPerFrame = beakerFractionPerFrame * sourceStartHeight;
    sourceHeight = Math.max(0, sourceHeight - beakerPtsPerFrame);
    const sourceHeightDiff = sourceStartHeight - sourceHeight;
    const sourceY = sourceStartY + sourceHeightDiff;
    elts.sourceLiquid.setAttribute("y", sourceY);
    elts.sourceLiquid.setAttribute("height", sourceHeight);
    wasteY = wasteY - beakerPtsPerFrame;
    wasteHeight = Math.min(wasteHeight + beakerPtsPerFrame, wasteStartHeight);
    elts.wasteLiquid.setAttribute("y", wasteY);
    elts.wasteLiquid.setAttribute("height", wasteHeight);

    const m1MaxHeight = state.P1 * 3;
    const m2MaxHeight = state.P2 * 3;
    const m3MaxHeight = state.P3 * 3;
    const m4MaxHeight = state.P4 * 3;

    const sdo = Number(elts.tubeLiquid.style.strokeDashoffset);

    if (sdo < 100) {
      m1Height = Math.min(m1MaxHeight, m1Height + tubePtsPerFrame());
    }

    if (sdo < 70) {
      m2Height = Math.min(m2MaxHeight, m2Height + tubePtsPerFrame());
    }

    if (sdo < 40) {
      m3Height = Math.min(m3MaxHeight, m3Height + tubePtsPerFrame());
    }

    if (sdo < 10) {
      m4Height = Math.min(m4MaxHeight, m4Height + tubePtsPerFrame());
    }

    elts.manometerLiquids[0].style.strokeDashoffset = 30.055 - m1Height;
    elts.manometerLiquids[1].style.strokeDashoffset = 30.055 - m2Height;
    elts.manometerLiquids[2].style.strokeDashoffset = 30.055 - m3Height;
    elts.manometerLiquids[3].style.strokeDashoffset = 30.055 - m4Height;
  };

  let m1Height = 0;
  let m2Height = 0;
  let m3Height = 0;
  let m4Height = 0;

  const interval = setInterval(() => {
    let beakerFilling = false;
    if (state.valveOpen === false) {
      state.flowing = false;
      clearInterval(interval);
      return;
    }
    if (currentLength < elts.tubeLiquidMaxLength && !emptySource) {
      currentLength += tubePtsPerFrame();
      elts.tubeLiquid.style.strokeDashoffset = Math.max(
        0,
        elts.tubeLiquidMaxLength - currentLength
      );
      handleBeakers();
    } else {
      clearInterval(interval);
      const beakerInterval = setInterval(() => {
        if (
          sourceHeight > 0 &&
          state.switchOn === true &&
          state.valveOpen === true
        ) {
          if (!beakerFilling) {
            elts.wasteBeakerStream.style.strokeDashoffset = 26.25;
            const fillingInterval = setInterval(() => {
              const streamOffset = Number(
                elts.wasteBeakerStream.style.strokeDashoffset
              );
              if (
                streamOffset > 0 &&
                state.switchOn === true &&
                state.valveOpen === true
              ) {
                elts.wasteBeakerStream.style.strokeDashoffset = Math.min(
                  52.5,
                  streamOffset + tubePtsPerFrame()
                );
              } else {
                clearInterval(fillingInterval);
              }
            }, ms);
            beakerFilling = true;
          }
          handleBeakers();
        } else {
          clearInterval(beakerInterval);
          if (!emptySource) {
            emptyApparatus(elts);
          }
        }
      }, ms);
    }
  }, ms);
}

function emptyApparatus(elts) {
  state.flowing = false;
  calculateState();
  let currentTubeLiquidLength = elts.tubeLiquidMaxLength;
  let currentIntakeLiquidLength = elts.intakeLiquidMaxLength;
  let currentWasteStreamLength = elts.wasteBeakerStreamMaxLength;
  const interval = setInterval(() => {
    elts.manometerLiquids.forEach((man) => {
      const height = Number(man.style.strokeDashoffset);
      const maxHeight = 30.055;
      if (height < maxHeight) {
        man.style.strokeDashoffset = Math.min(maxHeight, height + 2);
      }
    });
    if (
      Number(elts.sourceLiquid.getAttribute("height")) === 0 &&
      currentIntakeLiquidLength < 2 * elts.intakeLiquidMaxLength
    ) {
      currentIntakeLiquidLength += 2;
      elts.intakeLiquid.style.strokeDashoffset =
        elts.intakeLiquidMaxLength - currentIntakeLiquidLength;
    } else {
      if (currentTubeLiquidLength < 2 * elts.tubeLiquidMaxLength) {
        currentTubeLiquidLength += 2;
        elts.tubeLiquid.style.strokeDashoffset =
          elts.tubeLiquidMaxLength - currentTubeLiquidLength;
      } else {
        elts.tubeLiquid.style.strokeDashoffset = elts.tubeLiquidMaxLength;
        clearInterval(interval);
        const clearWasteStreamInterval = setInterval(() => {
          if (currentWasteStreamLength > 0) {
            currentWasteStreamLength -= 2;
            elts.wasteBeakerStream.style.strokeDashoffset = Math.min(
              26.25,
              elts.wasteBeakerStreamMaxLength - currentWasteStreamLength
            );
          } else {
            clearInterval(clearWasteStreamInterval);
          }
        }, 16.67);
      }
    }
  }, 16.67);
}