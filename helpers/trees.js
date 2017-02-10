const async = require('async');

// Create Node object
function Node (subject, cat_num) {
  this.data = {
    "subject": subject,
    "catalog_number": cat_num
  }
  this.layer = 0;
  this.parent = null;
  this.children = [];
  // add to node
  this.add = function(node){
    node.parent = this;
    this.children.push(node);
    // increment all node layer levels
    (function increment_layer(currentNode) {
      currentNode.layer++;
      for (var i = 0; i < currentNode.children.length; i++) {
        increment_layer(currentNode.children[i]);
      }
    })(node);
  }
}

// Create Tree
function Tree(subject, cat_num) {
  const root_node = new Node(subject, cat_num);
  this._root = root_node;
  this.layer = 0;
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

Tree.prototype.depth = function (callback) {
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
Tree.prototype.width = function (callback) {
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

  return width;
};

Tree.prototype.print = function () {
  var currentTree = this;
  var string = ""
};

module.exports = {
  Tree,
  Node
}
