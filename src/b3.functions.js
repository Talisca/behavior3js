/**
 * List of internal and helper functions in Behavior3JS.
 * 
 * @module functions
**/

(function() {
  "use strict";
  
  /**
   * This function is used to create unique IDs for trees and nodes.
   * 
   * (consult http://www.ietf.org/rfc/rfc4122.txt).
   *
   * @class createUUID
   * @constructor
   * @return {String} A unique ID.
  **/
  b3.createUUID = function() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    // bits 12-15 of the time_hi_and_version field to 0010
    s[14] = "4";

    // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);

    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
  };

  /**
   * Class is a meta-factory function to create classes in JavaScript. It is a
   * shortcut for the CreateJS syntax style. By default, the class created by 
   * this function have an initialize function (the constructor). Optionally, 
   * you can specify the inheritance by passing another class as parameter.
   * 
   * By default, all classes created using this function, may receive only a
   * dictionary parameter as argument. This pattern is commonly used by jQuery 
   * and its plugins.
   *
   * Since 0.2.0, Class also receives a `properties` parameter, a dictionary
   * which will be used to fill the new class prototype.
   *
   * Usage
   * -----
   *
   *     // Creating a simple class
   *     var BaseClass = b3.Class();
   *
   *     var ChildClass = b3.Class(BaseClass, {
   *       // constructor
   *       initialize: function(params) {
   *       
   *         // call super initialize
   *         BaseClass.initialize.call(this, params);
   *         ...
   *       }
   *     });
   *
   * @class Class
   * @constructor
   * @param {Object} baseClass The super class.
   * @param {Object} properties A dictionary with attributes and methods.
   * @return {Object} A new class.
  **/
  b3.Class = function(baseClass, properties) {
    // create a new class
    var cls = function(params) {
      this.initialize(params || {});
    };
    
    // if base class is provided, inherit
    if (baseClass) {
      cls.prototype = Object.create(baseClass.prototype);
      cls.prototype.constructor = cls;
    }
    
    // create initialize if does not exist on baseClass
    if (!cls.prototype.initialize) {
      cls.prototype.initialize = function() {};
    }

    // copy properties
    if (properties) {
      for (var key in properties) {
        cls.prototype[key] = properties[key];
      }
    }

    return cls;
  };
  
  /**
   * This function is used to load projects which are created with
   * behavior3editor. Nested trees are supported.
   *
   * The returned object is a list of the key-value-pairs treeId:tree
   *
   * Usage
   * -----
   *
   *     var trees = b3.LoadProject(
   *       {
   *          "scope": "project",
   *          "selectedTree": "xxxxxxxxx",
   *          "trees": [
   *            {
   *              "name": "tree1",
   *              ...
   *            },
   *            {
   *              "name": "tree2",
   *              ...
   *            }
   *          ]
   *       }
   *     );
   *
   * @class LoadProject
   * @constructor
   * @param {Object} projectData The data structure representing an editor-project.
   * @param {Object} [names] A namespace or dict containing custom nodes.
   * @return {Object} A list with the trees.
  **/
  b3.LoadProject = function LoadProject(projectData, names)
  {
	if (typeof projectData !== "object") {
		console.error("No project data provided.");
		return;
	}
	names = names || {};

	var trees = {};

	// first create the behavior trees
	projectData.trees.forEach(function (tree) {
		var tempTree = new b3.BehaviorTree();

		tempTree.id = tree.id || tempTree.id;
		tempTree.title = tree.title || tempTree.title;
		tempTree.description = tree.description || tempTree.description;
		tempTree.properties = tree.properties || tempTree.properties;

		trees[tree.id] = tempTree;
	});

	// load the nodes for the tree
	// TODO: generalize this step because of so much duplicated code (see BehaviorTree.load)
	projectData.trees.forEach(function (tree) {
		var nodes = tree.nodes;
		var tempNodes = {};

		for (var id in nodes) {
			if (trees[nodes[id].name]) {
				tempNodes[id] = trees[nodes[id].name]; // the node is a tree
			}
			else {
				var spec = nodes[id];

				if (spec.name in names) {
					// Look for the name in custom nodes
					var cls = this._nodes[spec.name];
				} else if (spec.name in b3) {
					// Look for the name in default nodes
					var cls = b3[spec.name];
				} else {
					// Invalid node name
					throw EvalError('BehaviorTree.load: Invalid node name + "' +
									 spec.name + '".');
				}

				var node = new cls(spec.properties);
				node.id = spec.id || node.id;
				node.title = spec.title || node.title;
				node.description = spec.description || node.description;
				node.properties = spec.properties || node.properties;

				tempNodes[id] = node;
			}
		}
		// Connect the nodes
		for (var id in nodes) {
			var spec = nodes[id];
			var node = tempNodes[id];

			if (node.category === b3.COMPOSITE && spec.children) {
				for (var i = 0; i < spec.children.length; i++) {
					var cid = spec.children[i];
					node.children.push(tempNodes[cid]);
				}
			} else if (node.category === b3.DECORATOR && spec.child) {
				node.child = tempNodes[spec.child];
			}
		}

		// Connect the root node for the tree
		trees[tree.id].root = tempNodes[tree.root];
	});

	return trees;
  };
})();