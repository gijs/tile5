/**
# T5.DrawLayer
_extends:_ T5.ViewLayer


The DrawLayer is a generic layer that handles drawing, hit testing and syncing a list
of drawables.  A T5.DrawLayer itself is never meant to be implemented as it has no
internal `T5.Drawable` storage, but rather relies on descendants to implement storage and
provide the drawables by the `loadDrawables` method.

## Methods
*/
var DrawLayer = function(params) {
    params = COG.extend({
        zindex: 10
    }, params);
    
    // initialise variables
    var drawables = [],
        storage,
        sortTimeout = 0;
        
    /* private functions */
    
    function dragObject(dragData, dragX, dragY, drop) {
        var dragOffset = this.dragOffset;
        
        // if the drag offset is unknown then calculate
        if (! dragOffset) {
            dragOffset = this.dragOffset = new XY(
                dragData.startX - this.xy.x, 
                dragData.startY - this.xy.y
            );
        } // if

        // update the xy and accounting for a drag offset
        this.xy.x = dragX - dragOffset.x;
        this.xy.y = dragY - dragOffset.y;
        
        if (drop) {
            delete this.dragOffset;
            
            // TODO: reset scale
            
            var view = _self.view;
            if (view) {
                view.syncXY([this.xy], true);
                view.invalidate();
            } // if
            
            this.trigger('dragDrop');
        } // if
        
        return true;
    } // dragObject
    
    function triggerSort(view) {
        clearTimeout(sortTimeout);
        sortTimeout = setTimeout(function() {
            // sort the shapes so the topmost, leftmost is drawn first followed by other shapes
            drawables.sort(function(shapeA, shapeB) {
                if (shapeB.xy && shapeA.xy) {
                    var diff = shapeB.xy.y - shapeA.xy.y;
                    return diff != 0 ? diff : shapeB.xy.x - shapeA.xy.x;
                } // if
            });

            if (view) {
                view.invalidate();
            } // if
        }, 50);
    } // triggerSort
    
    /* event handlers */
    
    function handleItemMove(evt, drawable, newBounds, oldBounds) {
        // remove the item from the tree at the specified position
        if (oldBounds) {
            storage.remove(oldBounds, drawable);
        } // if
        
        // add the item back to the tree at the new position
        storage.insert(newBounds, drawable);
    } // handleItemMove
    
    function handleResync(evt, view) {
        // create the storage with an appropriate cell size
        storage = createStoreForZoomLevel(view.getZoomLevel(), storage);
        
        // iterate through the shapes and resync to the grid
        for (var ii = drawables.length; ii--; ) {
            var drawable = drawables[ii];
            
            drawable.resync(view);
        } // for
        
        // triggerSort(view);
    } // handleParentChange
    
    /* exports */
    
    function draw(renderer, viewport, state, view, tickCount, hitData) {
        var emptyProps = {
            },
            drawItems = storage && viewport ? storage.search(viewport): [];
            
        // iterate through the drawabless and draw the layers
        for (var ii = drawItems.length; ii--; ) {
            var drawable = drawItems[ii],
                overrideStyle = drawable.style || _self.style, 
                styleType,
                previousStyle,
                transform = renderer.applyTransform(drawable),
                drawProps = drawable.getProps ? drawable.getProps(renderer, state) : emptyProps,
                
                prepFn = renderer['prep' + drawable.typeName],
                drawFn,
                
                drawData = prepFn ? prepFn.call(renderer, 
                    drawable,
                    viewport,
                    hitData,
                    state,
                    drawProps) : null;
                    
            // prep the path for the child
            if (drawData) {
                // if the element has been hit then update
                if (hitData && drawData.hit) {
                    hitData.elements.push(Hits.initHit(
                        drawable.type, 
                        drawable, 
                        drawable.draggable ? dragObject : null)
                    );

                    // init the style type to match the type of event
                    styleType = hitData.type + 'Style';

                    // now update the override style to use the specified style if it exists
                    overrideStyle = drawable[styleType] || _self[styleType] || overrideStyle;
                } // if

                // save the previous style
                previousStyle = overrideStyle ? renderer.applyStyle(overrideStyle, true) : null;
                
                // get the draw function (using the drawable override if defined)
                drawFn = drawable.draw || drawData.draw;
                
                // if we have a draw function then run it
                if (drawFn) {
                    drawFn.call(drawable, drawData);
                } // if
                
                // if we have a previous style, then restore that style
                if (previousStyle) {
                    renderer.applyStyle(previousStyle);
                } // if
            } // if
            
            // if a transform was applied, then restore the canvas
            if (transform && transform.undo) {
                transform.undo();
            } // if
        } // for
    } // draw
    
    /**
    ### find(selector: String)
    The find method will eventually support retrieving all the shapes from the shape
    layer that match the selector expression.  For now though, it just returns all shapes
    */
    function find(selector) {
        return [].concat(drawables);
    } // find    
    
    /**
    ### hitGuess(hitX, hitY, state, view)
    Return true if any of the markers are hit, additionally, store the hit elements
    so we don't have to do the work again when drawing
    */
    function hitGuess(hitX, hitY, state, view) {
        return storage && storage.search({
            x: hitX - 10, 
            y: hitY - 10, 
            w: 20,
            h: 20
        }).length > 0;
    } // hitGuess
    
    /* initialise _self */
    
    var _self = COG.extend(new ViewLayer(params), {
        itemCount: 0,
        
        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(drawable, prepend) {
            if (drawable) {
                drawable.layer = _self;
                
                // add the the shapes array
                if (prepend) {
                    drawables.unshift(drawable);
                }
                else {
                    drawables[drawables.length] = drawable;
                } // if..else
                
                // sync this shape with the parent view
                var view = _self.view;
                if (view) {
                    drawable.resync(view);
                    if (storage && drawable.bounds) {
                        storage.insert(drawable.bounds, drawable);
                    } // if
                    
                    triggerSort(view);
                } // if
                
                // attach a move event handler
                drawable.bind('move', handleItemMove);
            } // if
            
            // update the item count
            _self.itemCount = drawables.length;
        },
        
        clear: function() {
            // reset the storage
            storage = new SpatialStore();
            
            // reset the drawables
            drawables = [];
            _self.itemCount = 0;
        },
        
        draw: draw,
        find: find,
        hitGuess: hitGuess
    });
    
    // bind to refresh events as we will use those to populate the items to be drawn
    _self.bind('parentChange', handleResync);
    _self.bind('resync', handleResync);
    
    return _self;
};