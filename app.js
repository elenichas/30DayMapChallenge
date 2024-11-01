// Replace with your Mapbox and NASA API keys
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZWxlbmk5NSIsImEiOiJjbTJ5azlqZmEwMW9xMmtzamJ6OGc1bWxuIn0.BcUI_KSPVFGZEmjsIJubDA";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/eleni95/cm2ynq7ei00r301qw5s7z4s34", // Moonlight-style map
  center: [10, 50], // Centered in Europe
  zoom: 4,
});

// Load wildfire data and add to the map as a GeoJSON source
async function loadWildfireData() {
  const response = await fetch("./fire.json"); // Replace with the actual path
  const wildfireData = await response.json();

  // Convert the data to GeoJSON format with confidence as a number
  const geojsonData = {
    type: "FeatureCollection",
    features: wildfireData.map((fire) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [fire.longitude, fire.latitude],
      },
      properties: {
        brightness: fire.brightness,
        confidence: Number(fire.confidence), // Convert confidence to a number
        acq_date: fire.acq_date,
        acq_time: fire.acq_time,
      },
    })),
  };

  // Add GeoJSON data as a source
  map.on("load", () => {
    map.addSource("fires", {
      type: "geojson",
      data: geojsonData,
    });

    // Add layer to visualize fires with color and radius based on properties
    map.addLayer({
      id: "fire-points",
      type: "circle",
      source: "fires",
      paint: {
        // Set circle size based on confidence
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "confidence"],
          50,
          2, // Low confidence results in smaller circles
          100,
          6, // High confidence results in larger circles
        ],
        // Set color based on brightness
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "brightness"],
          290,
          "#ffd9d9", // Lower brightness is lighter
          400,
          "#bf4800", // Higher brightness is darker
        ],
        "circle-opacity": 0.7,
      },
    });

    map.on("click", "fire-points", (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const { brightness, confidence, acq_date, acq_time } =
        e.features[0].properties;

      // Content of the popup
      const popupContent = `
          <strong>Brightness:</strong> ${brightness}<br>
          <strong>Confidence:</strong> ${confidence}<br>
          <strong>Date:</strong> ${acq_date}<br>
          <strong>Time:</strong> ${acq_time}
        `;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });

    // Change cursor to pointer when hovering over points
    map.on("mouseenter", "fire-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    // Reset cursor when not hovering
    map.on("mouseleave", "fire-points", () => {
      map.getCanvas().style.cursor = "";
    });
  });
}

// Call the function to load and plot wildfire data
loadWildfireData();
