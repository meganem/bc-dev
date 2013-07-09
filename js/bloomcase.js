// Javascript for Bloomcase Map Visualization

 // get the json
var jsonPath = "json/8.json";
var jsonEvolvedTo = "json/evolvedTo.json";

// variables for processing data
var format = d3.time.format("%Y-%m-%d-%H-%M-%S");
var originNodes = [];
var endNodes =[];
var links = [];
var nodes = [];
var eTo = [];

// reusable function for converting nested elements from string to int
function nestedToInt(myNest) {
    for(var i=0; i<myNest.length; i++) { 
        myNest[i] = +myNest[i]; 
    }
}

// START parseEvolvedTo function
function parseEvolvedTo(eToData) {
    eTo = eToData.nodes;

    // format the data better
    eTo.forEach(function(d) {
        myETo = d.node;
        myETo.nid = parseInt(myETo.nid);
        if(myETo.evolvedTo != false) {
            myETo.evolvedTo = parseInt(myETo.evolvedTo);
        }
    })
} // * END parseEvolvedTo function *

// START parseData function
function parseData(data) {
    nodes = data.nodes;

    // START loop through data
    nodes.forEach(function(d) {
        myNode = d.node;

        // parse data
        myNode.nid = parseInt(myNode.nid);
        myNode.timestamp = format.parse(myNode.timestamp);
        
        // convert evolvedFrom strings to arrays
        myNode.evolvedFrom = myNode.evolvedFrom.split(",");

        // convert evovledFrom data to ints
        nestedToInt(myNode.evolvedFrom);
        myNode.evolvedTo = [];
        myNode.colGroup = 0;

        // assign evolvedTo data
        for(i=0; i<eTo.length; i++) {
            if ((myNode.nid == eTo[i].node.nid) && (eTo[i].node.evolvedTo != false)) {
                myNode.evolvedTo.push(eTo[i].node.evolvedTo);
            }
        }

        // find all origin nodes
        if(myNode.evolvedFrom == false) {
            originNodes.push(myNode.nid);
        }
        
        // find all end nodes
        if(myNode.evolvedTo == false) {
            endNodes.push(myNode.nid);
        }

        // set default weight
        myNode.weight = 1;

        // set default myLongestPath
        myNode.myLongestPath = 0;
        
    }) // * END loop through data *
    console.log ("ORIGIN NODES ARE:", originNodes);
    console.log ("END NODES ARE:", endNodes);


    // * * * FIND NODE COLUMN GROUPS * * *

    // set default counts
    var longestCount = 0;
    var tempCount = 0;

    // START countSteps function - this gets longest path on the map!
    function countSteps(myNodes, parents, chain) {
        // START loop through nodes array
        //console.log("Starting my loop on the following nodes...", myNodes);
        for (var i=0; i<myNodes.length; i++) {
            //console.log("* * * * * * * * * * * * COUNTING NODE ID:", myNodes[i]);

            // if node is an origin node, reset the tempCount because we've started a new path
            if(originNodes.indexOf(myNodes[i]) != -1) {
                tempCount = 0;
            }
            //console.log("tempcount:", tempCount);
            //console.log("parents:", parents-1);
            if(tempCount > parents-1) {
                tempCount = parents-1;
            }

            //add node at specific position
            chain[tempCount] = myNodes[i];
            //console.log("node added to chain at position:", tempCount);
            // remove all elements in chain after this node
            for(var j=chain.length-1; j>0; j--) {
                if (j>tempCount) {
                    chain.splice(j,1);
                }
            }

            var newNodes = [];
            // get evolvedTo data for this node
            for(m = 0; m < nodes.length; m++) {
                if (nodes[m].node.nid == myNodes[i]) {
                    newNodes = nodes[m].node.evolvedTo;
                    // check whether sotred col group for that node is less than number of parents, if so, set col group = parents
                    if(nodes[m].node.colGroup < parents) {
                        nodes[m].node.colGroup = parents;
                    }
                }
            }
            //console.log("newNodes:", newNodes);

            // see if node has NO evolvedTo data - I've hit a dead end.
            if(newNodes.length === 0) {
                // if tempCount is bigger than longestCount
                if(tempCount > longestCount) {
                    // we found a new longest count!
                    longestCount = tempCount;
                }
                //console.log("I've hit a dead end at node", myNodes[i]);
                //console.log("My longest chain:", chain);

                // loop through all nodes in chain and assign myLongestPath
                for(var k=0; k<chain.length; k++) {
                    var thisNode = 0;
                    // find match by nid
                    for(m = 0; m < nodes.length; m++) {
                        if (nodes[m].node.nid == chain[k]) {
                            thisNode = nodes[m].node;
                        }
                    }
                    var longestPath = chain.length;
                    // check if existing myLongestPath is less than the new one we found
                    if(thisNode.myLongestPath < longestPath) {
                        thisNode.myLongestPath = longestPath;
                        //console.log("node was updated:", thisNode.nid + " to longestPath: " + thisNode.myLongestPath);
                    }
                }

                if(tempCount > parents-1) {
                    tempCount = parents-1;
                }
                
            } else { // if there are children nodes

                // increase the tempCount to match # of parents
                tempCount = parents;
                //console.log("My chain:", chain);
                
                // run the recursive function, pass it the children nodes, the new tempCount, and the chain to track nodes that have come before
                if(chain.length < 20) {
                    countSteps(newNodes, tempCount + 1, chain);
                }
            }
        } // * END loop through nodes *

    } // * END countSteps function *

    // run the countSteps function
    countSteps(originNodes, 1, []);
    console.log("Number of columns on my map:", longestCount+1);


    // * * * FIX ORIGIN NODE POSITIONS * * * 
    // START loop through origin nodes
    for (var i=0; i<originNodes.length; i++) {
        var myChildren = [];
        var originNode = 0;
        // find match by nid to get evolvedTo data
        for(m = 0; m < nodes.length; m++) {
            if (nodes[m].node.nid == originNodes[i]) {
                originNode = nodes[m].node;
                myChildren = nodes[m].node.evolvedTo;
            }
        }
        //console.log("myChildren:", myChildren);

        // find lowest number of children col
        myChildPos = [];
        for (var j=0; j<myChildren.length; j++) {
            for(m = 0; m < nodes.length; m++) {
                if (nodes[m].node.nid == myChildren[j]) {
                    myChild = nodes[m].node.colGroup;
                    myChildPos.push(myChild);
                }
            }
        }

        // find the lowest position of children
        lowestChild = d3.min(myChildPos);

        // check if my current colNum is less than that of children
        if (originNode.colGroup < (lowestChild-1)) {
            // change my column number to be 1 degree removed from closest child
            originNode.colGroup = lowestChild - 1;
        }
    } // * END loop through origin nodes



    // * * * SET NODE (X,Y) POSITIONS and MAP DIMENSIONS * * * 

    // calculate chart width based on longest count
    var gridSpacing = 100;
    var margin = 2*gridSpacing;
    var mapWidth = (gridSpacing*longestCount);
    var chartWidth = (mapWidth + 2*margin);

    // set initial x for each node
    for(m = 0; m < nodes.length; m++) {
        colPos = nodes[i].node.colGroup;
        var nodesX = (chartWidth/2 - mapWidth/2) + ((colPos - 1) * gridSpacing);
        nodes[i].node.x = nodesX;
        nodes[i].node.px = nodesX;
    }

    // loop through each column and sort nodes by timestamp
    var nest = d3.nest()
        .key(function(d) { return d.node.colGroup; })
        .sortValues(function(a,b) { return ((a.timestamp < b.timestamp) ? -1 : 1); return 0;} )
        .entries(nodes);
    //console.log("nest: ", nest);

    // find the tallest column
    var columnCounts = [];
    for(var i=0; i<nest.length; i++) {
        // keep track of the length of each column in a new array
        columnCounts.push(nest[i].values.length);
    }
    var tallestColumn = d3.max(columnCounts);

    // set chartHeight based on tallest column
    var mapHeight = (tallestColumn*gridSpacing);
    var chartHeight = mapHeight + margin;

    // set y positions for each node
    for (var i=0; i<nodes.length; i++) {
        // which column am I in?
        var myColumn = nodes[i].node.colGroup;
        var myNid = nodes[i].node.nid;
        //console.log("* * * * * * * my NID", myNid);
        //console.log("myColumn", myColumn);
        // get how many total are in this column and calculate column height
        var myColHeight = (columnCounts[myColumn-1])*(gridSpacing/2);
        // get position of this node in context of column array
        var nestedNodes = nest[myColumn-1].values;
        // use variable to set nest position
        var myNestPos = 0;
        for(var j = 0; j < nestedNodes.length; j++) {
            if(nestedNodes[j].nid === myNid) {
                myNestPos = j;
                nodes[i].node.myNestPosition = myNestPos;
            }
        }
        //console.log("my nest position is", myNestPos + " for nid " + myNid);

            // TO DO: if node has children and is in a column group larger than 2, place relative to myLongestPath
            if ((nodes[i].node.evolvedTo != false) && (nestedNodes.length > 2)) {
                var middleOfCol = Math.round(nestedNodes.length/2);
                // remove item from the nest
                nestedNodes.splice(myNestPos, 1);
                // place item back in the middle
                nestedNodes.splice(middleOfCol, 0, nodes[i]);
                nodes[i].node.myNestPosition = middleOfCol;
                //console.log("my updated column", nestedNodes);
                //console.log("my NEW nest position is", middleOfCol + " for nid " + myNid);
            }

        // TO DO:
        // assign position in nested array based on myLongestPath, where larger numbers are towards the center of the array
        // for nodes that have the same value, use timestamp to decide who comes first
        // target origin or end nodes that are NOT part of longest path and force them to be relative to their children and smaller numbers for myLongestPath


        // calculate y position based on nest position
        var yPos = (margin/2) + ((mapHeight - myColHeight)/2) + (myNestPos * gridSpacing/2);
        
        // set default y positions for entry, but don't set as fixed
        nodes[i].node.y = yPos;
        nodes[i].node.py = yPos;

        /*// TO DO: round to nearest 50px for Y
        var gridNum = 50;
        nodes[i].y = gridNum * Math.floor((nodes[i].y/gridNum)+0.5);
        nodes[i].py = gridNum * Math.floor((nodes[i].py/gridNum)+0.5);*/

        // set y positions only for origin and end nodes on longest path
        if(myNid == 1 || myNid == 21) {
            nodes[i].node.fixed = true;
        }
        
    }	
    //console.log("NEW nest: ", nest);


    // * * * CREATE LINKS ARRAY * * *
    for (var i=0; i<nodes.length; i++) {
        // find evolvedTo for this node
        var myChildren = nodes[i].node.evolvedTo;
        var myNid = nodes[i].node.nid;
        // if evolvedTo is not empty
        if(myChildren.length != 0) {
            // loop through for each child
            for (var j=0; j<myChildren.length; j++) {
                for(m = 0; m < nodes.length; m++) {
                    if (nodes[m].node.nid == myChildren[j]) {
                        // add to links array
                        var newLink = {source: nodes[i].node, target: nodes[m].node};
                        links.push(newLink);
                    }
                }
            }
        }
    }
    //console.log("NODES:", nodes);
    console.log("LINKS:", links);

    // generate simpler data
    var finalNodes = [];
    for (var i=0; i<nodes.length; i++) {
        finalNodes[i] = nodes[i].node;
    }
    console.log("finalNodes", finalNodes);


    // * * * DRAW THE MAP * * *

    // draw the SVG
    var svg = d3.select("#timeline")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    var force = d3.layout.force()
        .gravity(.06)
        .distance(100)
        .charge(-2000)
        .theta(1)
        .linkStrength(.5)
        .friction(.1)
        .size([chartWidth, chartHeight])
        .nodes(finalNodes) // target nodes data
        .links(links) // target links data
        .start();

    var link = svg.selectAll(".link")
        .data(links) // target links data
        .enter().append("path")
        .attr("class", "link");

    var node = svg.selectAll(".node")
        .data(finalNodes) // target nodes data
        .enter().append("g")
        .attr("class", "node")
        .call(force.drag);

    node.append("path")
        .attr("class", function(d){ return d.kind; })
        .attr("d", function(d) {
            switch(d.kind) {
                case "Inspiration":
                    return "M24.248,26.755H2.833c-1.404,0-2.548-1.143-2.548-2.548V2.793c0-1.405,1.144-2.548,2.548-2.548h21.415 c1.405,0,2.549,1.143,2.549,2.548v21.414C26.796,25.612,25.653,26.755,24.248,26.755z";
                    break;
                case "Final":
                    return "M47.392,44.295c0,1.709-1.388,3.096-3.097,3.096H3.096C1.386,47.391,0,46.004,0,44.295V3.096 C0,1.386,1.386,0,3.096,0h41.199c1.709,0,3.097,1.386,3.097,3.096V44.295z";
                    break;
                case "Draft":
                    return "M31.42,34.758H3.341C1.5,34.758,0,33.26,0,31.419V3.341C0,1.499,1.5,0,3.341,0H31.42 c1.843,0,3.342,1.499,3.342,3.341v28.079C34.762,33.26,33.263,34.758,31.42,34.758z";
                    break;
                case "Sketch":
                    return "M23.963,26.51H2.548C1.143,26.51,0,25.367,0,23.962V2.548C0,1.143,1.143,0,2.548,0h21.415 c1.405,0,2.549,1.143,2.549,2.548v21.414C26.511,25.367,25.368,26.51,23.963,26.51z";
                    break;
                case "Idea":
                    var myWidth = 34; 
                    var myHeight = 39;
                    return "M16.897,0C14.483,7.241,7.241,16.896,0,19.311c7.241,2.414,14.483,12.069,16.897,19.312 c2.414-7.241,9.654-16.896,16.896-19.312C26.551,16.896,19.311,7.241,16.897,0z";
                    break;
            }
    })
    .attr("transform", function(d) { 
        switch(d.kind) {
                case "Inspiration":
                    var myWidth = 27; 
                    var myHeight = 27;
                    return "translate(" + (-1*(myWidth/2)) + "," + (-1*(myHeight/2)) + ")"; 
                    break;
                case "Final":
                    var myWidth = 47.4; 
                    var myHeight = 47.4;
                    return "translate(" + (-1*(myWidth/2)) + "," + (-1*(myHeight/2)) + ")"; 
                    break;
                case "Draft":
                    var myWidth = 35; 
                    var myHeight = 34.8;
                    return "translate(" + (-1*(myWidth/2)) + "," + (-1*(myHeight/2)) + ")"; 
                    break;
                case "Sketch":
                    var myWidth = 26.5; 
                    var myHeight = 26.5;
                    return "translate(" + (-1*(myWidth/2)) + "," + (-1*(myHeight/2)) + ")"; 
                    break;
                case "Idea":
                    var myWidth = 33.8; 
                    var myHeight = 38.6;
                    return "translate(" + (-1*(myWidth/2)) + "," + (-1*(myHeight/2)) + ")"; 
                    break;
            }
    });

    node.on("click", function(d) {
        nodePopup(d);
    })

    function nodePopup(data) {
        var info = d3.select("#info").html("");
        info.append("div")
            .attr("class", "img-thumb")
            .append("img")
                .attr("src", data.imageUrl);
        info.append("div")
            .attr("class", "node-title")
            .text(data.title);
        info.append("div")
            .attr("class", "node-summary")
            .text(data.summary);
    }

    node.append("text")
        .attr("dx", -2)
        .attr("dy", ".35em")
        .attr("alignment-baseline", "center")
        .text(function(d) { return d.nid });

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    force.on("tick", function() {

        // Re-set x position for each node
        for (var i=0; i<finalNodes.length; i++) { 
            colPos = finalNodes[i].colGroup;
            var nodesX = (chartWidth/2 - mapWidth/2) + ((colPos - 1) * gridSpacing);
            // TO DO: round to nearest grid position
            finalNodes[i].x = nodesX;
            finalNodes[i].px = nodesX;
        }

        // draw curves
        link.attr("d", function(d) {
            var startX = d.source.x;
            var startY = d.source.y;
            var endX = d.target.x;
            var endY = d.target.y;
            var startQX = startX+(.4*(endX-startX));
            var startQY = startY;
            var endQX = startX+((endX-startX)/2);
            var endQY = startY+((endY-startY)/2);
            return "M" + startX + "," + startY + " " + "Q" + startQX + "," + startQY + " " + endQX + "," + endQY + " " + "T" + endX + "," + endY;
        });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });

} // * END parseData function *

// process the evolvedTo data so we can access it
d3.json(jsonEvolvedTo, parseEvolvedTo);
// process the nodes data
d3.json(jsonPath, parseData);