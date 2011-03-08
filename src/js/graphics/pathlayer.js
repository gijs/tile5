/**
# T5.PathLayer
_extends:_ T5.ViewLayer


The T5.PathLayer is used to display a single path on a T5.View
*/
var PathLayer = function(params) {
    params = COG.extend({
        style: 'waypoints',
        hoverStyle: 'waypointsHover',
        pixelGeneralization: 8,
        zindex: 50
    }, params);
    
    // initialise variables
    var coordinates = [],
        markerCoordinates = null,
        rawCoords = [],
        rawMarkers = null,
        pathAnimationCounter = 0,
        spawnedAnimations = [];
        
    /* private internal functions */
    
    function resyncPath() {
        var parent = self.getParent();
        if (parent) {
            // update the vectors
            parent.syncXY(rawCoords);
            if (rawMarkers) {
                parent.syncXY(rawMarkers);
            } // if

            // update the coordinates and the marker coordinates
            coordinates = XY.simplify(rawCoords, params.pixelGeneralization);
            markerCoordinates = XY.simplify(rawMarkers, params.pixelGeneralization);
            
            // flag as changed
            self.changed();
        } // if
    } // resyncPath
    
    /* exports */
    
    function draw(context, viewRect, state, view, tickCount, hitData) {
        var ii,
            coordLength = coordinates.length,
            style = params.style;
            
        context.save();
        try {
            if (coordLength > 0) {
                // test for a hit
                if (hitData) {
                    // start drawing the path
                    context.beginPath();
                    
                    context.moveTo(
                        coordinates[coordLength - 1].x, 
                        coordinates[coordLength - 1].y);

                    for (ii = coordLength; ii--; ) {
                        context.lineTo(
                            coordinates[ii].x,
                            coordinates[ii].y);
                    } // for
                    
                    // FIXME: this is really not cool
                    // Basically FF uses the translated position for it's isPointInPath calcs whereas
                    // the other browsers have implemented it as per the spec which uses the canvas
                    // position "unaffected by transformation operations":
                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-ispointinpath
                    if (context.isPointInPath(hitData.x, hitData.y) || 
                        context.isPointInPath(hitData.relXY.x, hitData.relXY.y)) {
                        style = params.hoverStyle;
                    } // if
                } // if
                
                // draw the stroke
                Style.apply(context, style);

                // start drawing the path
                context.beginPath();
                context.moveTo(
                    coordinates[coordLength - 1].x, 
                    coordinates[coordLength - 1].y);

                for (ii = coordLength; ii--; ) {
                    context.lineTo(
                        coordinates[ii].x,
                        coordinates[ii].y);
                } // for
                
                context.stroke();

                // if we have marker coordinates draw those also
                if (markerCoordinates) {
                    context.fillStyle = params.waypointFillStyle;

                    // draw the instruction coordinates
                    for (ii = markerCoordinates.length; ii--; ) {
                        context.beginPath();
                        context.arc(
                            markerCoordinates[ii].x, 
                            markerCoordinates[ii].y,
                            2,
                            0,
                            Math.PI * 2,
                            false);

                        context.stroke();
                        context.fill();
                    } // for
                } // if
            } // if
        }
        finally {
            context.restore();
        }
    } // draw    
    
    // create the view layer the we will draw the view
    var self = COG.extend(new ViewLayer(params), {
        getAnimation: function(easingFn, duration, drawCallback, autoCenter) {
            // define the layer id
            var layerId = 'pathAnimation' + pathAnimationCounter++;
            spawnedAnimations.push(layerId);

            // create a new animation layer based on the coordinates
            return new AnimatedPathLayer({
                id: layerId,
                path: coordinates,
                zindex: params.zindex + 1,
                easing: easingFn ? easingFn : COG.easing('sine.inout'),
                duration: duration ? duration : 5000,
                drawIndicator: drawCallback,
                autoCenter: autoCenter ? autoCenter : false
            });
        },
        
        draw: draw,
        hitGuess: function() { 
            return true;
        },
        
        updateCoordinates: function(coords, markerCoords) {
            // update the coordinates
            rawCoords = coords;
            rawMarkers = markerCoords;
            
            resyncPath();
        }
    });
    
    self.bind('resync', resyncPath);
    
    return self;
};
