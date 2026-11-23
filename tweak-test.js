// @param: slider | testValue | Test Value | 5 | 0-10

(() => {
  log("Tweak Test: JavaScript is running.");
  var value = r_pref_num("testValue");
  log("Tweak Test: slider value = " + value);
})();
