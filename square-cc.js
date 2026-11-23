// @param: switch | enabled | Enable Square CC | true
// @param: slider | radius | Corner Radius (pt) | 19.0 | 0.0-30.0

(() => {
  var enabled = r_pref_bool("enabled");
  if (!enabled) return;

  var radius = r_pref_num("radius");
  if (radius === undefined || radius === null) radius = 19.0;

  var UIApplication = r_class("UIApplication");
  var curveStr = r_nsstr("continuous");

  function getClassName(obj) {
    if (!obj || obj === "0x0") return "";
    var cls = r_msg2(obj, "class");
    var desc = r_msg2(cls, "description");
    var cstr = r_msg2(desc, "UTF8String");
    return cstr ? String(cstr) : "";
  }

  function walkView(view, depth) {
    if (!view || view === "0x0" || depth > 14) return;

    var name = getClassName(view);
    if (
      name.indexOf("CCUI") !== -1 &&
      (name.indexOf("Button") !== -1 ||
       name.indexOf("Module") !== -1 ||
       name.indexOf("Platter") !== -1 ||
       name.indexOf("Material") !== -1)
    ) {
      var layer = r_msg2(view, "layer");
      if (layer && layer !== "0x0") {
        r_msg2_main(layer, "setCornerRadius:", radius);
        if (r_responds(layer, "setCornerCurve:")) {
          r_msg2_main(layer, "setCornerCurve:", curveStr);
        }
        r_msg2_main(layer, "setMasksToBounds:", 1);
      }
    }

    var subviews = r_msg2(view, "subviews");
    if (!subviews || subviews === "0x0") return;

    var count = Number(r_msg2(subviews, "count"));
    for (var i = 0; i < count; i++) {
      var child = r_msg2(subviews, "objectAtIndex:", i);
      walkView(child, depth + 1);
    }
  }

  function applyAll() {
    var app = r_msg2(UIApplication, "sharedApplication");
    var windows = r_msg2(app, "windows");
    if (!windows || windows === "0x0") return;

    var winCount = Number(r_msg2(windows, "count"));
    for (var i = 0; i < winCount; i++) {
      var win = r_msg2(windows, "objectAtIndex:", i);
      walkView(win, 0);
    }
  }

  // Reapply the radius while the tweak is running.
  applyAll();
  setInterval(applyAll, 1500);
  log("Square CC16 loop started (radius: " + radius + ")");
})();
