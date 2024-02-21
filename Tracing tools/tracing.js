let workbook_arr = {}, FileName=[], cableInfo ={}, HH_Before =[], HHlayer =[], hh_PS =[]
HH_coordinate =[],eqFromCableSheet = {}, HHtoObserve = {}, hhFromPS = {}, storeHHColor = [],
duplicateHH = [], showDuplicateHH = []
var freeze = false

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
            TraceFiber()
  
            //console.log('HHlayer',HHlayer)
          })
          .catch(function (error) {
            console.error('Error reading zip file:', error);
          });
      };
      reader.readAsArrayBuffer(zipFile);
    }
}
//set page in popup
function showPage(pageNumber) {
  for (let i = 1; i <= 3; i++) {
      document.getElementById('page' + i).style.display = (i === pageNumber) ? 'block' : 'none';
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
      //console.log('arr: ',arr)
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
    //use in Info keys untuk ambik fiber tu ke HH mana
    function extractValueBetweenToAndComma(input) {
      const startIndex = input.indexOf('to') + 3; // Adding 3 to skip 'to' and the following space
      const endIndex = input.indexOf(',', startIndex);
      const result = input.substring(startIndex, endIndex).trim();
      return result;
    }
    //get direction
    function getDirectionFromString(str) {
      let words = str.split(' ');
      let direction = words[0];
  
      // Check if the first word is a direction
      if (['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].includes(direction)) {
          return direction;
      } else {
          return ;
      }
    }
    //geet cableout name based on keyword(A,B,C,D)
    function getCableOutfromInfo(HHname,keyword){
      let arr = cableInfo[HHname]['Info'][keyword]
      if(keyword == ''){
        return ''
      }
      return `${arr[0]}_to_${arr[4]}`
    }
    //use in 'bawak masuk info dari cableinfo Equipment untuk show cable'
    function formatArray(arr) {
      let result = [];
      let start = arr[0]; // Initialize start of the range
  
      for (let i = 1; i < arr.length; i++) {
          // Check if the current element is consecutive to the previous element
          if (parseInt(arr[i]) !== parseInt(arr[i - 1]) + 1) {
              // If not consecutive, add the range or single element to the result array
              if (start === arr[i - 1]) {
                  result.push(start); // If it's a single element
              } else {
                  result.push(start + '-' + arr[i - 1]); // If it's a range
              }
              start = arr[i]; // Update start of the new range
          }
      }
  
      // Add the last range or single element to the result array
      if (start === arr[arr.length - 1]) {
          result.push(start); // If it's a single element
      } else {
          result.push(start + '-' + arr[arr.length - 1]); // If it's a range
      }
  
      return result;
    }

    function extractNameFromPath(path) {
      // Split the path by '/'
      let parts = path.split('/');
      
      // Get the last part of the path
      let fileName = parts[parts.length - 1];
      
      // Check if the last part contains a dot (.)
      if (fileName.includes('.')) {
          // If yes, consider the part before the last dot as the file name
          return fileName.slice(0, fileName.lastIndexOf('.'));
      } else {
          // Otherwise, treat it as a directory and return the last part (file name)
          return parts[parts.length - 1];
      }
    }

    let cableInfo ={}, checkHHname =[], nameHH = 1
    for (let key in workbook_arr) {
      let coord =[],storeDR = []
      if (workbook_arr.hasOwnProperty(key)) {
        const workbook = workbook_arr[key];
        let key_name = extractNameFromPath(key)
        key_name = key_name.replace(/_[0-9]+$/, '').split('_')
        
        key = key_name[key_name.length-1]
        key = key.replace(/_[0-9]+$/, '')
        if(!checkHHname.includes(key)){
          checkHHname.push(key)
        }
        else{
          showDuplicateHH.push(key)
          duplicateHH.push(key)
          key = `${key}_${nameHH}`
          duplicateHH.push(key)
          nameHH+=1
        }
        const totalCable = CheckCableAttach(workbook.SheetNames)
        workbook.SheetNames.forEach(sheetName => {

          if(sheetName.includes('DR') || sheetName.includes('Drop')){
            storeDR.push(sheetName)
          }
          else if(sheetName != "Equipment"){
            let tempCable=[]
            let tempSpliceInfo_arr =[], storeEQ_arr = []
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
                    //Column A,C,E,F A for A = cable, C = ID, E = Count, F = Direction to
                    tempCable.push({
                      [sheet[`A${rowIndex}`].v] : [sheet[`C${rowIndex}`].v, sheet[`E${rowIndex}`].v, sheet[`F${rowIndex}`].v, 
                      getDirectionFromString(sheet[`F${rowIndex}`].v), extractValueBetweenToAndComma(sheet[`F${rowIndex}`].v)]
                    })
                  }
                }
                if( coord.length == 0 && HH_Before.length == 0){
                  if (cellValue.includes("Lat") && cellValue.includes("Lon")){
                    coord = extractCoordinates(cellValue)
                    HH_coordinate.push([key,coord[0],coord[1],''])
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
                  eqFromCableSheet[key] = { 'EqInfo':{}, 'EqInfo_Edited':{}}
                }
                else{
                  cableInfo[key] = { 'Info': {}, 'SpliceInfo': {}, 'Equipment': {}, 'coordinates': [], 'Drop':[]};
                  eqFromCableSheet[key] = { 'EqInfo':{}, 'EqInfo_Edited':{}}
                }
                
              }
              Object.assign(cableInfo[key]['Info'], result);
              cableInfo[key]['coordinates'] = coord
              //cableInfo[key] = {'Info': result}
            }
  
            //pick fiber splicing
            let newCableName
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
  
                  let startCode = cellColumn.charCodeAt(0) - 1
                  let currentLetter = String.fromCharCode(startCode);
                  let currentcableName = sheet[`${currentLetter}${Number(cellRow)-1}`].v.split(" ")[1]
                  newCableName = `${cableInfo[key]['Info'][currentcableName][0]}_to_${cableInfo[key]['Info'][currentcableName][4]}`
                  //pick fiber info from splicing row
                  let eqName, fiber_IN
                  for(let rowIndex = Number(cellRow) + 1; rowIndex <= maxrow; rowIndex++){
                    let tempSpliceInfo=[], storeEQ = []
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
                          let cable =  getCableOutfromInfo(key,cableVal)
                          tempSpliceInfo.push(cable,notesVal)
                        }
                        else{
                          tempSpliceInfo.push(notesVal)
                        }
                      }
                      else{
                        let cable =  getCableOutfromInfo(key,cableVal)
                        tempSpliceInfo.push(fVal,cable)
                      }
                    }
                    else{
                      if(eqVal != "" && portVal != ""){
                        eqName = eqVal.replace(/[^a-zA-Z0-9]/g, '')
                        fiber_IN = fiberVal
                      }
                      let check_cable = getCableOutfromInfo(key,cableVal)
                      if(eqVal != "" && (cableVal == "" || check_cable.includes('DR') || check_cable.includes('Drop') )){ //
                        storeEQ.push(fiberVal, eqName)
                      }
                      else {
                        if(!check_cable.includes('DR') || check_cable.includes('Drop')){
                          storeEQ.push(fiber_IN , eqName, portVal, fVal, getCableOutfromInfo(key,cableVal))
                        }
                        else{
                        }
                      }
                      //continue
                    }
  
                    if(tempSpliceInfo.length>0){
                      tempSpliceInfo_arr.push(tempSpliceInfo.flat())
                    }
                    if(storeEQ.length > 0){
                      storeEQ_arr.push(storeEQ.flat())
                    }
                  }
                }
              }
            }
  
            let dictSpliceInfo ={}, EqInfo = {}
            dictSpliceInfo[newCableName] = tempSpliceInfo_arr
            EqInfo[newCableName] = storeEQ_arr
            
            // Merge the new SpliceInfo values with existing ones
            Object.assign(cableInfo[key]['SpliceInfo'], dictSpliceInfo);
            Object.assign(eqFromCableSheet[key]['EqInfo'], EqInfo);
            if(storeDR.length > 0){
              Object.assign(cableInfo[key]['Drop'], storeDR);
            }
          }
          else if(sheetName == "Equipment"){
            let Eqconnect
            const sheet = workbook.Sheets[sheetName];
            const maxrow = sheet['!ref'].match(/(\d+)$/)[1]
            let inputName, Eqconnect_arr =[], fiberInput, unusedDrop =[]
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
                  let checkEQVal
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
                    //ni Splitter kalau dia connect dengan drop
                    if(fOutVal.includes('DR') || fOutVal.includes('Drop')){
                      if(cableInfo[key]['Drop'].includes(fOutVal)){
                        let drop = cableInfo[key]['Drop']
                        cableInfo[key]['Drop'] = drop.filter(value => value !== fOutVal)
                      }
                      fOutVal = ""
                    }
                    //ni Secondary Splitter kalau dia no output
                    if(fOutVal == ""){
                      if(inputVal != ""){
                        Eqconnect.push(inputVal,fInVal,eqVal)
                      }
                    }
                    //ni untuk primary
                    else if(fOutVal != ""){
                      if(inputVal != ""){
                        inputName = inputVal
                        fiberInput = fInVal
                        checkEQVal = eqVal
                      }
                      if(checkEQVal == eqVal && eqVal.includes("◀")){
                        Eqconnect.push(inputName,fiberInput,eqVal,portVal,fVal,fOutVal)
                      }
                      
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
    //console.log('cableInfo: ',cableInfo)
    //console.log('eqFromCableSheet: ',eqFromCableSheet)

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
                if(arr_.length != 0){
                  arr_fiberIn[uniqueFiberIn[k]] = arr_
                }
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
    //reorganize the splice and equipment info (ada nak guna satgi)
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
    //reorganize eqFromCableSheet
    for(let HH in eqFromCableSheet){
      arr = eqFromCableSheet[HH]['EqInfo']
      for(let name in arr){
        const dict = {};
        arr[name].forEach(arrs => {
          const key = arrs[0];
          if (!dict[key]) {
            dict[key] = [];
          }
          dict[key].push(arrs.slice(1));
        });
        let new_dict = {}
        for(let fiberin in dict){
          let arr_ = dict[fiberin]
          let result = simplifiedEquipment(arr_)
          new_dict[fiberin] = result
        }
        eqFromCableSheet[HH]['EqInfo_Edited'][name] = new_dict
      }
    }
    //compare cableinfo and eqFromCableSheet
    for(let HH in cableInfo){
      for(let cablename in cableInfo[HH]['Equipment']){
        let arr1 = cableInfo[HH]['Equipment'][cablename], newFibername
        for(let fiberin in arr1){
          for(let cablename1 in eqFromCableSheet[HH]['EqInfo_Edited']){
            let name = cablename1.split('_to_')
            let arr2 = eqFromCableSheet[HH]['EqInfo_Edited'][cablename1]
            for(let fiberin2 in arr2){
              if(fiberin2 === fiberin && name[0]==cablename){
                newFibername = cablename1
                for(let i = 0; i < arr1[fiberin].length; i++){
                  //console.log('arr2: ',arr2, '\nfiberin: ',fiberin, '\narr1: ',arr1, '\nHH: ',HH)
                  if(arr2[fiberin2][i][3] != '' && arr2[fiberin2][i].length == 4){
                    cableInfo[HH]['Equipment'][cablename][fiberin][i][3] =  arr2[fiberin2][i][3]
                  }
                }
              }
            }
          }
        }
        cableInfo[HH]['Equipment'][newFibername] = cableInfo[HH]['Equipment'][cablename]
        delete cableInfo[HH]['Equipment'][cablename]
      }
    }
    //bawak masuk info dari cableinfo Equipment untuk show cable mana yang amsuk ke dalam equipment
    for (let HH in cableInfo){
      // console.log('HH',HH)
      // if( HH == 'FWB3-15-01-01-01-HH'){
      //   console.log("cableInfo[HH]['Equipment']: ",cableInfo[HH])
      //   console.log('eqFromCableSheet: ',eqFromCableSheet[HH])
      // }
      for(let FiberName in cableInfo[HH]['Equipment']){
        let fNumber_arr =[]
        for(let fNumber in cableInfo[HH]['Equipment'][FiberName]){
          fNumber_arr.push(fNumber)
        }
        let new_fNumber = formatArray(fNumber_arr)
        for(let i = 0; i < new_fNumber.length; i++){
          let eqInfo = [`${new_fNumber[i]}`, '' ,'Equipment']
          try{
            cableInfo[HH]['SpliceInfo'][FiberName].push(eqInfo)
            cableInfo[HH]['SpliceInfo'][FiberName].sort((a, b) => {
                return parseInt(a[0]) - parseInt(b[0]);
              });
          }
          catch(error){
            let arr = cableInfo[HH]['Equipment']
            for(let fname in arr){
              
              if(fname == 'undefined'){
                delete cableInfo[HH]['Equipment'][fname]
              }
            }
          }
         
        }
      }
    }
    console.log('eqFromCableSheet: ',eqFromCableSheet)
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
  
    function findDirection(HHName,fiberName){
      const splitNames = fiberName.split('_to_');
      let namecable = splitNames[0]
      let nameHH = splitNames[1]
      let countHH = 0
      let Info = HH_Before[HHName]['Info']
      //nak cari HH tu ada berapa cable yang masuk kat dia
      for(let words in Info){
        if(nameHH == Info[words][4]){
          countHH = countHH + 1
        }
      }
      for (let words in Info){
        if(namecable == Info[words][0] && nameHH == Info[words][4]){
          return [Info[words][3], countHH]
        }
      }
    }
  
    function groupConsecutiveNumbersWithSameValue(arr) {
      let result = [];
      let start = parseInt(arr[0][0]);
      let end = start;
      let sameValue = arr[0][1];
      if(sameValue == 'DTS'){
        newValue = 'Secondary Splitter'
      }
      else{
        newValue = 'Primary Splitter'
      }
      for (let i = 1; i < arr.length; i++) {
          let current = parseInt(arr[i][0]);
          let currentValue = arr[i][1];
  
          if (current === end + 1 && currentValue === sameValue) {
              end = current;
          } else {
              if (start === end) {
                  let totalValue = end - start + 1
                  if(arr[i][4] > 1){
                    result.push(`In (${start.toString()}) ${arr[0][2]}(${arr[0][3]}) Out ${totalValue} ${newValue}`)
                  }
                  else{
                    result.push(`In (${start.toString()}) ${arr[0][3]} Out ${totalValue} ${newValue}`)
                  }
                  //result.push(start.toString() + ' ' + sameValue);
                  // result.push(`IN (${start.toString()}) ${arr[0][2]}(${arr[0][3]}) Out ${totalValue} ${sameValue}`)
                } 
                else {
                  let totalValue = end - start + 1
                  if(arr[i][4] > 1){
                    result.push(`In (${start.toString()}-${end.toString()}) ${arr[0][2]}(${arr[0][3]}) Out ${totalValue} ${newValue}`)
                  }
                  else{
                    result.push(`In (${start.toString()}-${end.toString()}) ${arr[0][3]} Out ${totalValue} ${newValue}`)
                  }
                  //result.push(start.toString() + '-' + end.toString() + ' ' + sameValue);
                  // result.push(`IN (${start.toString()}-${end.toString()}) ${arr[0][2]}(${arr[0][3]}) Out ${totalValue} ${sameValue}`)
                }
              start = current;
              end = current;
              sameValue = currentValue;
          }
      }
  
      // Add the last range
      if (start === end) {
          let totalValue = end - start + 1
          //result.push(start.toString() + ' ' + sameValue + ' ' + arr[0][2]);
          // result.push(`In (${start.toString()}) ${arr[0][2]}(${arr[0][3]}) Out ${totalValue} ${sameValue}`)
          result.push(`In (${start.toString()}) ${arr[0][3]} Out ${totalValue} ${newValue}`)

        } else {
          let totalValue = end - start + 1
          //result.push(start.toString() + '-' + end.toString() + ' ' + sameValue + ' ' +  arr[0][2]);
          result.push(`In (${start.toString()}-${end.toString()}) ${arr[0][3]} Out ${totalValue} ${newValue}`)
      }
  
      return result;
    }
  
    function extractFOC(inputString) {
      const splitNames = inputString.split('_to_');
      let namecable = splitNames[0]
      if(namecable.startsWith('LA') || namecable.startsWith('BB'))
      {
        return namecable
      }
      else{
        const lastIndex = namecable.lastIndexOf('-');
        if (lastIndex !== -1 && lastIndex < namecable.length - 1) {
          if(!namecable.substring(lastIndex + 1).includes('FOC')){
            return namecable.substring(lastIndex - 3);
          }
          else{
            return namecable.substring(lastIndex + 1);
          }
          
        } else {
          return namecable;
        }
      }
      
    }
    //highligt the path
    function HighlightFiberPath(HHname){
      function highlightFiberandHH(arr){
        freeze = true
        // Check if any fiber does not have same path
        let filteredArrays = Object.entries(arr).filter(([key]) => key !== 'DTS' && key !== 'Fail');
        let lengths = filteredArrays.map(([_, array]) => array.reduce((acc, cur) => acc + cur.length, 0));
        let uniqueLengths = new Set(lengths);
        let diffLength = uniqueLengths.size > 1;

        let minLength = Infinity;
        let shortestKey = null;

        if (diffLength) {
            filteredArrays.forEach(([key, array]) => {
                let length = array.reduce((acc, cur) => acc + cur.length, 0);
                if (length < minLength) {
                    minLength = length;
                    shortestKey = key;
                }
            });
        }
        //highlight selected fiber color
        for(let fiberIn in arr){
          for(let i = 0; i < arr[fiberIn].length; i++){
            if(arr[fiberIn][i].length == 5){
              let colors = 'yellow'
              //highlight fiber
              let leafletID = arr[fiberIn][i][4]
              let HH = arr[fiberIn][i][2]
              Layers[0]._layers[leafletID].setStyle({
                color: colors,
              })
              //highlight HH
              for(let j = 0; j<storeHHColor.length;j++){
                if(storeHHColor[j][0] == HH){
                  HHlayer[j].setStyle({
                    fillColor: colors,
                    fillOpacity: 0.9,
                  })
                  if(i ==0){
                    HHlayer[j].setStyle({
                      color: colors,
                      fillColor: colors,
                      fillOpacity: 0.9,
                    })
                  }
                  break;
                }
              }
            }
          }
        }

        //highlight the wrong cable
        if(diffLength){
          console.log('shortestKey: ',shortestKey)
          for(let i = 0; i < arr[shortestKey].length; i++){
            if(arr[shortestKey][i].length == 5){
              let colors = '#f55b8b'
              //highlight fiber
              let leafletID = arr[shortestKey][i][4]
              let HH = arr[shortestKey][i][2]
              Layers[0]._layers[leafletID].setStyle({
                color: colors,
              })
            }
          }
        }
      }
        //highlight incoming path from PS
      function HighlightFiberPath_FromPS(arr){
        freeze = true
        // Check if any fiber does not have same path
        // Check if any fiber does not have same path
        let filteredArrays = Object.entries(arr).filter(([key]) => key !== 'DTS' && key !== 'Fail');
        let lengths = filteredArrays.map(([_, array]) => array.reduce((acc, cur) => acc + cur.length, 0));
        let uniqueLengths = new Set(lengths);
        let diffLength = uniqueLengths.size > 1;

        let minLength = Infinity;
        let shortestKey = null;

        if (diffLength) {
            filteredArrays.forEach(([key, array]) => {
                let length = array.reduce((acc, cur) => acc + cur.length, 0);
                if (length < minLength) {
                    minLength = length;
                    shortestKey = key;
                }
            });
        }
        for(let fiberIn in arr){
          for(let i = 0; i < arr[fiberIn].length; i++){
            if(arr[fiberIn][i].length == 5 && arr[fiberIn][i][4] != undefined){
              //highlight fiber
              let leafletID = arr[fiberIn][i][4]
              let HH = arr[fiberIn][i][2]
              Layers[0]._layers[leafletID].setStyle({
                color: '#40E0D0',
              })
              //highlight HH
              for(let j = 0; j<storeHHColor.length;j++){
                if(storeHHColor[j][0] == HH){
                  HHlayer[j].setStyle({
                    fillColor: '#40E0D0',
                    fillOpacity: 0.9,
                  })
                  break;
                }
              }
            }
          }
        }

        //highlight cable yang tak sama length
        if(diffLength){
          console.log('shortestKey: ',shortestKey)
          for(let i = 0; i < arr[shortestKey].length; i++){
            if(arr[shortestKey][i].length == 5){
              let colors = '#f55b8b'
              //highlight fiber
              let leafletID = arr[shortestKey][i][4]
              let HH = arr[shortestKey][i][2]
              Layers[0]._layers[leafletID].setStyle({
                color: colors,
              })
            }
          }
        }
      }
      //clear highlight color for fiber
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
        //HHlayer[i].options.color = 'red'
      }
      
      let arr = HHtoObserve[HHname]
      if(arr!= undefined){
        console.log('arr',arr)
        highlightFiberandHH(arr)
      }
      
      let arr_PS = hhFromPS[HHname]
      if(arr_PS != undefined){
        freeze = true
        for(let fibername in arr_PS){
          if(fibername == 'IncomingFiber'){
            for(let cable in arr_PS[fibername]){
              console.log('IncomingFiber: ',arr_PS['IncomingFiber'][cable])
              let temp_ = arr_PS[fibername][cable]
              HighlightFiberPath_FromPS(temp_)
            }
          }
          else{
            console.log('HH served: ',arr_PS[fibername])
            for(let fiberIn in arr_PS[fibername]){
              let HH = arr_PS[fibername][fiberIn]
              let highlightArr = HHtoObserve[HH]
              highlightFiberandHH(highlightArr)
            }
          }
          
        }
        
      }

      if(HH_Before[HHname]['Drop'].length> 0){
        let prop = `${HH_Before[HHname]['Drop'].length} Drop are not Connect:\n`
        for(let i = 0; i < HH_Before[HHname]['Drop'].length; i++){
          prop += HH_Before[HHname]['Drop'][i] + `\n`
        }

        alert(`${prop}`)
      }
    }

    //find the duplicate name of HH
    let popup = ''
    if(showDuplicateHH.length > 0){
      for(let i = 0; i< showDuplicateHH.length; i++){
        popup += `${showDuplicateHH[i]}\n`
      }
      console.log('duplicateHH: ',showDuplicateHH)
      alert("Please change this HH's name: \n" + popup)
    }
  
    //create HH into map
    HH_coordinate.forEach((feature, hh_index) => {
      let description = '', eq_desc = '', new_name
      let arr_fibers = {}
      const name = feature[0]
      new_name = name
      //tukaq nama kalau nama hh guna ID (ni berguna kalau untuk job yang echo buat)
      if(name.includes('HH-')){
        let arr1 = HH_Before[name]['Equipment']
        for(let cable in arr1){
          for(let fIN in arr1[cable]){
            new_name = arr1[cable][fIN][0][0].replace(/\(\d+\)◀/, '')
          }
        }
      }
      const lat = feature[1];
      const lon = feature[2];

      //getInfo that not cut and passthrough for simplified splicing INFO
      let labelDesc = [], new_desc =[], arrKeys =[], arrDTS =[]
      //for splicing
      for(let fibername in HH_Before[name]['SpliceInfo']){
        let arr = HH_Before[name]['SpliceInfo'][fibername]
        for(let i =0; i < arr.length; i++){
          //console.log('arr[i][2]: ',arr[i][2])
          if(arr[i][2] == 'Cut' || arr[i][2] == 'Passthrough'){
            continue
          }
          else{
            let direction = findDirection(name,fibername)
            let directionIn = direction[0]
            let countIn = direction[1]
            let foc_in = extractFOC(fibername)
            let foc_out = extractFOC(arr[i][2])

            if(arr[i][2] === "Equipment"){
              continue
            }
            else{
              let direction = findDirection(name,arr[i][2])
              let directionOut = direction[0]
              let countOut = direction[1]
              if(countIn > 1 && countOut> 1){
                labelDesc.push(`In ${foc_out}(${arr[i][1]})${directionOut} Out ${foc_in}(${arr[i][0]})${directionIn}<br>`)
              }
              else if(countIn > 1){
                labelDesc.push(`In (${arr[i][1]}) (${directionOut}) Out ${foc_in}(${arr[i][0]})${directionIn}<br>`)
              }
              else if(countOut > 1){
                labelDesc.push(`In ${foc_out}(${arr[i][1]})${directionOut} Out (${arr[i][0]})${directionIn}<br>`)
              }
              else{
                labelDesc.push(`In (${arr[i][1]}) ${directionOut} Out (${arr[i][0]}) ${directionIn}<br>`)    
              }              
            }
          }
        }
      }
      //for equipment
      for(let fibername in HH_Before[name]['Equipment']){
        let direction = findDirection(name,fibername)
        let directionIn = direction[0]
        let countIn = direction[1]
        let keys = Object.keys(HH_Before[name]['Equipment'][fibername])
        let arr_check =[]

        for(let i = 0; i < keys.length; i++){
          if(HH_Before[name]['Equipment'][fibername][keys[i]][0].length === 4){
            arr_check.push([keys[i],'PS', extractFOC(fibername), directionIn, countIn])
            HH_coordinate[hh_index][3] = 'PS'
          }
          else{
            arr_check.push([keys[i],'DTS', extractFOC(fibername), directionIn, countIn])
            arrDTS.push([keys[i],fibername])
          }
          for(let j = 0; j <HH_Before[name]['Equipment'][fibername][keys[i]].length; j++ ){
            let inc
            let arr = HH_Before[name]['Equipment'][fibername][keys[i]][j]
            if (i == 0){
              inc = 0
            }
            else{
              inc = i * 8
            }
            
            if(arr.length ==4){
              let parts = arr[1].split('-')
              let PortRange
              if(parts.length > 1){
                let val1 = Number(parts[0]) + inc
                let val2 = Number(parts[1]) + inc
                PortRange = `${val1}-${val2}`
              }
              else{
                let val1 = Number(parts[0]) + inc
                PortRange = `${val1}`
              }
              let direction = findDirection(name,arr[3])              
              if(direction == undefined){
                new_desc.push(`In (Port ${PortRange}) Out Secondary Splitter`)
              }
              else{
                let directionOut = direction[0]
                let countOut = direction[1]
                let foc_out = extractFOC(arr[3])

                if(countOut> 1){
                  new_desc.push(`In (Port ${PortRange}) Out ${foc_out}(${arr[2]})${directionOut}`)
                }
                else{
                  new_desc.push(`In (Port ${PortRange}) Out (${arr[2]}) ${directionOut}`)
                }
              }
            }       
          }
        }
        arrKeys.push(groupConsecutiveNumbersWithSameValue(arr_check))
        
        // console.log('new_desc: ',new_desc)
        // console.log('arrKeys: ',arrKeys)
      }
      //store HH that has DTS
      if(arrDTS.length > 0){
        HHtoObserve[name]= {'DTS': arrDTS}
      }
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
  
          //console.log('nameHH', name ,'\narr',arr)
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
      // console.log('labelDesc: ',labelDesc)//ni cable splicing
      // console.log('arrKeys: ',arrKeys)//ni cable yang masuk ke eq
      // console.log('new_desc: ',new_desc)//ni port
      let popupContent = `
      <div class="custom-popup">
          <div id="page1">
              <h2><strong>${name} : </strong> Splicing Information (simplified)</h2>
              <strong>${new_name}</strong><br>
              ${labelDesc.join('')}
              ${arrKeys.join('<br>')}<br> 
              ${new_desc.join('<br>')}<br>
          </div>
  
          <div id="page2" style="display: none;">
              <h2><strong>${name} : </strong> Splicing Information</h2><br>
              ${new_description}
          </div>
  
          <div id="page3" style="display: none;">
              <h2><strong>${name} : </strong> Equipment</h2>
              ${eq_desc}
          </div>
          <div id="navigation">
              <button onclick="showPage(1)">1</button>
              <button onclick="showPage(2)">2</button>
              <button onclick="showPage(3)">3</button>
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

      // Create circle marker
      let color = 'green'
      let fillColor = 'rgb(144, 238, 144)' //lightgreen

      if(HHtoObserve[name]){
        color = 'blue'
        fillColor = 'lightblue'
      }
      if(HH_coordinate[hh_index][3] == 'PS'){
        color = 'white'
        fillColor = 'black'
        hh_PS.push((HH_coordinate[hh_index][0]))
      }

      if(duplicateHH.includes(HH_coordinate[hh_index][0])){
        color = 'green'
        fillColor = 'purple'
      }

      if(HH_Before[name]['Drop'].length>0){
        fillColor = '#666a6e'
      }

      geo_HHlayer = L.circleMarker([lat, lon], {
        radius: 8,
        color: color,
        fillColor: fillColor,
        fillOpacity: 1
      });

      geo_HHlayer.properties = {
        name: name,
        lat: lat,
        long:lon
      };
      // Create a popup with the feature name
      geo_HHlayer.bindPopup(popupContent);
  
      // Add a click event to show the popup
      geo_HHlayer.on('click', function() {
          this.openPopup();
          if(Layers.length > 0){
            console.log('ID:', this.properties.name);
            let HHname = this.properties.name
            HighlightFiberPath(HHname)
          }
      });
      storeHHColor.push([name, color, fillColor])
      geo_HHlayer.addTo(map)
      HHlayer.push(geo_HHlayer)
    })
    
    let lat = HH_coordinate[0][1]
    let long = HH_coordinate[0][2]
    let zoomLevel = 15
    map.setView([lat, long], zoomLevel);
}
let failTracingHH = []
function TraceFiber(){ 
  function extractFiberValuePS(arr){
    let result = []
    for(let i = 0; i < arr.length; i++){
      let fiberRange
      try{
         fiberRange = arr[i][2].split('-')
      }
      catch(error){
        fiberRange = [arr[i][2]]
      }
      
      let cableTo = arr[i][3]
      let len = fiberRange.length - 1
      for(let j = Number(fiberRange[0]); j <= Number(fiberRange[len]); j++){
        result.push([j, cableTo])
      }
    }
    return result
    
  }
  function isInRange(value, range) {
    value = Number(value)
    let range_num = range.split('-')
    if(range_num.length == 1){
      range = `${range}-${range}`
    }
    range = range.split('-')
    for(let i = Number(range[0]); i<= Number(range[1]); i++){
      if(i == value){
        return true
      }
    }
    return false
  }
  //cari fiber yang splicing
  function pickNewValue(arr, value){
    range1 = arr[0].split('-')
    range2 = arr[1].split('-')
    if (range1.length == 1){
      return arr[1]
    }
    let index_1 = 0, index_2 = 0

    for(i = Number(range1[0]); i<= Number(range1[1]); i++){
      if(i == Number(value)){
        break;
      }
      index_1++
    }
    for(i = Number(range2[0]); i<= Number(range2[1]); i++){
      if(index_2 == index_1){
        return i.toString()
      }
      index_2++
    }
  }
  //console.log('hh_PS: ',hh_PS)
  console.log('HHtoObserve: ',HHtoObserve)

  //store PS fiber and cable out
  for(let i=0; i < hh_PS.length; i++ ){
    let HHname = hh_PS[i], fiber_cableOut = []
    let arr_equipment = HH_Before[HHname]['Equipment']
    for(let cableIn in arr_equipment){
      for(let fiberin in arr_equipment[cableIn]){
        let arr = arr_equipment[cableIn][fiberin]
        let fiberRange = extractFiberValuePS(arr)
        fiber_cableOut.push(...fiberRange)
      }
    }
    HH_Before[HHname]['PS'] = fiber_cableOut
  }
  //now lets the game begin (find end HH for each HH that has DTS)
  for(let HH in HHtoObserve){
    let temp_fail =[]
    for(let i = 0; i < HHtoObserve[HH]['DTS'].length; i++){
      let temp_dict =[]
      let fiberIN = HHtoObserve[HH]['DTS'][i][0]
      let cable = HHtoObserve[HH]['DTS'][i][1].split('_to_')
      let cableIn = cable[0], HHTo = cable[1]
      let destination = false, currentHH = HH
      let value = fiberIN

      while (destination == false){
        temp_dict.push([value,cableIn,currentHH,HHTo])
        let notfound = true
        let arr
        try{
          arr = HH_Before[HHTo]['SpliceInfo'][`${cableIn}_to_${currentHH}`]
          if(arr == undefined){
            arr= []
            destination = true
          }
        }
        catch(error){
          arr= []
          destination = true
        }
        for(let j = 0; j < arr.length; j++){
          let range = arr[j][0]
          if(isInRange(value, range)){
            if(arr[j][2] == 'Cut' || arr[j][2] == 'Equipment'){
              notfound = true
              break;
            }
            else if (arr[j][2] == 'Passthrough'){
              value = value
              currentHH = HHTo
              cable = arr[j][1].split('_to_')
              cableIn = cable[0]
              HHTo = cable[1]
              notfound = false
              break;
            }
            else{
              value = pickNewValue(arr[j], value)
              currentHH = HHTo
              cable = arr[j][2].split('_to_')
              cableIn = cable[0]
              HHTo = cable[1]
              notfound = false
              break;
            }
          }
        }

        if(notfound == true){
          if(hh_PS.includes(HHTo)){
            let arr_2 = HH_Before[HHTo]['PS']
            for(let j = 0; j< arr_2.length; j++){
              let valueFromPS = arr_2[j][0]
              let cableFromPS = arr_2[j][1]
              if(Number(value) == valueFromPS && `${cableIn}_to_${currentHH}` == cableFromPS){
                destination = true
                temp_dict.push([value,cableIn,HHTo,'FromPS'])
                if (hhFromPS.hasOwnProperty(HHTo)) {
                  const existingDict = hhFromPS[HHTo];
                  let temp = {[value]: HH}
                  if(hhFromPS[HHTo].hasOwnProperty(`${cableIn}_to_${currentHH}`)){
                    Object.assign(hhFromPS[HHTo][`${cableIn}_to_${currentHH}`], temp);
                  }
                  else{
                    hhFromPS[HHTo] = {
                      ...existingDict,
                      [`${cableIn}_to_${currentHH}`]: {
                        [value]: HH
                      }
                    };
                  }
                } 
                else {
                    hhFromPS[HHTo] = {
                        [`${cableIn}_to_${currentHH}`]: {
                            [value]: HH
                        }
                    };
                }
              }
            }
            if(destination == false){
              destination = true
              temp_dict.push([value,cableIn,HHTo,'null'])
              temp_fail.push(fiberIN)
              if(!failTracingHH.includes(HH)){
                failTracingHH.push(HH)
              }
            }
          }
          else{
            destination = true
            temp_dict.push([value,cableIn,HHTo,'none'])
            //store HH and fiber that are not reached to PS
            temp_fail.push(fiberIN)
            if(!failTracingHH.includes(HH)){
              failTracingHH.push(HH)
            }
          }
          HHtoObserve[HH][fiberIN] = temp_dict
        }
      }
    }
    if(temp_fail.length > 0){
      HHtoObserve[HH]['Fail'] = temp_fail
    }
  }
  //Find end HH for incoming fiber in PS
  for(let HH in hhFromPS){
    let arr = HH_Before[HH]['Equipment']
    for(let fibername in arr){
      let arr_fiber = []
      for(let fiberIn in arr[fibername]){
        if(arr[fibername][fiberIn][0].length == 4){
          arr_fiber.push(fiberIn)
        }
      }
      //console.log('arr_fiber: ',arr_fiber)
      hhFromPS[HH]['IncomingFiber'] = {[fibername]: ''}
      for(let i= 0; i< arr_fiber.length; i++){
        let temp_dict =[]
        let fiberIN = arr_fiber[i]
        let cable = fibername.split('_to_')
        let cableIn = cable[0], HHTo = cable[1]
        let destination = false, currentHH = HH
        let value = fiberIN

        while(destination == false){
          temp_dict.push([value,cableIn,currentHH,HHTo])
          let notfound = true
          let arr
          try{
            // if(HH == 'FWB2-08-02-04-01-HH'){
            //   console.log('HHTo: ',HHTo)
            //   console.log('cableIn: ',cableIn)
            //   console.log('currentHH: ',currentHH)
            //   console.log('value: ',value)
            // }

            arr = HH_Before[HHTo]['SpliceInfo'][`${cableIn}_to_${currentHH}`]
            if(arr == undefined){
              arr= []
              destination = true
            }
          }
          catch(error){
            arr= []
            destination = true
          }
          for(let j = 0; j < arr.length; j++){
            let range = arr[j][0]
            if(isInRange(value, range)){
              // if(HH == 'FWB2-08-02-04-01-HH'){
              //   console.log('currentHH: ',currentHH)
              //   console.log('HHTo: ',HHTo)
              //   console.log('arr full: ',arr)
              //   console.log('arr[j]: ',arr[j])
              //   console.log('value: ',value)
              // }
              if(arr[j][2] == 'Cut' || arr[j][2] == 'Equipment'){
                notfound = true
                break;
              }
              else if (arr[j][2] == 'Passthrough'){
                value = value
                currentHH = HHTo
                cable = arr[j][1].split('_to_')
                cableIn = cable[0]
                HHTo = cable[1]
                notfound = false
                break;
              }
              else{
                value = pickNewValue(arr[j], value)
                currentHH = HHTo
                cable = arr[j][2].split('_to_')
                cableIn = cable[0]
                HHTo = cable[1]
                notfound = false
                break;
              }
            }
          }
          // if(HH == 'FWB2-08-01-01-06-HH'){
          //   console.log('value yang berubah: ',value)
          // }
          if(notfound == true){
            destination = true
            //temp_dict.push([value,cableIn,HHTo])
            if (!hhFromPS[HH]['IncomingFiber'][fibername]) {
              hhFromPS[HH]['IncomingFiber'][fibername] = {};
            }
            hhFromPS[HH]['IncomingFiber'][fibername][fiberIN] = temp_dict;
          }
        }
      }
    }
  }
  console.log('hhFromPS: ',hhFromPS)
  //highlight the wrong HH
  for(let i = 0; i< HHlayer.length; i++){
    if(failTracingHH.includes(HHlayer[i].properties.name)){
      HHlayer[i].setStyle({
        color: 'red',
        fillColor: 'rgb(255, 128, 128)'
      })
      if(duplicateHH.includes(HHlayer[i].properties.name)){
        HHlayer[i].setStyle({
          fillColor: 'purple',
        })
      }
      if(hh_PS.includes(HHlayer[i].properties.name)){
        HHlayer[i].setStyle({
          color: 'white',
          fillColor: 'rgb(255, 128, 128)'
        })
      }
      if(HH_Before[HHlayer[i].properties.name]['Drop'].length > 0){
        HHlayer[i].setStyle({
          fillColor : '#666a6e'
        })
        
      }
      //update store color
      storeHHColor[i] = [HHlayer[i].properties.name, HHlayer[i].options.color, HHlayer[i].options.fillColor]
    }
  }
  
  console.log('failTracingHH: ',failTracingHH)
  
}
