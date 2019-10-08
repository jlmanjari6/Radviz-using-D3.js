// global variables
var CIRCLE_RADIUS = 250;
var CIRCLE_CENTERX = 300;
var CIRCLE_CENTERY = 300;
var CLASS_NAME = "";
var DATASET = "winequality-red.csv"
var DATA = Object;
var arrOriginalNormalizedVal = [];

document.addEventListener("DOMContentLoaded", function() {    
    d3.csv(DATASET).then(function(data) {
        generatePlot(data); // assigning default dataset for initial upload
    });
});

// on choosing file to upload from file upload dialog box
function onFileUploadBtnClick() {
    var file = document.getElementById("fileUpload").files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");        
        reader.onload = function (e) {
            DATA = d3.csvParse(e.target.result);
            d3.select("svg").remove();
            generatePlot(DATA);            
        }
    }         
}

// display anchors checkboxes
function displayanchors(columns) {
    // remove existing checkboxes
    d3.selectAll(".checkboxes").remove();
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
        .attr("class", "checkboxes")
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
            columnName = columnName.replace(/[- )(]/g,'')
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
        d3.selectAll(".plotAnchors").remove();
        anchor_positions = this.plotAnchors(columnList, false); //to plot new anchors
        this.plotInstances(DATA, anchor_positions); //to plot data points by anchor positions
    }    
}

// generate Radviz
function generatePlot(data) {
    // load csv   
        DATA = data;
        columns = data.columns;

        anchors = [];
        for(i=0; i<columns.length-1; i++) {
            anchors.push(columns[i]);
        }

        displayanchors(anchors);         

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
        arrOriginalNormalizedVal = [];
        dictScaleFunction = {}; //dic of column name, scale function
        for(i=0; i<columns.length-1; i++) {    
            max = d3.max(data, function(d) { return d[columns[i]]; });
            min = d3.min(data, function(d) { return d[columns[i]]; });
            func = d3.scaleLinear().domain([min,max]);
            dictScaleFunction[columns[i]] = func;
        }
        row = 0;
        data.forEach(function(vector){    //replacing original values with normalized values
            arrVectorTemp = [];
            i = 0;
            for(key in vector){    
                arrVectorTemp[i] = vector[key];
                if(key != CLASS_NAME) {                                                              
                    vector[key] = dictScaleFunction[key](vector[key]); //passing each cell value to scale function                    
                    i++;
                }
            }
            arrOriginalNormalizedVal[row] = arrVectorTemp; 
            row++;       
        });         

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

        anchor_positions = this.plotAnchors(anchors, false);
        this.plotInstances(data, anchor_positions);
        this.addToolTip();
    
}

// plot anchors on circle
plotAnchors = function(columns, isDragged) {
    if(!isDragged) {
        anchors_count = columns.length;
        var anchors_positions = {};

        for(i=0; i<anchors_count; i++) {
            anchor_posX = (this.CIRCLE_RADIUS 
                            * Math.cos((i * (360/anchors_count)) 
                            * (parseFloat(Math.PI/180)))) 
                                + this.CIRCLE_CENTERX;

            anchor_posY = (this.CIRCLE_RADIUS 
                            * Math.sin((i * (360/anchors_count)) 
                            * (parseFloat(Math.PI/180)))) 
                                + this.CIRCLE_CENTERY;

            // saving anchors along with their positions in dictionary                    
            positions = [anchor_posX, anchor_posY];
            anchor_name = columns[i].replace(/[- )(]/g,'')
            // anchor_name = columns[i];
            anchors_positions[anchor_name] = positions;
            
            // draw anchors on circle
            svg_container = d3.select("svg")
            circle = svg_container.append("circle")
                                    .attr("cx", anchor_posX)
                                    .attr("cy", anchor_posY)
                                    .attr("r", 8)
                                    .attr("class", "plotAnchors")
                                    .attr("fill", "red")
                                    .attr("id", anchor_name)
                                    .call(d3.drag()
                                    .on('start', dragstarted)
                                    .on('drag', dragged)
                                    .on('end', dragended)
                                );
            
            // add text for each anchor                        
            svg_container.append("text")
                        .attr("x", anchor_posX + 10)
                        .attr("y", anchor_posY + 10)
                        .attr("id", anchor_name)
                        .attr("class", "plotAnchors")
                        .text(columns[i]);

        }
    }
    else {

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
    row = 0;    
    data.forEach(function(vector){
        sum_upper_X = 0;
        sum_upper_Y = 0;
        sum_lower = 0;                
        for(key in vector) {
            anchor = key.replace(/[- )(]/g,'')
            if(anchor_positions[anchor] != undefined) {
                a_pos = anchor_positions[anchor];
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
                                  dict_classes_colors[vector[CLASS_NAME]])
                                .attr("stroke", "black")  ;  
                    
        // add tool tip to all data plots                                  
        circle.append("svg:title")
             .text(this.addToolTip(vector, row));
        row++;
    });    
}

// add tool tip for each instance
this.addToolTip = function(vector, row) {
   text = "";
   arrTemp = arrOriginalNormalizedVal[row];
   i = 0;
   for(key in vector) {
       if(i == arrTemp.length-1) {
           text += "\n";
       }
       text += key + ": " + arrTemp[i] + "\n";       
       i++;
   }
   
   return text;
}

function dragstarted(d){ 
    d3.select(this).raise().classed('active', true);    
}
function dragended(d){ 
    d3.select(this).classed('active', false);    
}
function dragged(d, i) {
    d3.select(this).raise().classed('active', true);    
   
    cursorX = d3.event.x;
    cursorY = d3.event.y;
    distance = Math.sqrt(Math.pow((cursorX-CIRCLE_CENTERX),2) 
                        + Math.pow((cursorY-CIRCLE_CENTERY) ,2));
                        
    if(Math.abs(distance - CIRCLE_RADIUS) <= 3) {                       
        // redraw the dimensional anchor and the label  
        currentId = d3.select(this).attr("id");
        txt = d3.select("text#" + currentId).text();        
        d3.selectAll("#"+currentId).remove();  
        svg_container = d3.select("svg")
        circle = svg_container.append("circle")
                                .attr("cx", d3.event.x )
                                .attr("cy", d3.event.y )
                                .attr("r", 8)
                                .attr("id", currentId)
                                .attr("class", "plotAnchors")
                                .attr("fill", "red")
                                .call(d3.drag()
                                .on('start', dragstarted)
                                .on('drag', dragged)
                                .on('end', dragended)
                                );
        // add text for each anchor                        
        svg_container.append("text")
        .attr("x", d3.event.x + 10)
        .attr("y", d3.event.y + 10)
        .attr("id", currentId)
        .attr("class", "plotAnchors")
        .text(txt);
        for(key in anchor_positions) {
            if(key == currentId) {
                anchor_positions[key] = [d3.event.x, d3.event.y];
                d3.selectAll(".plotcircles").remove();
                plotInstances(DATA, anchor_positions);
            }
        }                  
    }    
}
