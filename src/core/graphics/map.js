/**
# T5.Map
*/
var Map = function(container, params) {
    // initialise defaults
    params = _extend({
        controls: ['zoombar', 'copyright'],
        
        // zoom parameters
        minZoom: 1,
        maxZoom: 18,
        renderer: 'canvas/dom',
        zoom: 1,
        
        zoombar: {}
    }, params);

    /* internals */
    
    var lastBoundsChangeOffset = new GeoXY(),
        rpp,
        zoomLevel = params.zoom || params.zoomLevel,
        residualScaleFactor = 0,
        zoomTimeout = 0;
    
    function checkScaling(targetView, scaleFactor) {
        // calculate the scale factor exponent
        var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;

        // _log('scale factor = ' + scaleFactor + ', exp = ' + scaleFactorExp);
        if (scaleFactorExp !== 0) {
            // scaleFactor = pow(2, scaleFactorExp);
            residualScaleFactor = scaleFactor - pow(2, scaleFactorExp);
            
            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(function() {
                zoom(zoomLevel + scaleFactorExp);
            }, 500);
        } // ifg
    } // checkScaling
    
    function handleRefresh() {
        var viewport = _this.viewport();
        
        // check the offset has changed (refreshes can happen for other reasons)
        if (lastBoundsChangeOffset.x != viewport.x || lastBoundsChangeOffset.y != viewport.y) {
            // trigger the event
            eve('t5.view.boundsChange.' + _this.id, bounds());

            // update the last bounds change offset
            lastBoundsChangeOffset.x = viewport.x;
            lastBoundsChangeOffset.y = viewport.y;
        } // if
    } // handleRefresh
    
    /* exports */
    
    /**
    ### bounds(newBounds)
    */
    function bounds(newBounds, maxZoomLevel) {
        var viewport = _this.viewport();
        
        if (newBounds) {
            // calculate the zoom level we are going to
            var zoomLevel = max(newBounds.bestZoomLevel(viewport.w, viewport.h) - 1, maxZoomLevel || 0);
            
            // move the map
            return zoom(zoomLevel).center(newBounds.center());
        }
        else {
            return new GeoJS.BBox(
                new GeoXY(viewport.x, viewport.y2).sync(_this, true).pos(),
                new GeoXY(viewport.x2, viewport.y).sync(_this, true).pos()
            );
        } // if..else
    } // bounds
    
    /**
    ### zoom(int): int
    Either update or simply return the current zoomlevel.
    */
    function zoom(value, zoomX, zoomY) {
        if (_is(value, typeNumber)) {
            value = max(params.minZoom, min(params.maxZoom, value | 0));
            if (value !== zoomLevel) {
                var viewport = _this.viewport(),
                    offset = _this.offset(),
                    halfWidth = viewport.w / 2,
                    halfHeight = viewport.h / 2,
                    scaling = pow(2, value - zoomLevel),
                    scaledHalfWidth = halfWidth / scaling | 0,
                    scaledHalfHeight = halfHeight / scaling | 0;

                // update the zoom level
                zoomLevel = value;

                // update the offset
                _this.offset(
                    ((zoomX || offset.x + halfWidth) - scaledHalfWidth) * scaling,
                    ((zoomY || offset.y + halfHeight) - scaledHalfHeight) * scaling
                );

                // trigger the change
                eve('t5.view.zoom.' + _this.id, value);
                eve('t5.view.reset.' + _this.id);
                
                // update the rads per pixel to reflect the zoom level change
                rpp = _this.rpp = radsPerPixel(zoomLevel);

                // calculate the grid size
                _this.setMaxOffset(TWO_PI / rpp | 0, TWO_PI / rpp | 0, true, false);

                // reset the scale factor
                _this.scale(1 + residualScaleFactor, false, true);
                residualScaleFactor = 0;

                // reset scaling and resync the map
                eve('t5.view.resync.' + _this.id);

                // refresh the display
                _this.refresh();
            } // if
            
            // return the view so we can chain
            return _this; 
        }
        else {
            return zoomLevel;
        } // if..else
    } // zoom
    
    var _this = _extend(new View(container, params), {
        XY: GeoXY, 
        
        bounds: bounds,
        zoom: zoom
    });
    
    // initialise the default rpp
    rpp = _this.rpp = radsPerPixel(zoomLevel);
    
    // bind events
    eve.on('t5.view.refresh.' + _this.id, handleRefresh);
    eve.on('t5.view.scale.' + _this.id, checkScaling);
    
    return _this;
};