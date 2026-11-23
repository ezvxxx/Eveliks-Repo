// @param: slider | delay | Start Delay (seconds) | 5 | 3-15
// @param: slider | duration | Preview Length (seconds) | 3 | 1-8

(() => {
  const valid = value => Boolean(value) && !/^0x0+$/i.test(String(value));

  function send(object, selector, ...args) {
    if (!valid(object) || !Number(r_responds(object, selector))) return null;
    return r_msg2_main(object, selector, ...args);
  }

  function first(object, selectors) {
    for (const selector of selectors) {
      const value = send(object, selector);
      if (valid(value)) return value;
    }
    return null;
  }

  function setting(key, fallback, min, max) {
    const raw = r_pref_num(key);
    const value = raw == null ? fallback : Number(raw);
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  }

  function preview() {
    const controller = send(r_class("SBIconController"), "sharedInstance");
    const manager = send(controller, "iconManager");
    const root = first(manager, ["rootFolderController"]) ||
                 first(controller, ["rootFolderController"]);
    const selectors = ["currentRootIconListView", "currentIconListView", "currentRootIconList"];
    const list = first(root, selectors) || first(controller, selectors) || first(manager, selectors);
    const icons = first(list, ["visibleIconViews", "iconViews"]);
    const count = Math.min(Number(send(icons, "count")) || 0, 32);
    if (!count || !valid(send(list, "window"))) {
      log("Gravity: No visible Home Screen icons. Run again and return to the Home Screen.");
      return;
    }

    const animator = send(send(r_class("UIDynamicAnimator"), "alloc"), "initWithReferenceView:", list);
    const items = send(send(r_class("NSMutableArray"), "alloc"), "init");
    const frameKey = r_nsstr("frame");
    const iconClass = r_class("SBIconView");
    const copies = [];
    let gravity;
    let scheduled = false;

    function cleanup() {
      send(animator, "removeAllBehaviors");
      for (const copy of copies) send(copy, "removeFromSuperview");
      send(gravity, "release");
      send(items, "release");
      send(animator, "release");
      send(frameKey, "release");
    }

    try {
      if (!valid(animator) || !valid(items) || !valid(frameKey) || !valid(iconClass)) return;
      for (let index = 0; index < count; index++) {
        const icon = send(icons, "objectAtIndex:", index);
        if (!Number(send(icon, "isKindOfClass:", iconClass)) ||
            Number(send(icon, "isHidden"))) continue;
        const parent = send(icon, "superview");
        if (!valid(parent) || (parent !== list && !Number(send(parent, "isDescendantOfView:", list)))) continue;

        const frame = send(icon, "valueForKey:", frameKey);
        if (!valid(frame)) continue;
        const copy = send(icon, "snapshotViewAfterScreenUpdates:", 0);
        if (!valid(copy)) continue;
        send(copy, "setUserInteractionEnabled:", 0);
        send(copy, "setValue:forKey:", frame, frameKey);
        send(parent, "addSubview:", copy);
        copies.push(copy);
        send(items, "addObject:", copy);
      }

      if (!copies.length) {
        log("Gravity: No icon snapshots could be created.");
        return;
      }

      gravity = send(send(r_class("UIGravityBehavior"), "alloc"), "initWithItems:", items);
      if (!valid(gravity)) {
        log("Gravity: UIKit could not initialize gravity.");
        return;
      }
      send(animator, "addBehavior:", gravity);
      setTimeout(cleanup, setting("duration", 3, 1, 8) * 1000);
      scheduled = true;
      log("Gravity: Dropping " + copies.length + " icon copies.");
    } finally {
      if (!scheduled) cleanup();
    }
  }

  const delay = setting("delay", 5, 3, 15);
  log("Gravity: Return to the Home Screen. Preview starts in " + delay + " seconds.");
  setTimeout(preview, delay * 1000);
})();
