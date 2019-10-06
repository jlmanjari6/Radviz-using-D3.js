// global variables
var CIRCLE_RADIUS = 250;
var CIRCLE_CENTERX = 300;
var CIRCLE_CENTERY = 300;
var CLASS_NAME = "";
var DATASET = "iris.csv"
var DATA = Object;

generatePlot(DATASET);

// on change of dataset selection from dropdown
function onDataSetChange() {
    dataset_selected = document.getElementById("csvSelector").selectedIndex;
    if(dataset_selected == 0){
        DATASET = "iris.csv"
    }
    else if(dataset_selected == 1) {
        DATASET = "winequality-red.csv";
    }
    else if(dataset_selected == 2) {
        DATASET = "winequality-white.csv";
    }

    d3.select("svg").remove();
    this.generatePlot(DATASET);
}

//display anchors checkboxes
function displayanchors(columns) {
    // remove existing checkboxes
    d3.selectAll("input").remove();
    d3.selectAll("text").remove();

    // add checkbox
    for(i=0; i<columns.length;i++) {
        id = "id_" + columns[i];       

        // add checkbox
        d3.select("#svgcontainer")
        .append("input")
        .attr("type", "checkbox")
        .attr("id", id)
        .attr("name", "checkboxes")
        .attr("onchange", "onAnchorSetChange()")
        .attr("checked", true)  
        .style("zoom", "2.0");

         //add label
         d3.select("#svgcontainer")
         .append("text")
         .text(columns[i]);
    }
}


// on change of anchors selection from checkbox
function onAnchorSetChange(){    
    eleList = document.getElementsByName("checkboxes");
    columnList = [];
    for(i=0; i<eleList.length; i++) {        
        if(eleList[i].checked) {
            id = eleList[i].id;
            columnName = id.substring(3); // extracting column names from ids
            columnList.push(columnName);
        }
    }
    if(columnList.length < 3) {
        d3.select("#warningmessage").remove();//removing existing warning messages

        d3.select("#svgcontainer")
        .append("text")
        .attr("id", "warningmessage")
        .text("Please select a minimum of three anchors!");
    }
    else {
        d3.select("#warningmessage").remove(); //removing existing warning messages
        d3.selectAll(".plotcircles").remove(); //removing existing plot anchors and data points
        anchor_positions = this.plotAnchors(columnList); //to plot new anchors
        this.plotInstances(DATA, anchor_positions); //to plot data points by anchor positions
    }
    console.log(columnList);
}

// generate Radviz
function generatePlot(DATASET) {
    // load csv
    d3.csv(DATASET).then(function(data) {
        DATA = data;
        columns = data.columns;

        anchors = [];
        for(i=0; i<columns.length-1; i++) {
            anchors.push(columns[i]);
        }

        displayanchors(anchors);

        console.log("data: " , data);    

        // parse and convert strings to numbers except last column
        data.forEach(function(vector){    
            count=columns.length-1;
            for(key in vector){        
                if(count == 0){
                    CLASS_NAME = key; //assigning class name
                    break;
                }
                vector[key] = +vector[key];        
                count--;
            }        
        }); 

        // normalize all columns except last column to a range of 0 and 1
        dict_scalefunction = {};
        for(i=0; i<columns.length-1; i++) {    
            max = d3.max(data, function(d) { return d[columns[i]]; });
            min = d3.min(data, function(d) { return d[columns[i]]; });
            func = d3.scaleLinear().domain([min,max]);
            dict_scalefunction[columns[i]] = func;
        }
        data.forEach(function(vector){    
            for(key in vector){    
                if(key != CLASS_NAME) {    
                    vector[key] = dict_scalefunction[key](vector[key]);  
                }
            }        
        }); 

        console.log("converted data: " , data);

        // arrange svg canvas
        svg_container = d3.select("#svgcontainer")
                            .append("svg")
                            .attr("width", 1000)
                            .attr("height", 600);

        // draw circle
        svg_container.append("circle")
                    .attr("cx", this.CIRCLE_CENTERX)
                    .attr("cy", this.CIRCLE_CENTERY)
                    .attr("r", this.CIRCLE_RADIUS)
                    .attr("fill", "white")
                    .attr("stroke", "black");

        anchor_positions = this.plotAnchors(anchors);
        this.plotInstances(data, anchor_positions);
        this.addToolTip();
    });
}

// plot anchors on circle
plotAnchors = function(columns) {
    anchors_count = columns.length;

    var anchors_positions = {};

    for(i=0; i<anchors_count; i++) {
        anchor_posX = (this.CIRCLE_RADIUS * Math.cos(i * (360/anchors_count))) 
                            + this.CIRCLE_CENTERX;

        anchor_posY = (this.CIRCLE_RADIUS * Math.sin(i * (360/anchors_count))) 
                            + this.CIRCLE_CENTERY;

        // saving anchors along with their positions in dictionary                    
        positions = [anchor_posX, anchor_posY];
        anchor_name = columns[i];
        anchors_positions[anchor_name] = positions;
        
        // draw anchors on circle
        svg_container = d3.select("svg")
        circle = svg_container.append("circle")
                                .attr("cx", anchor_posX)
                                .attr("cy", anchor_posY)
                                .attr("r", 5)
                                .attr("class", "plotcircles")
                                .attr("fill", "red");
        
        // add text for each anchor                        
        svg_container.append("text")
                    .attr("x", anchor_posX + 6)
                    .attr("y", anchor_posY + 6)
                    .attr("class", "plotcircles")
                    .text(columns[i]);

      }
      return anchors_positions;
}

// plot instances 
this.plotInstances = function(data, anchor_positions) {

    // define a unique color for each class
    classes = d3.map(data, function(d){return d[CLASS_NAME];}).keys();
    colors = d3.scaleOrdinal(d3.schemeCategory10).range();
    dict_classes_colors = {};    
    for(i=0; i<classes.length; i++) {        
        dict_classes_colors[classes[i]] = colors[i];
    }

    // loop through each row and plot each instance with color based on class
    data.forEach(function(vector){
        sum_upper_X = 0;
        sum_upper_Y = 0;
        sum_lower = 0;

        for(key in vector) {
            if(anchor_positions[key] != undefined) {
                a_pos = anchor_positions[key];
                value = vector[key];
                
                sum_upper_X += (a_pos[0] * value);
                sum_upper_Y += (a_pos[1] * value);
                sum_lower += value;                          
            }            
        }

        v_posX = sum_upper_X/sum_lower;
        v_posY = sum_upper_Y/sum_lower;  

        // plot instances in dataset
        svg_container = d3.select("svg")
        circle = svg_container.append("circle")
                                .attr("cx", v_posX)
                                .attr("cy", v_posY)
                                .attr("r", 6)
                                .attr("class", "plotcircles")
                                .attr("fill", 
                                  dict_classes_colors[vector[CLASS_NAME]]);  
                    
        // add tool tip to all data plots                                  
        circle.append("svg:title")
             .text(this.addToolTip(vector));
    });
}

// add tool tip for each instance
this.addToolTip = function(vector) {
   text = "Normalized values to range [0,1]: \n\n";
   for(key in vector) {
       text += key + ": " + vector[key] + "\n";
   }
   return text;
}

