blHashExposed = {};
d3_layout_bloomcase = function() {
    var topLayer = 0, bottomLayer = 0, eventRelations = [], temporalProjection, eventHash = {}, tlWidth = 100, tlHeight = 100, temporalRange =[0,1], temporalType = "date", timeScale = 1, featureCollection, temporalPeriods = [], temporalEvents = [], timeSegments, numLanes = 1, earliestDate = 1, latestDate = 10;

    var firstNodes=[], lastNodes=[], numColumns = 1, blNodes = [], blLinks = [], columnStep = 30, blNodeHash = {};
    var shapeHierarchy = ["Draft", "Final", "Sketch","Idea","Inspiration", "last", "meta"];
    shapeMeasures = {
	    Inspiration: {myWidth: 27, myHeight: 27, rank: 1,
	    pathd: "M24.248,26.755H2.833c-1.404,0-2.548-1.143-2.548-2.548V2.793c0-1.405,1.144-2.548,2.548-2.548h21.415 c1.405,0,2.549,1.143,2.549,2.548v21.414C26.796,25.612,25.653,26.755,24.248,26.755z"                            },
	    Final: {myWidth: 47.4, myHeight: 47.4, rank: 4,
	    pathd: "M47.392,44.295c0,1.709-1.388,3.096-3.097,3.096H3.096C1.386,47.391,0,46.004,0,44.295V3.096 C0,1.386,1.386,0,3.096,0h41.199c1.709,0,3.097,1.386,3.097,3.096V44.295z"
	    },
	    Draft: {myWidth: 35, myHeight: 34.8, rank: 5,
            pathd: "M31.42,34.758H3.341C1.5,34.758,0,33.26,0,31.419V3.341C0,1.499,1.5,0,3.341,0H31.42 c1.843,0,3.342,1.499,3.342,3.341v28.079C34.762,33.26,33.263,34.758,31.42,34.758z"
	    },
	    Sketch: {myWidth: 26.5, myHeight: 26.5, rank: 3,
	    pathd: "M23.963,26.51H2.548C1.143,26.51,0,25.367,0,23.962V2.548C0,1.143,1.143,0,2.548,0h21.415 c1.405,0,2.549,1.143,2.549,2.548v21.414C26.511,25.367,25.368,26.51,23.963,26.51z"
	    },
	    Idea: {myWidth: 33.8, myHeight: 38.6, rank: 2,
	    pathd: "M16.897,0C14.483,7.241,7.241,16.896,0,19.311c7.241,2.414,14.483,12.069,16.897,19.312 c2.414-7.241,9.654-16.896,16.896-19.312C26.551,16.896,19.311,7.241,16.897,0z"
	    }
	}

    
    this.nodes = function(newNodes) {
        if(newNodes) {
            blNodes = newNodes;
            processNodes(blNodes);
            createLinks(blNodes);
            hierarchicalLayout();
            return this;
        }
        else {
            return blNodes;
        }
    }
    
    this.firstNodes = function() {
        return firstNodes;
    }

    this.links = function(newLinks) {
        if(newLinks) {
            blLinks = newLinks;
            return this;
        }
        else {
            return blLinks;
        }
    }
    
    function processNodes(incNodes) {
        for (incNode in incNodes) {
            if (incNodes[incNode]) {
                var tArr = incNodes[incNode].timestamp.split("-");
                incNodes[incNode].datetime = new Date(tArr[0], tArr[1], tArr[2], tArr[3],tArr[4],tArr[5]);
                incNodes[incNode].column = -1;
                incNodes[incNode].row = -1;
                incNodes[incNode].isMeta = false;                
                incNodes[incNode].evolvedFromArray = [];
                blNodeHash[incNodes[incNode].nid] = incNodes[incNode];
                //Find any nodes that didn't evolve from other nodes to make the first pass at finding the first nodes
                //Later we need to identify which of these aren't connected to anything at all
                //As well as which started somewhere down the line
                if(!incNodes[incNode].evolvedFrom) {
                    firstNodes.push(incNodes[incNode])
                }
            }
        }
        blHashExposed = blNodeHash;
    }

    function createLinks(incNodes) {
        for (incNode in incNodes) {
            if (incNodes[incNode]) {
                if (incNodes[incNode].kind == "meta") {
                    return;
                }
                if (incNodes[incNode].evolvedFrom) {
                    var linkArray = incNodes[incNode].evolvedFrom.split(",");
                    for (l in linkArray) {
                        var linkObject1 = {target: {}, source: {}}
                        var linkObject2 = {target: {}, source: {}}
                        var metaNodeObject = {};
                        if(linkArray[l]) {
                        if (blNodeHash["meta" + incNodes[incNode].nid]) {
                            metaNodeObject = blNodeHash["meta" + incNodes[incNode].nid]
                        }
                        else {
                            metaNodeObject = {kind: blNodeHash[incNodes[incNode].nid].kind, datetime: blNodeHash[incNodes[incNode].nid].datetime, row: -1, column: -1, isMeta: true, nid: "meta" + incNodes[incNode].nid, evolvedFromArray: []}
                        blNodes.push(metaNodeObject);
                        incNodes[incNode].evolvedFromArray.push(metaNodeObject);
                            blNodeHash["meta" + incNodes[incNode].nid] = metaNodeObject;
                        }
                        linkObject1.source = blNodeHash[linkArray[l]];
                        linkObject1.target = metaNodeObject;
                        linkObject2.source = metaNodeObject;
                        linkObject2.target = blNodeHash[incNodes[incNode].nid];
                        metaNodeObject.evolvedFromArray.push(blNodeHash[linkArray[l]]);
                        blLinks.push(linkObject1);
                        blLinks.push(linkObject2);
                        }
                    }
                }
            }
        }
    }
    
    function hierarchicalLayout() {
        
        //Walk backward to find the lowest possible value
        for (blLink in blLinks) {
            blLinks[blLink].target.column--;
            if(blLinks[blLink].source.nid == "1") {
                blLinks[blLink].source.column++;
            }
        }
        
            //Now sort the nodes by placeholder column to the layout starts with the earliest discovered node    
    blNodes.sort(function (a,b) {
    if (a.column < b.column)
    return 1;
    if (a.column > b.column)
    return -1;
    return 0;
    });
    
    //Set the earliest node to column position 2 (we're numbering columns in intervals of 2 to leave room for meta-columns)
    blNodes[0].column = 2;

    //Step through the array again starting
    var newLinks = [];
    for (z in blLinks) {
        if(blLinks[z]) {
            newLinks.push(blLinks[z])
        }
    }
    while (newLinks.length > 0) {
        for (l in newLinks) {
            if (newLinks[l]) {
            if (newLinks[l].source.column > 0 && newLinks[l].target.column < 0) {
                newLinks[l].target.column = newLinks[l].source.column + 2;
                newLinks.splice(l,1);
                break;
            }
            else if (newLinks[l].source.column < 0 && newLinks[l].target.column > 0) {
                newLinks[l].source.column = newLinks[l].target.column - 2;
                newLinks.splice(l,1);
                break;
            }
            else if (newLinks[l].source.column > 0 && newLinks[l].target.column > 0) {
                newLinks.splice(l,1);
                break;                
            }
            }
            else {
                newLinks.splice(l,1);
                break;                
            }
        }
    }
    //Arrange rows
    
    var columnsByRows = {};
    for (shapes in shapeHierarchy) {
        for (bn in blNodes) {
            if (blNodes[bn].kind == shapeHierarchy[shapes]) {
                if (!columnsByRows[blNodes[bn].column]) {
                    columnsByRows[blNodes[bn].column] = [];
                }
                columnsByRows[blNodes[bn].column].push(blNodes[bn]);
            }
        }
    }

    for (col in columnsByRows) {
    columnsByRows[col].sort(function (a,b) {
    var sortReturn = 0;
    if (shapeMeasures[a.kind]["rank"] < shapeMeasures[b.kind]["rank"])
    return 1;
    if (shapeMeasures[a.kind]["rank"] > shapeMeasures[b.kind]["rank"])
    return -1;
    if (a.datetime < b.datetime)
    return 1;
    if (a.datetime > b.datetime)
    return -1;
    return 0;
    });
    }
    
    exposedCols = columnsByRows;
            var currentKind = "";
        var currentList = [];
        var offset = 0;
        var isFirst = true;
        
    for (c in columnsByRows) {
        currentKind = "";
        currentList = [];
        offset = 0;
        isFirst = true;
        for (node in columnsByRows[c]) {
        if (columnsByRows[c][node].kind == currentKind) {
                currentList.push(columnsByRows[c][node]);
        }
            else {
            placeRows();
            currentKind = columnsByRows[c][node].kind
            currentList.push(columnsByRows[c][node]);
            }
        }
        placeRows();
    }
    
    function placeRows() {
               if (currentList.length > 0) {
                for (pc in currentList) {
                if (isFirst == true) {
                    currentList[pc].row = pc - (currentList.length / 2)
                    offset = (currentList.length / 2);
                }
                else {
                    currentList[pc].row = offset;
                    offset++;
                }
                }
                isFirst = false;
            currentList = [];
            }
    }
    }

}
