const async = require('async');
const waterloo = require('../routes/waterloo');

// Create Node object
function Node (subject, cat_num, callback) {
  this.name = subject + cat_num;
  this.layer = 0;
  this.parent = null;
  this.children = [];
  // add to node
  this.add = function(node){
    node.parent = this.name;
    this.children.push(node);
    // increment all node layer levels
    (function increment_layer(currentNode) {
      currentNode.layer++;
      for (var i = 0; i < currentNode.children.length; i++) {
        increment_layer(currentNode.children[i]);
      }
    })(node);
  }
  waterloo.getCourseInfo(subject, cat_num, info => {
    this.data = {
      "choose": null,  // null = course, 0 = all of, > 0 = choose 1
      "subject": subject,
      "catalog_number": cat_num,
      "datum": info
    };
    callback(this);
  });
}

// Create Tree
function Tree(subject, cat_num, callback) {
  new Node(subject, cat_num, root_node => {
    this._root = root_node;
    this.layer = 0;
    callback(this);
  });
}

// Depth-first Traversal of Tree
Tree.prototype.traverseDF = function (callback) {
  (function traverse(currentNode) {
    for (var i = 0; i < currentNode.children.length; i++) {
      // traverse each child node
      traverse(currentNode.children[i]);
    }
    // performs callback once traversed all children nodes
    callback(currentNode);
  })(this._root);  // starts at root
};

// Breadth-first search of Tree
Tree.prototype.traverseBF = function (callback) {
  const queue = [];
  queue.push(this._root);
  var currentTree = queue.shift();

  while(currentTree){
    for (var i = 0; i < currentTree.children.length; i++) {
      // adds children to queue
      queue.push(currentTree.children[i]);
    }
    // performs callback on currentTree
    callback(currentTree);
    currentTree = queue.shift();
  }
};

// Performs function on all nodes
// Allows for BF or DF search
Tree.prototype.each = function (callback, traversal) {
  // performs traversal type search on Tree with callback
  traversal.call(this, callback);
};
/*
NEED TO INCREMENT LAYERS
// Adds node to a specific node
Tree.prototype.add = function (subject, cat_num, parent_subject,
                              parent_cat_num, traversal) {
  const childNode = new Node(subject, cat_num);
  var parentNode = null;
  const callback = function (node) {
    if(node.data.subject === parent_subject &&
       node.data.catalog_number === parent_cat_num) parentNode = node;
  };
  // searches Tree for parent node specified
  this.each(callback, traversal);

  if(parentNode) {
    childNode.parent = parentNode;
    childNode.layer = parentNode.layer + 1;
    parentNode.children.push(childNode);
  } else throw new Error('Cannot add node to non-existent parent!');
};*/

// Remove node from Tree
// returns childNode
Tree.prototype.remove = function (subject, cat_num, parent_subject,
                                parent_cat_num, traversal)  {
  var parent = null;
  var naughtyChild = null;
  var index = null;
  var callback = function(node) {
    if(node.data.subject === parent_subject &&
       node.data.catalog_number === parent_cat_num)
      parent = node;
  };
  // search tree for parent node
  this.each(callback, traversal);

  if(parent){
    index = parent.children.findIndex(child => (child.data.subject === subject
                && child.data.catalog_number === cat_num));
    if(index === undefined) throw new Error('Node to remove does not exist!');
    else naughtyChild = parent.children.splice(index, 1); //remove childNode
  } else throw new Error('Parent does not exist!');

  return naughtyChild;
};

// Find how many layers + update depth
Tree.prototype.getDepth = function (callback) {
  const tree = this;
  var depth = 0;
  async.waterfall([
    function (callback1) {
      tree.traverseDF(node => {
        if(node.layer > depth) depth = node.layer;
      })
      callback1(null, null);
    }
  ], (err, result) => callback(depth));
};

// Find width
Tree.prototype.getWidth = function (callback) {
  const tree = this;
  var max_width = 1;
  var width = 1;
  var layer = 0;
  async.waterfall([
    function (callback1) {
      tree.traverseBF(node => {
        if (node.layer === layer) width++;
        else {
          layer = node.layer;
          if (width > max_width) max_width = width;
          width = 1;
        }
      });
      if (width > max_width) max_width = width;
      callback1(null, null);
    }
  ], (err, result) => callback(max_width));
};
/*
Tree.prototype.toString = function (callback) {
  var tree = this;
  tree.getDepth(depth => {
    var string = "";
    async.waterfall([
      function (callback1) {
        var layer = 0;
        tree.traverseBF(node => {
          if (node.layer === layer) {
            if(node.data.choose === 0) string += "Take all of: ";
            else if (node.data.choose !== null) string += "Choose " + node.data.choose + " of:  ";
            else string += node.data.subject + node.data.catalog_number + "  ";
          }
          else {
            string = string.slice(0, -2);
            string += "\n";
            if(node.data.choose === 0) string += "Take all of: ";
            else if(node.data.choose !== null) string += "Choose " + node.data.choose + " of:  ";
            else string += node.data.subject + node.data.catalog_number + "  ";
            layer = node.layer;
          }
        });
        callback1(null, null);
      }
    ], (err, result) => callback(string));
  });
};*/

module.exports = {
  Tree,
  Node
}
