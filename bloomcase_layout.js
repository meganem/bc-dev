blHashExposed = {};
d3_layout_bloomcase = function() {
    var topLayer = 0, bottomLayer = 0, eventRelations = [], temporalProjection, eventHash = {}, tlWidth = 100, tlHeight = 100, temporalRange =[0,1], temporalType = "date", timeScale = 1, featureCollection, temporalPeriods = [], temporalEvents = [], timeSegments, numLanes = 1, earliestDate = 1, latestDate = 10;

    var firstNodes=[], lastNodes=[], numColumns = 1, blNodes = [], blLinks = [], columnStep = 30, blNodeHash = {};
    var shapeHierarchy = ["Draft", "Final", "Sketch","Idea","Inspiration", "last"];
//    var shapeHierarchy = ["last", "Inspiration", "Idea", "Sketch", "Final", "Draft", "last"];

    
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
                incNodes[incNode].column = -1;
                incNodes[incNode].row = -1;                
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
                if (incNodes[incNode].evolvedFrom) {
                    var linkArray = incNodes[incNode].evolvedFrom.split(",");
                    for (l in linkArray) {
                        var linkObject = {target: {}, source: {}}
                        if(linkArray[l]) {
                        linkObject.source = blNodeHash[linkArray[l]];
                        linkObject.target = blNodeHash[incNodes[incNode].nid];
                        blLinks.push(linkObject);
                        incNodes[incNode].evolvedFromArray.push(blNodeHash[linkArray[l]]);
                        }
                    }
                }
            }
        }
    }
    
    function hierarchicalLayout() {
        
        //Walk backward to find the lowest possible value
        for (blNode in blNodes) {
            var noMoreNodes = false;
            var remainingNodes = blNodes[blNode].evolvedFromArray.slice();
            while (noMoreNodes == false) {
                if (remainingNodes.length == 0) {
                    noMoreNodes = true;
                }
                else {
                    remainingNodes[remainingNodes.length - 1].column = blNodes[blNode].column - 1;
                    remainingNodes.pop();
                }
            }
        }
        
            //Now sort the nodes by placeholder column to the layout starts with the earliest discovered node    
    blNodes.sort(function (a,b) {
    if (a.column > b.column)
    return 1;
    if (a.column < b.column)
    return -1;
    return 0;
    });
    
    //Set the earliest node to column position 2 (we're numbering columns in intervals of 2 to leave room for meta-columns)
    blNodes[0].column = 2;

    //Step through the array again starting
    
    var nodesToBePositioned = 10000;

    var newLinks = [];
    for (z in blLinks) {
        if(blLinks[z]) {
            newLinks.push(blLinks[z])
        }
    }
    var countdown = 100;
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
                    console.log("first offset: " + offset)
                }
                else {
                    currentList[pc].row = offset;
                    offset++;
                    console.log(c);
                    console.log("later offset: " + offset)
                }
                }
                isFirst = false;
            currentList = [];
            }
    }
    }

}

function testThis() {
    	var shapeMeasures = {
	    Inspiration: {myWidth: 27, myHeight: 27,
	    pathd: "M24.248,26.755H2.833c-1.404,0-2.548-1.143-2.548-2.548V2.793c0-1.405,1.144-2.548,2.548-2.548h21.415 c1.405,0,2.549,1.143,2.549,2.548v21.414C26.796,25.612,25.653,26.755,24.248,26.755z"                            },
	    Final: {myWidth: 47.4, myHeight: 47.4,
	    pathd: "M47.392,44.295c0,1.709-1.388,3.096-3.097,3.096H3.096C1.386,47.391,0,46.004,0,44.295V3.096 C0,1.386,1.386,0,3.096,0h41.199c1.709,0,3.097,1.386,3.097,3.096V44.295z"
	    },
	    Draft: {myWidth: 35, myHeight: 34.8,
            pathd: "M31.42,34.758H3.341C1.5,34.758,0,33.26,0,31.419V3.341C0,1.499,1.5,0,3.341,0H31.42 c1.843,0,3.342,1.499,3.342,3.341v28.079C34.762,33.26,33.263,34.758,31.42,34.758z"
	    },
	    Sketch: {myWidth: 26.5, myHeight: 26.5,
	    pathd: "M23.963,26.51H2.548C1.143,26.51,0,25.367,0,23.962V2.548C0,1.143,1.143,0,2.548,0h21.415 c1.405,0,2.549,1.143,2.549,2.548v21.414C26.511,25.367,25.368,26.51,23.963,26.51z"
	    },
	    Idea: {myWidth: 33.8, myHeight: 38.6,
	    pathd: "M16.897,0C14.483,7.241,7.241,16.896,0,19.311c7.241,2.414,14.483,12.069,16.897,19.312 c2.414-7.241,9.654-16.896,16.896-19.312C26.551,16.896,19.311,7.241,16.897,0z"
	    }
	}

    newNodes = {};
    testLayout = new d3_layout_bloomcase();
    d3.json("new8.json", function(data) {newNodes = data;
    
    testLayout.nodes(newNodes.nodes);

    d3.select("#bloomG").selectAll("line").data(testLayout.links()).enter().append("line")
    .attr("x1", 30)
    .attr("x2", 30)
    .attr("y1", function(d,i) {return 200 + (d.source.row * 40)})
    .attr("y2", function(d,i) {return 200 + (d.target.row * 40)})
    .style("stroke", "black")
    .style("stroke-width", 2)
    .transition()
    .duration(1000)
    .attr("x1", function(d,i) {return d.source.column * 30})
    .attr("x2", function(d,i) {return d.target.column * 30}) 
    .attr("y1", function(d,i) {return 200 + (d.source.row * 40)})
    .attr("y2", function(d,i) {return 200 + (d.target.row * 40)})


    
    var secG = d3.select("#bloomG").selectAll("g.sec").data(testLayout.nodes()).enter().append("g")
    .attr("width", 20)
    .attr("height", 20)
    .attr("transform", function(d,i) {return "translate(30,"+ (200 + (d.row * 40)) +")"})
    
    secG.append("path")
    .attr("class", function(d){ return d.kind; })
    .attr("d", function(d,i) {return shapeMeasures[d.kind]["pathd"]})
    .attr("transform", function(d) { 
	return "translate(" + (-1*(shapeMeasures[d.kind]["myWidth"]/2)) + "," + (-1*(shapeMeasures[d.kind]["myHeight"]/2)) + ")"; 
    });

    secG.append("text")
                .attr("dx", -1)
                .attr("dy", ".35em")
                .attr("alignment-baseline", "center")
                .attr("text-anchor", "middle")
                .style("fill", "white")
                .text(function(d) { return d.nid });
    
    secG.transition().duration(1000)
    .attr("transform", function(d,i) {return "translate("+ (d.column * 30) +","+ (200 + (d.row * 40)) +")"})
    

    });
    
}
