//access token for mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JvdW5kY3RybCIsImEiOiJjanhvb2FuczkwOTBxM2RwOWR2M2dzcTBvIn0.4OIjhU9J4sQVJGkNIF1eVg';

var map = new mapboxgl.Map({
    container: 'mapb-general',
    style: 'mapbox://styles/mapbox/streets-v11'
});


var map = new mapboxgl.Map({
    container: 'mapb-custom', // container id
    style: 'mapbox://styles/mapbox/dark-v10', //hosted style id
    center: [-77.38, 39], // starting position
    zoom: 3 // starting zoom
});

var map = new mapboxgl.Map({
    container: 'mapb-driving',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-79.4512, 43.6568],
    zoom: 13
});

map.addControl(new MapboxDirections({
    accessToken: mapboxgl.accessToken
}), 'top-right');

var map = new mapboxgl.Map({
    container: 'mapb-popup',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-96, 37.8],
    zoom: 3
});

var popup = new mapboxgl.Popup({
        closeOnClick: false
    })
    .setLngLat([-96, 37.8])
    .setHTML('<h3>Pop up with Mapbox</h3>')
    .addTo(map);