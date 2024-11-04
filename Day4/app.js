// Replace with your Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1IjoiZWxlbmk5NSIsImEiOiJjbTJ5azlqZmEwMW9xMmtzamJ6OGc1bWxuIn0.BcUI_KSPVFGZEmjsIJubDA";

const colorRamp = [
  "#feebe2",
  "#fcc5c0",
  "#fa9fb5",
  "#f768a1",
  "#dd3497",
  "#ae017e",
  "#7a0177",
];

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v9",
  center: [-74.0059, 40.7127], // Center on New York City
  zoom: 10,
  pitch: 45, // Tilt the map for 3D effect
  bearing: -17.6,
});

map.on("load", () => {
  // Load the processed hexbin GeoJSON data
  fetch(
    "https://gist.githubusercontent.com/clhenrick/378cfcf38c6011f8e132419e9e4177df/raw/73d3b1411d21d9ae92dfcc5ae65b9abc7be79ae0/processed.json"
  )
    .then((response) => response.json())
    .then((data) => {
      // Add the hexbin data as a source
      map.addSource("hexGrid", {
        type: "geojson",
        data: data,
      });

      // Add a fill layer to represent the hexbins
      map.addLayer({
        id: "crashesHexGrid",
        type: "fill",
        source: "hexGrid",
        layout: {},
        paint: {
          "fill-color": {
            property: "bin",
            stops: colorRamp.map((d, i) => [i, d]),
          },
          "fill-opacity": 0.6,
        },
      });
    });
});
