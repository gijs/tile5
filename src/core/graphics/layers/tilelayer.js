/**
# LAYER: tile
*/
reg('layer', 'tile', function(view, panFrame, container, params) {
    params = _extend({
        generator: 'osm',
        imageLoadArgs: {}
    }, params);
    
    // initialise variables
    var TILELOAD_MAX_PANSPEED = 2,
        genFn = regCreate('generator', params.generator, view, params).run,
        generating = false,
        storage = null,
        zoomTrees = [],
        loadArgs = params.imageLoadArgs;
    
    /* event handlers */

    function handleRefresh() {
        if (storage) {
            // fire the generator
            genFn(storage, view.invalidate);
        } // if
    } // handleViewIdle
    
    function handleReset() {
        storage.clear();
    } // reset
    
    function handleResync() {
        // get the zoom level for the view
        var zoomLevel = view && view.zoom ? view.zoom() : 0;
        
        if (! zoomTrees[zoomLevel]) {
            zoomTrees[zoomLevel] = createStoreForZoomLevel(zoomLevel);
        } // if
        
        storage = zoomTrees[zoomLevel];
    } // handleParentChange    
    
    /* exports */
    
    /**
    ### draw(renderer)
    */
    function draw(renderer, viewport, view) {
        if (renderer.drawTiles) {
            renderer.drawTiles(
                viewport, 
                storage.search(viewport.buffer(128)),
                view.panSpeed < TILELOAD_MAX_PANSPEED);
        } // if
    } // draw    
    
    /* definition */
    
    var _self = _extend(new ViewLayer(view, panFrame, container, params), {
        draw: draw
    });
    
    eve.on('t5.view.resync.' + view.id, handleResync);
    eve.on('t5.view.refresh.' + view.id, handleRefresh);
    eve.on('t5.view.reset.' + view.id, handleReset);

    return _self;
});
