const MAPBOX_TOKEN =
  "pk.eyJ1IjoiZWxlbmk5NSIsImEiOiJjbTJ5azlqZmEwMW9xMmtzamJ6OGc1bWxuIn0.BcUI_KSPVFGZEmjsIJubDA";

// const colorRangeRed = [
//   [255, 210, 200],
//   [255, 180, 170],
//   [255, 150, 140],
//   [255, 120, 110],
//   [250, 90, 80],
//   [230, 70, 60],
//   [200, 50, 40],
//   [170, 30, 20],
//   [140, 20, 10],
// ];
// const colorRangePurple = [
//   [232, 218, 239], // light lavender
//   [216, 191, 227], // soft purple
//   [201, 162, 214], // medium-light purple
//   [186, 135, 201], // medium purple
//   [164, 104, 186], // medium-dark purple
//   [142, 74, 171], // dark purple
//   [113, 47, 144], // very dark purple
//   [87, 29, 117], // deep purple
//   [63, 18, 89], // near black purple
// ];

// const colorRangeBlue = [
//   [243, 251, 255],
//   [230, 245, 255],
//   [204, 236, 255],
//   [153, 216, 255],
//   [102, 194, 255],
//   [65, 174, 255],
//   [33, 150, 243],
//   [30, 136, 229],
//   [25, 118, 210],
//   [21, 101, 192],
//   [13, 71, 161],
// ];

const colorRangeRed = [
  [80, 30, 30], // Dark muted red
  [120, 50, 50], // Deeper red
  [170, 70, 60], // Dark red
  [200, 50, 40], // Soft red
  [230, 70, 60], // Bright red
  [250, 90, 80], // Soft coral red
  [255, 120, 110], // Light coral
  [255, 150, 140], // Light peach
  [255, 180, 170], // Light soft pinkish red
  [255, 210, 200], // Light warm pink
];

const colorRangePurple = [
  [25, 0, 40], // Very dark purple
  [50, 0, 80], // Dark purple
  [75, 0, 120], // Deeper purple
  [100, 0, 160], // Deep purple
  [125, 0, 200], // Rich purple
  [145, 0, 225], // Medium purple
  [158, 0, 255], // Bright purple (target color)
];

const colorRangeBlue = [
  [0, 15, 40], // Very dark blue
  [0, 30, 80], // Dark blue
  [0, 50, 120], // Deeper blue
  [0, 70, 160], // Deep blue
  [0, 90, 200], // Medium-dark blue
  [0, 108, 225], // Medium blue
  [0, 116, 255], // Bright blue (target color)
];

let deckgl;
let scatterLayer;
let hexagonLayer;
let hexagonLayer2;
let deckData = [];
let minCount = 0;
let maxCount = 1700;

let minInc = 0;
let maxInc = 690;

// Convert CSV data to Deck.gl-compatible format
function convertCsvDataToDeckData(csvData) {
  console.log("Converting CSV data...");
  return csvData
    .filter((row) => row.LATITUDE && row.LONGITUDE)
    .map((row) => ({
      position: [parseFloat(row.LONGITUDE), parseFloat(row.LATITUDE)],
      persons_injured: parseInt(row["NUMBER OF PERSONS INJURED"]) || 0,
      persons_killed: parseInt(row["NUMBER OF PERSONS KILLED"]) || 0,
    }));
}
// Helper function for logarithmic scaling and normalization
function getNormalizedLogWeight(value, min, max) {
  const logValue = Math.log1p(value); // Apply logarithmic scaling
  const logMin = Math.log1p(min); // Log of min count
  const logMax = Math.log1p(max); // Log of max count
  return (logValue - logMin) / (logMax - logMin); // Normalize to 0–1 range
}

// Initialize Deck.gl layers based on mode
function updateLayers(mode) {
  console.log("Updating layers with mode:", mode);

  scatterLayer = new deck.ScatterplotLayer({
    id: "scatterplot-layer",
    data: deckData,
    getPosition: (d) => d.position,
    getFillColor: [200, 30, 0, 100],
    getRadius: 10,
    opacity: 0.6,
    pickable: true,

    onClick: (info) => {
      if (info && info.object) {
        const totalIncidents = 1;
        const injuries = info.object.persons_injured;
        const fatalities = info.object.persons_killed;
        showInfoPanel(totalIncidents, injuries, fatalities);
      }
    },
  });

  hexagonLayer = new deck.HexagonLayer({
    id: "hexagon-layer-fatal",
    data: deckData,
    getPosition: (d) => d.position,
    radius: 100,
    elevationScale: 2,
    extruded: true,
    pickable: true,
    colorScaleType: "quantize",
    opacity: 0.5,
    colorRange: colorRangePurple,
    getColorWeight: (d) => d.persons_killed,
    colorAggregation: "SUM",

    getElevationWeight: (d) => d.persons_killed,
    elevationAggregation: "SUM",

    getColorValue: (d) =>
      getNormalizedLogWeight(
        d.reduce((sum, item) => sum + (item.persons_killed || 0), 0),
        minInc,
        maxInc
      ),

    onClick: (info) => {
      if (info && info.object) {
        const totalIncidents = info.object.points.length;
        const injuries = info.object.points.reduce(
          (sum, p) => sum + (p.source.persons_injured || 0),
          0
        );
        const fatalities = info.object.points.reduce(
          (sum, p) => sum + (p.source.persons_killed || 0),
          0
        );
        showInfoPanel(totalIncidents, injuries, fatalities);
      }
    },
  });

  hexagonLayer2 = new deck.HexagonLayer({
    id: "hexagon-layer-incidents",
    data: deckData,
    getPosition: (d) => d.position,
    radius: 100,
    elevationScale: 1,
    extruded: true,
    pickable: true,
    colorScaleType: "quantize",
    opacity: 0.5,
    colorRange: colorRangeBlue,
    // getColorWeight: (d) => 1,
    colorAggregation: "SUM",

    // Set color weight to 1 for each incident, allowing aggregation by count
    getColorWeight: (d) => 1,
    getElevationWeight: (d) => 1, // Count each incident as 1 for elevation

    // Aggregate by total incident count and apply scaling to color and elevation
    colorAggregation: "SUM",
    elevationAggregation: "SUM",

    // Use normalized log-based weight for color range
    getColorValue: (hex) =>
      getNormalizedLogWeight(hex.length, minCount, maxCount),
    // getElevationValue: (hex) =>
    //   getNormalizedLogWeight(hex.length, minCount, maxCount),

    onClick: (info) => {
      if (info && info.object) {
        const totalIncidents = info.object.points.length;
        const injuries = info.object.points.reduce(
          (sum, p) => sum + (p.source.persons_injured || 0),
          0
        );
        const fatalities = info.object.points.reduce(
          (sum, p) => sum + (p.source.persons_killed || 0),
          0
        );
        showInfoPanel(totalIncidents, injuries, fatalities);
      }
    },
  });
  // Set Deck.gl layers based on mode
  if (mode === 0) {
    deckgl.setProps({ layers: [scatterLayer] });
  } else if (mode === 1) {
    deckgl.setProps({ layers: [hexagonLayer] });
  } else {
    deckgl.setProps({ layers: [hexagonLayer2] });
  }
}

// Show hexagon information in a panel
function showInfoPanel(totalIncidents, injuries, fatalities) {
  const infoPanel = document.getElementById("info-panel");
  const infoContent = document.getElementById("info-content");
  infoContent.innerHTML = `
        <p><strong>Total Incidents:</strong> ${totalIncidents}</p>
        <p><strong>Total Injuries:</strong> ${injuries}</p>
        <p><strong>Total Fatalities:</strong> ${fatalities}</p>
    `;
  infoPanel.style.display = "block";
}

// Event listener to close info panel
document.getElementById("close-btn").addEventListener("click", () => {
  document.getElementById("info-panel").style.display = "none";
});

// Event listener for slider to switch modes
document.getElementById("mode-slider").addEventListener("input", (event) => {
  const mode = parseInt(event.target.value, 10);
  updateLayers(mode);
});

// Event listener to load CSV data
document.getElementById("csvInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      complete: function (results) {
        deckData = convertCsvDataToDeckData(results.data);

        initializeDeckGL();
      },
      error: function (error) {
        console.error("Error parsing CSV:", error);
      },
    });
  }
});

// Initialize Deck.gl
function initializeDeckGL(min, max) {
  deckgl = new deck.DeckGL({
    container: "map",
    mapboxApiAccessToken: MAPBOX_TOKEN,
    mapStyle: "mapbox://styles/mapbox/dark-v10",
    initialViewState: {
      longitude: -74.0059,
      latitude: 40.7127,
      zoom: 10,
      pitch: 45,
      bearing: -17.6,
    },
    controller: true,
    layers: [],
  });
  updateLayers(0, min, max); // Start with scatter plot layer
}
