(function () {
  "use strict";

  /**
   * The Parallel node ticks its children semi-parallel.
   * If the number of children with the SUCCESS-state is larger than S then the node also returns 'SUCCESS'.
   * If the number of children with the FAILURE-state is larger than F then the node also returns 'FAILURE'.
   * If neither of the above cases succeed, the node returns 'RUNNING'.
   *
   * @module b3
   * @class Parallel
   * @extends Composite
  **/
  b3.Parallel = b3.Class(b3.Composite, {
    /**
     * Node parameters.
     * @property {String} parameters
     * @readonly
    **/
    parameters: { 'F': 0, 'S': 0 },
	
    /**
     * Initialization method.
     *
     * Settings parameters:
     *
     * - **F** (*Integer*) Number of minimum childs with return-state FAILURE
     * - **S** (*Integer*) Number of minimum childs with return-state SUCCESS
     *
     * @method initialize
     * @param {Object} settings Object with parameters.
     * @constructor
    **/
    initialize: function (settings) {
      parameters = settings || {};
      b3.Composite.prototype.initialize.call(this);

      this.F = settings.F || 0;
      this.S = settings.S || 0;
    },

    /**
     * Node name. Default to `Parallel`.
     *
     * @property {String} name
     * @readonly
    **/
    name: 'Parallel',

    /**
     * Tick method.
     * @method tick
     * @param {Tick} tick A tick instance.
     * @return {Constant} A state constant.
    **/
    tick: function (tick) {
      var counter = {};
      counter[b3.SUCCESS] = 0;
      counter[b3.FAILURE] = 0;
      counter[b3.RUNNING] = 0;
      counter[b3.ERROR] = 0;

      this.children.forEach(function (node) {
        counter[node._execute(tick)]++;
      });

      if (counter[b3.SUCCESS] >= this.S)
        return b3.SUCCESS;
      else if (counter[b3.FAILURE] >= this.F)
        return b3.FAILURE;

      return b3.RUNNING;
    }
  });
})();