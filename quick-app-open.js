// @param: slider | speedLevel | Launch Speed (0 = Normal, 1 = 1.25x, 2 = 1.5x, 3 = 1.75x) | 1 | 0-3

(() => {
  function exists(value) {
    return Boolean(value) && !/^0x0+$/i.test(String(value));
  }

  function send(target, selector, ...args) {
    if (!exists(target) || !Number(r_responds(target, selector))) return null;
    return r_msg2_main(target, selector, ...args);
  }

  const speeds = ["1", "1.25", "1.5", "1.75"];
  const level = Number(r_pref_num("speedLevel"));
  const speed = speeds[level] || speeds[1];

  const controller = send(r_class("SBIconController"), "sharedInstance");
  const manager = send(controller, "iconManager");
  const home = send(manager, "homeScreenSettings");
  const animations = send(home, "iconAnimationSettings");
  const launch = send(animations, "centerLaunchSettings");
  if (!exists(launch)) {
    log("Quick App Open: Home Screen launch settings are unavailable.");
    return;
  }

  const speedKey = r_nsstr("speed");
  const speedText = r_nsstr(speed);
  const boxedSpeed = send(r_class("NSDecimalNumber"), "decimalNumberWithString:", speedText);
  if (!exists(speedKey) || !exists(boxedSpeed)) {
    log("Quick App Open: Could not prepare the requested speed.");
    return;
  }

  const updated = new Set();
  for (const selector of ["centralAnimationSettings", "appZoomSettings", "appFadeSettings"]) {
    const timing = send(launch, selector);
    if (!exists(timing) || updated.has(timing) ||
        !Number(r_responds(timing, "speed")) ||
        !Number(r_responds(timing, "setSpeed:"))) continue;

    // KVC unboxes the number into a double. The JS bridge passes integer registers.
    send(timing, "setValue:forKey:", boxedSpeed, speedKey);
    const actual = send(timing, "valueForKey:", speedKey);
    if (Number(send(actual, "isEqualToNumber:", boxedSpeed))) updated.add(timing);
  }

  if (updated.size) {
    log("Quick App Open: Set " + updated.size + " launch timing settings to " + speed + "x.");
  } else {
    log("Quick App Open: Could not verify a launch timing change.");
  }
})();
