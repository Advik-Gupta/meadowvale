const touchPts = new Map();
let pinch = null;
function pinchState() {
  const [a, b] = [...touchPts.values()];
  return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
}
function initTouch() {
  if (initTouch.done || !canvas) return;
  initTouch.done = true;
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType !== "touch") return;
      touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPts.size === 2) {
        e.stopImmediatePropagation();
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (er) {}
        pinch = pinchState();
        ptr.mode = "pinch";
        ptr.down = true;
        cam.vx = cam.vy = 0;
        canvas.classList.remove("panning");
      } else if (touchPts.size > 2) e.stopImmediatePropagation();
    },
    true,
  );
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (!touchPts.has(e.pointerId)) return;
      touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!pinch || touchPts.size < 2) {
        if (ptr.mode === "pinch") e.stopImmediatePropagation();
        return;
      }
      e.stopImmediatePropagation();
      const n = pinchState();
      zoomAt(n.mx, n.my, n.d / pinch.d, true);
      cam.x -= (n.mx - pinch.mx) / cam.z;
      cam.y -= (n.my - pinch.my) / cam.z;
      pinch = n;
    },
    true,
  );
  const up = (e) => {
    if (!touchPts.has(e.pointerId)) return;
    touchPts.delete(e.pointerId);
    if (ptr.mode !== "pinch") return;
    pinch = null;
    if (touchPts.size) e.stopImmediatePropagation();
    else ptr.vx = ptr.vy = 0;
  };
  canvas.addEventListener("pointerup", up, true);
  canvas.addEventListener("pointercancel", up, true);
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("dblclick", (e) => e.preventDefault());
}
const _initInputTouch = initInput;
initInput = function () {
  _initInputTouch();
  initTouch();
};
