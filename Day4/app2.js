const MAPBOX_TOKEN =
  "pk.eyJ1IjoiZWxlbmk5NSIsImEiOiJjbTJ5azlqZmEwMW9xMmtzamJ6OGc1bWxuIn0.BcUI_KSPVFGZEmjsIJubDA";

const colorRangeRed = [
  [255, 235, 230],
  [255, 210, 200],
  [255, 180, 170],
  [255, 150, 140],
  [255, 120, 110],
  [250, 90, 80],
  [230, 70, 60],
  [200, 50, 40],
  [170, 30, 20],
  [140, 20, 10],
];

const colorRangeBlue = [
  [230, 245, 255],
  [204, 236, 255],
  [153, 216, 255],
  [102, 194, 255],
  [65, 174, 255],
  [33, 150, 243],
  [30, 136, 229],
  [25, 118, 210],
  [21, 101, 192],
  [13, 71, 161],
];

let deckgl;
let scatterLayer;
let hexagonLayer;
let deckData = [];

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

// Initialize Deck.gl layers based on mode
function updateLayers(mode) {
  console.log("Updating layers with mode:", mode);

  scatterLayer = new deck.ScatterplotLayer({
    id: "scatterplot-layer",
    data: deckData,
    getPosition: (d) => d.position,
    getFillColor: [200, 30, 0, 100],
    getRadius: 100,
    opacity: 0.6,
    pickable: true,
  });

  hexagonLayer = new deck.HexagonLayer({
    id: "hexagon-layer",
    data: deckData,
    getPosition: (d) => d.position,
    radius: 200,
    elevationScale: 4,
    extruded: true,
    pickable: true,
    colorScaleType: "quantize",
    opacity: 0.5,
    colorRange: mode === 1 ? colorRangeBlue : colorRangeRed,
    getColorWeight: (d) => (mode === 1 ? d.persons_injured : d.persons_killed),
    colorAggregation: "SUM",
    getElevationWeight: (d) =>
      mode === 1 ? d.persons_injured : d.persons_killed,
    elevationAggregation: "SUM",
    onClick: (info) => {
      if (info && info.object) {
        const totalIncidents = info.object.points.length;
        const injuries = info.object.points.reduce(
          (sum, p) => sum + (p.persons_injured || 0),
          0
        );
        const fatalities = info.object.points.reduce(
          (sum, p) => sum + (p.persons_killed || 0),
          0
        );
        showInfoPanel(totalIncidents, injuries, fatalities);
      }
    },
  });

  // Set Deck.gl layers based on mode
  if (mode === 0) {
    deckgl.setProps({ layers: [scatterLayer] });
  } else {
    deckgl.setProps({ layers: [hexagonLayer] });
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
        console.log("Data loaded:", deckData);
        initializeDeckGL();
      },
      error: function (error) {
        console.error("Error parsing CSV:", error);
      },
    });
  }
});

// Initialize Deck.gl
function initializeDeckGL() {
  deckgl = new deck.DeckGL({
    container: "map",
    mapboxApiAccessToken: MAPBOX_TOKEN,
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
  updateLayers(0); // Start with scatter plot layer
}
