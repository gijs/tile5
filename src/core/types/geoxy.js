/**
# T5.GeoXY

## Methods
*/
function GeoXY(p1, p2, mercX, mercY) {
    // initialise the mercator x and y
    this.mercX = mercX;
    this.mercY = mercY;
    
    // if the first parameter is a string, then parse
    if (_is(p1, typeString)) {
        _extend(this, Parser.parseXY(p1));
    } // if
    // otherwise, if the first parameter is a position, then convert to pixels
    else if (p1 && p1.toPixels) {
        _extend(this, p1.toPixels());
    }
    else {
        XY.call(this, p1, p2);
    }
} // GeoXY

GeoXY.prototype = _extend(new XY(), {
    constructor: GeoXY,
    
    /**
    ### pos()
    */
    pos: function() {
        return _unproject(this.mercX, this.mercY);
    },
    
    /**
    ### sync(view, reverse)
    */
    sync: function(view, reverse) {
        var rpp = view.rpp || radsPerPixel(view.zoom());
        
        if (reverse) {
            this.mercX = this.x * rpp - Math.PI;
            this.mercY = Math.PI - this.y * rpp;
        }
        else if (this.mercX || this.mercY) {
            this.x = round((this.mercX + Math.PI) / rpp);
            this.y = round((Math.PI - this.mercY) / rpp);
        } // if

        return this;
    }
});