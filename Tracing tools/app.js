let Layers = []

var map = L.map('map', {
    maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
    minZoom: 2,
}).setView([0, 0], 2);

var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© Develop by AzbinFahmi',
    maxZoom: 99
});
var lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© Develop by AzbinFahmi',
    maxZoom: 99
});
// Add the light layer by default
darkLayer.addTo(map);

// Add a control element to toggle between dark and light themes
var baseLayers = {
    "Light Theme": lightLayer,
    "Dark Theme": darkLayer
};

L.control.layers(baseLayers).addTo(map);
//add coordinates ino viewer
var coordinatesDiv = document.getElementById('coordinates');
map.on('mousemove', function (e) {
  // Display latitude and longitude in the coordinates div
  CoordX = e.latlng.lat.toFixed(6);
  CoordY = e.latlng.lng.toFixed(6);
  coordinatesDiv.innerHTML = '<small>Latitude: ' + e.latlng.lat.toFixed(6) + ' | Longitude: ' + e.latlng.lng.toFixed(6) + '</small>';
});

function AddNewLayer(event) {
    function findHHforEachFeature(newlayer){
        // Function to find the shortest distance and corresponding "HH" value
        function findShortestDistanceAndHH(targetCoord, coordArray) {
            function calculateDistance(coord1, coord2) {
                // Function to convert degrees to radians
                function toRadians(degrees) {
                    return degrees * (Math.PI / 180);
                }
                const earthRadiusKm = 6371; // Earth's radius in kilometers
            
                // Convert latitude and longitude from degrees to radians
                const lat1Rad = toRadians(coord1[0]);
                const lon1Rad = toRadians(coord1[1]);
                const lat2Rad = toRadians(coord2[0]);
                const lon2Rad = toRadians(coord2[1]);
            
                // Calculate the differences between coordinates
                const latDiff = lat2Rad - lat1Rad;
                const lonDiff = lon2Rad - lon1Rad;
            
                // Calculate the Haversine distance
                const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
                        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                        Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = earthRadiusKm * c;
            
                return distance;
            }

            let shortestDistance = Infinity;
            let nearestHH = null;
        
            for (const coord of coordArray) {
                const distance = calculateDistance(targetCoord, [coord[1], coord[2]]);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestHH = coord[0]; // Store the "HH" value
                }
            }
            let distance_in_cm = (shortestDistance*1000000).toFixed(2)
            return [ distance_in_cm, nearestHH ];
        }

        let all_feature = newlayer._layers
        for(let layersID in all_feature){
            let result
            let coord = all_feature[layersID].feature.geometry.coordinates
            let cableName = all_feature[layersID].feature.properties.ID
            first_coord = [coord[0][1], coord[0][0]]
            last_coord = [coord[coord.length - 1][1], coord[coord.length - 1][0]]
            let result1 = findShortestDistanceAndHH(first_coord, HH_coordinate)
            let result2 = findShortestDistanceAndHH(last_coord, HH_coordinate)
            //console.log('result1: ',result1,'\nresult2: ',result2)
            let dist1 = result1[0]
            let HH1 = result1[1]
            let dist2 = result2[0]
            let HH2 = result2[1]
            result = [layersID,HH1,HH2,cableName]
            if(dist1>150){
                HH1 = 'Unknown Network Point'
                result = [layersID,HH2,HH1,cableName]
            }
            if(dist2>150){
                HH2 = 'Unknown Network Point'
                result = [layersID,HH1,HH2,cableName]
            }

            if(dist1>150 && dist2>150){
                result =[]
            }     
            if(result.length > 0){
                if(!result.includes('Unknown Network Point')){
                    for(i=0; i < 2; i++){
                        if(i == 0){
                            for(let word in HH_Before[result[1]]['Info']){
                                let arr = HH_Before[result[1]]['Info'][word]
                                if(arr[0] == result[3] && arr[4] == result[2]){
                                    arr[5] = result[0]
                                }
                            }
                        }
                        else{
                            for(let word in HH_Before[result[2]]['Info']){
                                let arr = HH_Before[result[2]]['Info'][word]
                                if(arr[0] == result[3] && arr[4] == result[1]){
                                    arr[5] = result[0]
                                }
                            }
                        }
                    }
                }
                else{
                    for(let word in HH_Before[result[1]]['Info']){
                        let arr = HH_Before[result[1]]['Info'][word]
                        if(arr[0] == result[3] && arr[4] == result[2]){
                            arr[5] = result[0]
                        }
                    }
                }
            }
        }
        //assign feature ID into HHtoObserve
        for(let HH in HHtoObserve){
            for(let fiberIn in HHtoObserve[HH]){
                if(fiberIn != 'Fail' && fiberIn != 'DTS'){
                    let arr = HHtoObserve[HH][fiberIn]
                    for(let i = 0; i < arr.length - 1; i++){
                        let info = HH_Before[arr[i][2]]['Info']
                        for(let words in info){
                            if(info[words].length == 6){
                                if(arr[i][1] == info[words][0] && arr[i][3] == info[words][4]){
                                    arr[i][4] = info[words][5]
                                }
                            } 
                        }
                    }
                }
            }
        }
    }
    if(HH_coordinate.length> 0){
        var newlayer = L.geoJSON(null, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'black-square-icon',
                        iconSize: [10, 10], // Adjust the size of the square
                        html: '<div style="background-color: black; width: 10px; height: 10px;"></div>'
                    })
                });
            },
            onEachFeature: function (feature, layer) {
                var popupContent = '';
                // Iterate through all properties of the feature
                for (var prop in feature.properties) {
                    // Check if the property key does not start with 'v_' and the value is not null
                    if (!prop.startsWith('v_') && prop !== 'vetro_id' && feature.properties[prop] !== null) {
                        // Add the property key-value pair to the popup content
                        popupContent += prop + ': ' + feature.properties[prop] + '<br>';
                    }
                }
                // Bind a popup to the layer with the popup content
                layer.bindPopup(popupContent);
    
                // Add mouseover event listener to change color to yellow
                
                layer.on('mouseover', function (e) {
                    if(freeze == false){
                        this.setStyle({ color: 'yellow' });
                    }
                    
                });
                layer.on('mouseout', function (e) {
                    if(freeze == false){
                        this.setStyle({ color: '#3388ff' });
                    }
                    
                });
                
                layer.on('click', function(event) {
                    console.log('ID', feature.properties.ID);
                    freeze = false
                    for(let leafletID in Layers[0]._layers){
                        Layers[0]._layers[leafletID].setStyle({
                            color: '#3388ff',
                          })
                    }
                    //clear highlight color for HH
                    for(let i =0; i < HHlayer.length; i++){
                        HHlayer[i].setStyle({
                            color: storeHHColor[i][1],
                            fillColor: storeHHColor[i][2],
                            fillOpacity: 1
                        })
                    }
                });
            }
        }).addTo(map);

        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
    
            reader.onload = function (e) {
                var geojsonData = JSON.parse(e.target.result);
    
                // Add the GeoJSON data to the map using the newlayer
                newlayer.addData(geojsonData);
    
                // Optionally, fit the map to the bounds of the GeoJSON layer
                map.fitBounds(newlayer.getBounds());
    
                //make HH layer always on top
                if(HHlayer.length> 0){
                    for(let i = 0; i < HHlayer.length; i++){
                        HHlayer[i].bringToFront()
                    }
                }
                findHHforEachFeature(newlayer)
                if(Layers.length > 1){
                    for (let layerID in newlayer._layers){
                        Layers[0]._layers[layerID] = newlayer._layers[layerID]
                    }
                }
                //Object.assign(cableInfo[HH]['SpliceInfo'][FiberName], eqInfo);
            };
    
            reader.readAsText(file);
        }
        Layers.push(newlayer)
    }
    else{
        alert('Please Insert Splicing File first')
    }
    

}

document.getElementById('fiber').addEventListener('change', AddNewLayer)

