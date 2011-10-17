// add a marker at the center of the map
var marker = map.layer('markers').create('marker', {
    xy: '-27.4695 153.0201',
    imageUrl: 'img/square-marker.png',
    markerType: 'image'
});

marker
    .translate(0, -500)
    .translate(0, 500, {
        easing: 'bounce.out',
        duration: 1500
    });