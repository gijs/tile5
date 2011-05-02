/**
# T5.XY 
The internal XY class is currently created by making a call to `T5.XY.init` rather than `new T5.XY`.
This will seem strange, and it is strange, and is a result of migrating from a closure based pattern
to a prototypal pattern in areas of the Tile5 library.

## Methods
*/
function XY(p1, p2) {
    // if the first parameter is a string, then parse
    if (_is(p1, typeString)) {
        var xyVals = p1.split(reDelimitedSplit);
        
        this.x = parseFloat(xyVals[0]);
        this.y = parseFloat(xyVals[1]);
    }
    else {
        this.x = p1 || 0;
        this.y = p2 || 0;
    } // if..else
} // XY constructor

XY.prototype = {
    constructor: XY,
    
    /**
    ### add(xy*)
    Return a __new__ xy composite that is adds the current value of this xy value with the other xy 
    values that have been passed to the function.  The actual value of this XY value remain unchanged.
    */
    add: function() {
        var sumX = this.x, 
            sumY = this.y;
            
        for (var ii = arguments.length; ii--; ) {
            sumX += arguments[ii].x;
            sumY += arguments[ii].y;
        } // for
        
        return this.copy(sumX, sumY);
    }, // add
    
    /**
    ### copy(x, y)
    */
    copy: function(x, y) {
        var copy = _extend({}, this);
        
        // override the x and y positions with the updated values
        copy.x = x || copy.x;
        copy.y = y || copy.y;
        
        return copy;
    },
    
    /**
    ### equals(xy)
    Return true if the two points are equal, false otherwise.  __NOTE:__ This function
    does not automatically floor the values so if the point values are floating point
    then floating point precision errors will likely occur.
    */
    equals: function(xy) {
        return this.x === xy.x && this.y === xy.y;
    },
    
    /**
    ### offset(x, y)
    Return a new T5.XY object which is offset from the current xy by the specified arguments.
    */
    offset: function(x, y) {
        return this.copy(this.x + x, this.y + y);
    },
    
    /**
    ### relative(view)
    This method is used to return xy coordinates that are relative to the view, rather
    than to the current view frame.
    */
    relative: function(view) {
        // get the viewport
        var viewport = view.viewport();
        
        return this.copy(
            this.x - viewport.x - viewport.padding.x, 
            this.y - viewport.y - viewport.padding.y
        );
    },
    
    /**
    ### sync(view, reverse)
    */
    sync: function(view, reverse) {
        return this;
    },
    
    /**
    ### toString()
    */
    toString: function() {
        return this.x + ', ' + this.y;
    }
};