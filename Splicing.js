let workbook_arr = {}, FileName=[], cableInfo ={}, HH_Before =[], HH_After =[], HHlayer =[]
checkError ={'Equipment':[],'Splicing':[]}, HH_coordinate =[]

function handleZipFile_before() {
  function cleanFileName(fileName) {
    const prefixToRemove = 'Splice_Report_';
    const suffixToRemove = '.xlsx';
  
    if (fileName.startsWith(prefixToRemove) && fileName.endsWith(suffixToRemove)) {
      // Remove the prefix and suffix
      return fileName.slice(prefixToRemove.length, -suffixToRemove.length);
    } else {
      // If the file name doesn't match the expected format, return it unchanged
      return fileName;
    }
  }
  const zipFileInput = document.getElementById('zipFileInput_before');
  const zipFile = zipFileInput.files[0];

  if (zipFile) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const zipData = event.target.result;

      JSZip.loadAsync(zipData)
        .then(function (zip) {
          const xlsxFiles = [];
          
          // Iterate through all files in the zip
          zip.forEach(function (relativePath, zipEntry) {
            FileName.push(cleanFileName(zipEntry.name))
            if (zipEntry.name.endsWith('.xlsx')) {
              // Collect all xlsx files
              xlsxFiles.push(zipEntry.async('uint8array'));
            }
          });
          if (xlsxFiles.length === 0) {
            throw new Error('No xlsx files found in the zip');
          }

          // Process all xlsx files concurrently
          return Promise.all(xlsxFiles);
        })
        .then(function (xlsxDataArray) {
          let index = 0
          xlsxDataArray.forEach(function (xlsxData) {
            const workbook = XLSX.read(xlsxData, { type: 'array' });
            //workbook_arr.push({[FileName[index]]: workbook})
            workbook_arr[FileName[index]] = workbook
            index = index + 1
          });
          HH_Before = StoreSplicingInfo()
          console.log('HH_Before',HH_Before)
          AddHHintoMap()

          console.log('HHlayer',HHlayer)
        })
        .catch(function (error) {
          console.error('Error reading zip file:', error);
        });
    };
    reader.readAsArrayBuffer(zipFile);
  }
}

function handleZipFile_after() {
  function cleanFileName(fileName) {
    const prefixToRemove = 'Splice_Report_';
    const suffixToRemove = '.xlsx';
  
    if (fileName.startsWith(prefixToRemove) && fileName.endsWith(suffixToRemove)) {
      // Remove the prefix and suffix
      return fileName.slice(prefixToRemove.length, -suffixToRemove.length);
    } else {
      // If the file name doesn't match the expected format, return it unchanged
      return fileName;
    }
  }
  const zipFileInput = document.getElementById('zipFileInput_after');
  const zipFile = zipFileInput.files[0];

  if (zipFile) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const zipData = event.target.result;

      JSZip.loadAsync(zipData)
        .then(function (zip) {
          const xlsxFiles = [];
          
          // Iterate through all files in the zip
          zip.forEach(function (relativePath, zipEntry) {
            FileName.push(cleanFileName(zipEntry.name))
            if (zipEntry.name.endsWith('.xlsx')) {
              // Collect all xlsx files
              xlsxFiles.push(zipEntry.async('uint8array'));
            }
          });
          if (xlsxFiles.length === 0) {
            throw new Error('No xlsx files found in the zip');
          }

          // Process all xlsx files concurrently
          return Promise.all(xlsxFiles);
        })
        .then(function (xlsxDataArray) {
          let index = 0
          xlsxDataArray.forEach(function (xlsxData) {
            const workbook = XLSX.read(xlsxData, { type: 'array' });
            //workbook_arr.push({[FileName[index]]: workbook})
            workbook_arr[FileName[index]] = workbook
            index = index + 1
          });
          HH_After = StoreSplicingInfo()
          console.log('HH_After',HH_After)
          checkError = CompareSplicing()
          HighlightWrongHH(checkError)
          let NumOfError = 0
          for(let info in checkError){
            let error = checkError[info].length
            NumOfError += error
          }

          if(NumOfError == 0){
            alert('No Error')
          }
          else{
            alert(`${NumOfError} Error`)
            alert('Green : Equipment Error\nRed : Splicing Error\nYellow : Both Equipment and Splicing error')
          }
        })
        .catch(function (error) {
          console.error('Error reading zip file:', error);
        });
    };
    reader.readAsArrayBuffer(zipFile);
  }
}

//Read and store Splicing Information
function StoreSplicingInfo(){
  // Function to extract latitude and longitude from the cellValue
  function extractCoordinates(cellValue) {
    const match = cellValue.match(/Lat: ([\d.-]+) Lon: ([\d.-]+)/);
    if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null; // Return null if no match is found
}

  function CheckCableAttach(arr){
    if(arr.includes("Equipment")){
      return arr.length -1
    }
    else{
      return arr.length
    }
  }

  //simplified splice info
  function simplifiedSplicing(arr){
    let findIndex = [0]
    for(let i =1; i< arr.length; i++){
      if(Number(arr[i][0]) != Number(arr[i-1][0]) + 1){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(Number(arr[i][1]) != Number(arr[i-1][1]) + 1){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(arr[i][2] != arr[i-1][2]){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }
    }

    if(findIndex[findIndex.length] != arr.length){
      findIndex.push(arr.length)
    }

    let result =[]
    for(let i = 1; i < findIndex.length; i++){
      let temp_result = []

      if(findIndex[i] - findIndex[i-1] == 1){
        if(arr[findIndex[i-1]].length == 2){
          temp_result = [arr[findIndex[i-1]][0], '', arr[findIndex[i-1]][1]]
        }
        else{
          temp_result = arr[findIndex[i-1]]
        }
        
      }

      else{
        temp_result = [`${arr[findIndex[i-1]][0]}-${arr[findIndex[i] - 1][0]}`, 
        `${arr[findIndex[i-1]][1]}-${arr[findIndex[i] - 1][1]}`, arr[findIndex[i - 1]][2]]
      }
      result.push(temp_result)
    }
    
    return result
  }

  //simplified equipment data
  function simplifiedEquipment(arr){
    let findIndex = [0]

    for(let i =1; i< arr.length; i++){

      if(arr[i][0] != arr[i-1][0]){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(Number(arr[i][1]) != Number(arr[i-1][1]) + 1){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(Number(arr[i][2]) != Number(arr[i-1][2]) + 1){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(arr[i][3] != arr[i-1][3]){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }
    }

    if(findIndex[findIndex.length] != arr.length){
      findIndex.push(arr.length)
    }

    let result =[]
    for(let i = 1; i < findIndex.length; i++){
      let temp_result = []

      if(findIndex[i] - findIndex[i-1] == 1){
        temp_result = arr[findIndex[i-1]]
        result.push(temp_result)
      }

      else{
        try{
          temp_result = [arr[findIndex[i - 1]][0], `${arr[findIndex[i-1]][1]}-${arr[findIndex[i] - 1][1]}`,
        `${arr[findIndex[i-1]][2]}-${arr[findIndex[i] - 1][2]}`, arr[findIndex[i - 1]][3]]
        result.push(temp_result)
        }
        catch(error){
          temp_result = null
        }
        
      }     
    }
    
    return result
  }

  //find which column based on name and row given
  function readWhichColumn(startColumn,lastColumn, value, row, sheet){
    let startCode = startColumn.charCodeAt(0)
    let endCode = lastColumn.charCodeAt(0)

    for (let code = startCode; code <= endCode; code++) {
      let currentLetter = String.fromCharCode(code);
      let currentValue = sheet[`${currentLetter}${row}`].v

      if(currentValue == value){
        return currentLetter
      }
    }

  }
  
  let cableInfo ={}
  for (let key in workbook_arr) {
    let coord =[]
    if (workbook_arr.hasOwnProperty(key)) {
      const workbook = workbook_arr[key];
      key = key.replace(/_[0-9]+$/, '')
      const totalCable = CheckCableAttach(workbook.SheetNames)
      workbook.SheetNames.forEach(sheetName => {
        if(sheetName != "Equipment"){
          let tempCable=[]
          let tempSpliceInfo_arr =[]
          const sheet = workbook.Sheets[sheetName];
          const maxrow = sheet['!ref'].match(/(\d+)$/)[1]

          //cari Info dekat table info
          for(var cellref in sheet){
            if( cellref.match(/([A-Z]+)(\d+)/) != null){
              const cellColumn = cellref.match(/([A-Z]+)(\d+)/)[1]
              const cellRow = cellref.match(/([A-Z]+)(\d+)/)[2]
              const cellValue = sheet[cellref].v
              if (cellColumn == "A" && cellValue === 'Cable'){
                for(let rowIndex = Number(cellRow) + 1; rowIndex <= (Number(cellRow) + totalCable); rowIndex++){
                  //Column A,C,E,F
                  tempCable.push({
                    [sheet[`A${rowIndex}`].v] : [sheet[`C${rowIndex}`].v, sheet[`E${rowIndex}`].v, sheet[`F${rowIndex}`].v]
                  })
                }
              }

              if( coord.length == 0 && HH_Before.length == 0){
                if (cellValue.includes("Lat") && cellValue.includes("Lon")){
                  coord = extractCoordinates(cellValue)
                  HH_coordinate.push([key,coord[0],coord[1]])
                }
              }
              
            }
          }
          if (tempCable.length > 0){
            const result = tempCable.reduce((acc, obj) => {
              const key = Object.keys(obj)[0]; // Assuming each object has only one key
              acc[key] = obj[key];
              return acc;
            }, {});

            if (!cableInfo[key]) {
              if(totalCable == workbook.SheetNames){
                cableInfo[key] = { 'Info': {}, 'SpliceInfo': {}, 'coordinates': []};
              }
              else{
                cableInfo[key] = { 'Info': {}, 'SpliceInfo': {}, 'Equipment': {}, 'coordinates': []};
              }
              
            }
            Object.assign(cableInfo[key]['Info'], result);
            cableInfo[key]['coordinates'] = coord
            //cableInfo[key] = {'Info': result}
          }

          //pick fiber splicing
          for(var cellref in sheet){
            if( cellref.match(/([A-Z]+)(\d+)/) != null){
              const cellColumn = cellref.match(/([A-Z]+)(\d+)/)[1]
              const cellRow = cellref.match(/([A-Z]+)(\d+)/)[2]
              const cellValue = sheet[cellref].v
              let lettersArray = sheet['!ref'].match(/[A-Za-z]+/g);
              let lastColumn = lettersArray[lettersArray.length - 1][0];
              
              if (cellValue === 'Fiber #'){
                const colFiber = cellColumn //Fiber # symbol
                const colEquipment = readWhichColumn(cellColumn,lastColumn,'Equipment', cellRow, sheet) //Equipment
                const colPort = readWhichColumn(cellColumn,lastColumn,'Port', cellRow, sheet) // Port
                const colCable = readWhichColumn(cellColumn,lastColumn,'Cable', cellRow, sheet) //cable
                const colF = readWhichColumn(cellColumn,lastColumn,'#', cellRow, sheet) //# symbol
                const colNotes = readWhichColumn(cellColumn,lastColumn,'Notes', cellRow, sheet)

                
                //pick fiber info from splicing row
                for(let rowIndex = Number(cellRow) + 1; rowIndex <= maxrow; rowIndex++){
                  let tempSpliceInfo=[]
                  const fiberVal = sheet[`${colFiber}${rowIndex}`].v
                  const eqVal = sheet[`${colEquipment}${rowIndex}`].v
                  const portVal =  sheet[`${colPort}${rowIndex}`].v
                  const cableVal = sheet[`${colCable}${rowIndex}`].v
                  const fVal = sheet[`${colF}${rowIndex}`].v
                  const notesVal = sheet[`${colNotes}${rowIndex}`].v

                  //first check ada equipment punya value dak
                  if(eqVal == "" && portVal == ""){
                    tempSpliceInfo.push(fiberVal)
                    if(notesVal === "Cut" || notesVal === "Passthrough"){
                      if(notesVal === "Passthrough"){
                        let cable = cableInfo[key]['Info'][`${cableVal}`][0]
                        tempSpliceInfo.push(cable,notesVal)
                      }
                      else{
                        tempSpliceInfo.push(notesVal)
                      }
                    }
                    else{
                      let cable = cableInfo[key]['Info'][`${cableVal}`][0]
                      tempSpliceInfo.push(fVal,cable)
                    }
                  }
                  else{
                    continue
                  }

                  if(tempSpliceInfo.length>0){
                    tempSpliceInfo_arr.push(tempSpliceInfo.flat())
                  }
                }

              }
            }
          }

          let dictSpliceInfo ={}
          dictSpliceInfo[sheetName] = tempSpliceInfo_arr

          // Merge the new SpliceInfo values with existing ones
          Object.assign(cableInfo[key]['SpliceInfo'], dictSpliceInfo);
          //cableInfo[key].SpliceInfo[sheetName] = tempSpliceInfo_arr
        }

        else if(sheetName == "Equipment"){
          let Eqconnect
          const sheet = workbook.Sheets[sheetName];
          const maxrow = sheet['!ref'].match(/(\d+)$/)[1]
          let inputName, Eqconnect_arr =[], fiberInput
          //Equipment Connections.
          for(var cellref in sheet){
            if(cellref.match(/([A-Z]+)(\d+)/) != null){
              const cellColumn = cellref.match(/([A-Z]+)(\d+)/)[1]
              const cellRow = cellref.match(/([A-Z]+)(\d+)/)[2]
              const cellValue = sheet[cellref].v
              let lettersArray = sheet['!ref'].match(/[A-Za-z]+/g);
              let lastColumn = lettersArray[lettersArray.length - 1][0];
              
              if (cellValue === 'Input'){
                const colInput =  cellColumn //Input
                const colFIn = readWhichColumn(cellColumn,lastColumn,'#', cellRow, sheet) //#
                const colEq= readWhichColumn(cellColumn,lastColumn,'Equipment', cellRow, sheet) //Equipment
                const colPort = readWhichColumn(cellColumn,lastColumn,'Port', cellRow, sheet) // port
                const colF = readWhichColumn(colPort,lastColumn,'#', cellRow, sheet) //# (located after Port) Output
                const colFOut = readWhichColumn(colPort,lastColumn,'Output', cellRow, sheet) //Output

                for(let rowIndex = Number(cellRow) + 1; rowIndex <= maxrow; rowIndex++){
                  Eqconnect =[]
                  try{
                    var inputVal = sheet[`${colInput}${rowIndex}`].v
                    var fInVal = sheet[`${colFIn}${rowIndex}`].v
                    var eqVal =  sheet[`${colEq}${rowIndex}`].v
                    var portVal = sheet[`${colPort}${rowIndex}`].v
                    var fVal = sheet[`${colF}${rowIndex}`].v
                    var fOutVal = sheet[`${colFOut}${rowIndex}`].v
                  }
                  catch(error){
                    inputVal = ""
                    fOutVal =""
                  }
                  //ni Secondary Splitter kalau dia no output
                  if(fOutVal == ""){
                    if(inputVal != ""){
                      Eqconnect.push(inputVal,fInVal,eqVal.replace(/[^a-zA-Z0-9]/g, ''))
                    }
                  }
                  //ni untuk primary
                  else if(fOutVal != ""){
                    if(inputVal != ""){
                      inputName = inputVal
                      fiberInput = fInVal
                    }
                    Eqconnect.push(inputName,fiberInput,eqVal.replace(/[^a-zA-Z0-9]/g, ''),portVal,fVal,fOutVal)      
                  }
                  if(Eqconnect.length>0){
                    Eqconnect_arr.push(Eqconnect.flat())
                  }
                }
              }
            }
          }
          if(Eqconnect_arr.length>0){
            // Merge the new SpliceInfo values with existing ones
            Object.assign(cableInfo[key]['Equipment'], Eqconnect_arr);
          }
        }
      });
    }
  }
  //manipulate and organize the data
  let organizedEq, uniqueName, uniqueFiberIn
  for (let HH in cableInfo){
    uniqueName =[], uniqueFiberIn = []
    for(let infos in cableInfo[HH]){
      if(infos == "Equipment"){
        eqArr =  cableInfo[HH][infos]
        //get unique name and unique fiber In
        for(let index in eqArr){
          let name = eqArr[index][0]
          let fiberIn = Number(eqArr[index][1])
          //console.log('name',name)
          if(name != undefined){
            if(!uniqueName.includes(name)){
              if(!name.includes("◀")){
                uniqueName.push(name)
              }
            }
          }
            //get unique fiber in 
          if(!uniqueFiberIn.includes(fiberIn)){
            if(fiberIn != 0){
              uniqueFiberIn.push(fiberIn)

            }
          }
        }
        //create object keys
        organizedEq ={}
        for(let i =0; i< uniqueName.length; i++){
          //insert same cable as keys
          let arr_eq =[]
          for(let index in eqArr){
            if(uniqueName[i] === eqArr[index][0]){
              arr_eq.push(eqArr[index].slice(1))
            }
            organizedEq[uniqueName[i]] = arr_eq
          }
          //insert same fiber as keys
          let arr_fiberIn ={}
          for(let k = 0; k < uniqueFiberIn.length; k++){
            for(let fiberName in organizedEq){
              arr_ = []
              for (let j = 0; j < organizedEq[fiberName].length; j++){
                if(Number(uniqueFiberIn[k]) == Number(organizedEq[fiberName][j][0])){
                  arr_.push(organizedEq[fiberName][j].slice(1))
                }
              }
              //if(arr_.length == 1){
              //  flatArr = arr_.flat()
              //  //arr_fiberIn[uniqueFiberIn[k]] = flatArr[0]
              //}
              //else{
              //  arr_fiberIn[uniqueFiberIn[k]] = arr_
              //}
              arr_fiberIn[uniqueFiberIn[k]] = arr_
            }
          }
          organizedEq[uniqueName[i]] = arr_fiberIn

          if(!cableInfo[HH][infos][uniqueName[i]]){
            cableInfo[HH][infos] = organizedEq
          }
        }
      }   
    }
  }

  //reorganize the splice and equipment info
  for(let HH in cableInfo){
    passthrough_cable =[]
    for(let sub_name in cableInfo[HH]['SpliceInfo']){
      Passthrough = {}
      arrOfSplice = cableInfo[HH]['SpliceInfo'][sub_name]
      cableInfo[HH]['SpliceInfo'][sub_name] = simplifiedSplicing(arrOfSplice)
    }
    for(let FiberName in cableInfo[HH]['Equipment']){
      for(let fNumber in cableInfo[HH]['Equipment'][FiberName]){
        arrOfEquipment = cableInfo[HH]['Equipment'][FiberName][fNumber]
        if(Array.isArray(arrOfEquipment) && arrOfEquipment.every(item => Array.isArray(item))){
          if(arrOfEquipment.length != 0){
            let result = simplifiedEquipment(arrOfEquipment)
            cableInfo[HH]['Equipment'][FiberName][fNumber] = result
          }
        }
      }
    }
    //change eq detail into fiber splice Info
    for(let FiberName in cableInfo[HH]['Equipment']){
      let fNumber_arr =[]
      for(let fNumber in cableInfo[HH]['Equipment'][FiberName]){
        fNumber_arr.push(fNumber)
      }
      let len = fNumber_arr.length - 1
      let eqInfo = [`${fNumber_arr[0]}-${fNumber_arr[len]}`, '' ,'Equipment']
      cableInfo[HH]['SpliceInfo'][FiberName].push(eqInfo)
      //now sort
      cableInfo[HH]['SpliceInfo'][FiberName].sort((a, b) => {
        return parseInt(a[0]) - parseInt(b[0]);
      });
      
      //Object.assign(cableInfo[HH]['SpliceInfo'][FiberName], eqInfo);
    }

    //create passthrough keys
    for(let sub_name in cableInfo[HH]['SpliceInfo']){
      arrOfSplice = cableInfo[HH]['SpliceInfo'][sub_name]
      for(let i =0; i < arrOfSplice.length; i++){
        cableInfo[HH]['Passthrough'] = [] //initialize passthrough keys into object
        if(arrOfSplice[i].includes("Passthrough")){
          //passthrough_cable = [sub_name, arrOfSplice[i][1]]
          if(!passthrough_cable.includes(sub_name)){
            passthrough_cable.push(sub_name)
          }
          
        }

      }
      
    }
    if(passthrough_cable.length>0){
      cableInfo[HH]['Passthrough'] = passthrough_cable
    }
  }
  return cableInfo
}

//add HH into Map
function AddHHintoMap(){
  function convertToTable(description, arr_fibers) {
    var sections = description.split('<strong>').slice(1);

    var tablesHTML = sections.map(function (section) {
        // Extract title
        var titleMatch = section.match(/(.*?)<\/strong>/);
        var title = titleMatch ? titleMatch[1].trim() : '';
        // Extract rows
        var tableHTML = '<table border="1" style="position: relative;"><caption>' + title + ':</caption><thead><tr><td>fiberIn</td><td>fiberOut</td><td>cableOut</td></tr></thead><tbody>';
        rows = arr_fibers[title]

        for(let i = 0; i < rows.length; i++){
          tableHTML += '<tr><td>' + rows[i][0] + '</td><td>' + rows[i][1] + '</td><td>' + rows[i][2] + '</td></tr>';
        }
        tableHTML += '</tbody></table>';

        return tableHTML;
    });

    return tablesHTML.join('<br>');
  }

  //create HH into map
  HH_coordinate.forEach(feature => {
    let description = '', eq_desc = ''
    let arr_fibers = {}
    const name = feature[0]
    const lat = feature[1];
    const lon = feature[2];

    //SplicingInfo
    for(let fibername in HH_Before[name]['SpliceInfo']){
      arr = HH_Before[name]['SpliceInfo'][fibername]
      description += '<strong>' + fibername + '</strong>'
      temp_arrfibers2 =[]
      for(let desc in arr){
        temp_arrfibers =[]
        for(let i = 0; i < arr[desc].length; i++){
          temp_arrfibers.push(arr[desc][i])
        }
        temp_arrfibers2.push(temp_arrfibers)
      }
      arr_fibers[fibername] = temp_arrfibers2
    }
    let new_description = convertToTable(description,arr_fibers)

    //Equipment
    for(let fibername in HH_Before[name]['Equipment']){
      eq_desc += '<strong> Cable In:' + fibername + '</strong><br>'
      for(let fiberIn in HH_Before[name]['Equipment'][fibername]){
        let arr = HH_Before[name]['Equipment'][fibername][fiberIn]
        if(arr[0].length > 1){
          //eq_desc += `Primary Splitter <br> Fiber In: ${fiberIn} <br>`
          eq_desc += `<table border="1" style = "position: relative;"><thead>
          <tr>
          <td>Fiber In</td>
          <td>Equipment</td>
          <td>Port</td>
          <td>Fiber Out</td>
          <td> Cable Out</td>
          </tr></thead>
          <tbody>`
        }
        else{
          //eq_desc += `Secondary Splitter <br>`
          eq_desc += `<table border="1" style = "position: relative;"><thead>
          <tr>
          <td>Fiber In</td>
          <td>Equipment</td>
          </tr></thead>
          <tbody>
          `
        }
        for(let i = 0; i < arr.length; i++){
          if(arr[i].length == 1){
            eq_desc +=`<tr>
            <td>${fiberIn}</td>
            <td>${arr[i][0]}</td>
            </tr>`
          }
          else{
            if(i == 0){
              eq_desc +=`<tr>
              <td>${fiberIn}</td>
              <td>${arr[i][0]}</td>
              <td>${arr[i][1]}</td>
              <td>${arr[i][2]}</td>
              <td>${arr[i][3]}</td>
              </tr>`
            }
            else{
              eq_desc +=`<tr>
              <td></td>
              <td>${arr[i][0]}</td>
              <td>${arr[i][1]}</td>
              <td>${arr[i][2]}</td>
              <td>${arr[i][3]}</td>
              </tr>`
            }
            
          }
        }
        eq_desc += `</tbody>
        </table>
        <br>
        `
      }
      
    }

    let popupContent = `
    <div class="custom-popup">
        <div id="page1">
            <h2><strong>${name} : </strong> Splicing Information</h2>
            ${new_description}
        </div>
        <div id="page2" style="display: none;">
            <h2><strong>${name} : </strong> Equipment</h2>
            ${eq_desc}
        </div>
        <div id="navigation">
            <button onclick="showPage(1)">1</button>
            <button onclick="showPage(2)">2</button>
        </div>
    </div>
  `;
  
    let additionalStyles = `
      <style>
          .custom-popup {
              max-height: 200px;
              max-width: 300px;
              overflow-y: auto;
          }
      </style>
    `;

    document.head.innerHTML += additionalStyles;
    // Create a black circle marker
    geo_HHlayer = L.circleMarker([lat, lon], {
      radius: 5,
      color: 'black',
      fillColor: 'black',
      fillOpacity: 1
    });

    // Create a popup with the feature name
    geo_HHlayer.bindPopup(popupContent);

    // Add a click event to show the popup
    geo_HHlayer.on('click', function() {
        this.openPopup();
    });

    geo_HHlayer.addTo(map)
    HHlayer.push(geo_HHlayer)
  })
}

//compare splicing before and after
function CompareSplicing(){
  for (let HH in HH_Before){
    //compare equipment before and after
    for(let keys in HH_Before[HH]["Equipment"]){
      let temp_checkError =[]
      let inputLength_Before = Object.keys(HH_Before[HH]["Equipment"]).length
      let inputLength_After = Object.keys(HH_After[HH]["Equipment"]).length

      if(inputLength_Before != inputLength_After){
        if(inputLength_After == 0){
          temp_checkError.push(HH,'The Equipment doesnt have fiber input')
        }
        else{
          temp_checkError.push(HH,'One of the cable have wrong fiber input')
        }
      }

      else{
        boolError = false
        if(HH_After[HH]["Equipment"][keys] == undefined){
          temp_checkError.push(HH,'Wrong cable input')
        }

        else{
          for(let fiber in HH_Before[HH]["Equipment"][keys]){
            Arr_After = HH_After[HH]["Equipment"][keys][fiber]
            Arr_Before = HH_Before[HH]["Equipment"][keys][fiber]
            //check input fiber yang masuk dalam equipment
            if(Arr_After == undefined){
              temp_checkError.push(HH,'Wrong fiber input')
            }
            else{
              if(Arr_After.length != Arr_Before.length){
                temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
              }
              else{
                for(let i = 0; i <Arr_Before.length; i++ ){
                  for(let j =0; j< Arr_Before[i].length; j++){
                   if(Arr_Before[i][j] != Arr_After[i][j]){
                    temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
                   }
                  }
                }
              }
              
            }
          }
        }
      }
      if(temp_checkError.length > 0){
        checkError['Equipment'].push(temp_checkError)
      }
    }

     //compare splice before and after
    for(let keys in HH_Before[HH]["SpliceInfo"]){
      let temp_checkError = []
      let CableLength_Before = Object.keys(HH_Before[HH]["SpliceInfo"]).length
      let CableLength_After = Object.keys(HH_After[HH]["SpliceInfo"]).length
      passthrough = HH_After[HH]['Passthrough']

      //kalau cable yang connect ke HH ttoal length tak sama
      if(CableLength_Before != CableLength_After){
        console.log(HH,'are not connect with cable')
        temp_checkError.push(HH, 'Missing Cable')
      }

      //Kalau HH tu ada passthrough
      if(passthrough.length>0){
        //check cable yang tak passthrough dulu
        if(!passthrough.includes(keys)){
          let len_before = HH_Before[HH]["SpliceInfo"][keys].length

          for(let i = 0; i < len_before; i++ ){
            let value_before = HH_Before[HH]["SpliceInfo"][keys][i]
            let value_after = HH_After[HH]["SpliceInfo"][keys][i]

            if(value_after == undefined || value_before.length != value_after.length){
              temp_checkError.push(HH, 'Wrong Splicing1')
            }
            else{
              for(let j = 0; j < value_before.length; j++){
                if(value_before[j] != value_after[j]){
                  temp_checkError.push(HH, 'Wrong Splicing2')
                  i = len_before
                }
              }
            }
          }
        }

        else{
          
        }
        
      }
      else{ 
        let len_before = HH_Before[HH]["SpliceInfo"][keys].length
        for(let i = 0; i < len_before; i++ ){
          let value_before = HH_Before[HH]["SpliceInfo"][keys][i]
          let value_after = HH_After[HH]["SpliceInfo"][keys][i]

          if(value_after == undefined || value_before.length != value_after.length){
            temp_checkError.push(HH, 'Wrong Splicing3')
          }
          else{
            for(let j = 0; j < value_before.length; j++){
              if(value_before[j] != value_after[j]){
                temp_checkError.push(HH, 'Wrong Splicing4')
              }
            }
          }
        }
      }

      if(temp_checkError.length > 0){
        checkError['Splicing'].push(temp_checkError)
      }

    }
  }

  console.log('checkError: ',checkError)
  return checkError
}

//set page in popup
function showPage(pageNumber) {
  for (let i = 1; i <= 2; i++) {
      document.getElementById('page' + i).style.display = (i === pageNumber) ? 'block' : 'none';
  }
}

//color HH with wrong Splicing or Equipment
function HighlightWrongHH(checkError){
  let HHeq = [], HHsplicing =[]
  //equipment
  for (let i=0; i< checkError['Equipment'].length; i++ ){
    let HHname = checkError['Equipment'][i][0]
    if(!HHeq.includes(HHname)){
      HHeq.push(HHname)
    }
  }

  //splicing
  for (let i=0; i< checkError['Splicing'].length; i++ ){
    let HHname = checkError['Splicing'][i][0]
    if(!HHsplicing.includes(HHname)){
      HHsplicing.push(HHname)
    }
  }

  for(let i = 0; i < HHeq.length; i++){
    let index = 0
    HH_coordinate.forEach(feature =>{
      let HHname = feature[0]
      if(HHname == HHeq[i]){
        HHlayer[index].setStyle({
          color: 'green',
          fillColor: 'green',
          fillOpacity: 1
        });
      }
      index += 1
    })
  }

  for(let i = 0; i < HHsplicing.length; i++){
    let index = 0
    HH_coordinate.forEach(feature =>{
      let HHname = feature[0]
      if(HHname == HHsplicing[i]){
        HHlayer[index].setStyle({
          color: 'red',
          fillColor: 'red',
          fillOpacity: 1
        });
      }
      index += 1
    })
  } 

  for(let i = 0; i < HHeq.length; i++){
    let index = 0
    if(HHsplicing.includes(HHeq[i])){
      console.log('Both eq and Splicing got error??')
      HH_coordinate.forEach(feature =>{
        let HHname = feature[0]
        if(HHname == HHeq[i]){
          HHlayer[index].setStyle({
            color: 'yellow',
            fillColor: 'yellow',
            fillOpacity: 1
          });
        }
        index += 1
      })
    }
    
    index += 1
  }  
}

