// global variables
var CIRCLE_RADIUS = 250;
var CIRCLE_CENTERX = 300;
var CIRCLE_CENTERY = 300;
var CLASS_NAME = "";
var DATASET = "winequality-red.csv" //for default dataset on page load
var DATA = Object;
var arrOriginalNormalizedVal = [];

//on dom loaded - to display RadViz for winequality-red.csv 
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
            DATA = d3.csvParse(e.target.result); //to convert contents of file that are in string format to array 
            d3.select("svg").remove(); //removes existing plot
            generatePlot(DATA); //generate new plot
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
        id = columns[i].replace(/[- )(]/g,'')     

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
         .attr("id", id)
         .text(columns[i]);
    }
}


// on change of anchors selection from checkbox
function onAnchorSetChange(){    
    //get all the checkboxes with checked as true
    eleList = document.getElementsByName("checkboxes");
    columnList = [];
    for(i=0; i<eleList.length; i++) {        
        if(eleList[i].checked) {
            id = eleList[i].id;
            columnName = d3.select("text#" + id).text(); // extracting column names from ids
            columnList.push(columnName);
        }
    }
    // if number of selected checkboxes are less than 3, display warning message
    if(columnList.length < 3) {
        d3.select("#warningmessage").remove();//removing existing warning messages to avoid deuplicates
        // display warning messages
        d3.select("#warningDiv")
        .append("text")
        .attr("id", "warningmessage")
        .text("Please select a minimum of three anchors!")
        .style("color", "red")
        .style("font-weight", "bold");
    }
    else {
        d3.select("#warningmessage").remove(); //removing existing warning messages
        d3.selectAll(".plotcircles").remove(); //removing existing plot anchors and data points
        d3.selectAll(".plotAnchors").remove();
        anchor_positions = this.plotAnchors(columnList, false); //to plot new anchors
        this.plotInstances(DATA, anchor_positions, false); //to plot data points by anchor positions
    }    
}

// generate Radviz
function generatePlot(data) {
    // load csv   
    DATA = data;
    columns = data.columns;

    anchors = [];
    for(i=0; i<columns.length-1; i++) {//excluded last column because it is a class and not an anchor
        anchors.push(columns[i]);
    }

    displayanchors(anchors); //to display checkboxes with anchors        

    // parse and convert strings to numbers except last column
    data.forEach(function(vector){    
        count=columns.length-1;
        for(key in vector){        
            if(count == 0){
                CLASS_NAME = key; //storing class name to a global variable 
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
                        .attr("width", "100%")
                        .attr("height", 600);

    // draw circle
    svg_container.append("circle")
                    .attr("cx", this.CIRCLE_CENTERX)
                    .attr("cy", this.CIRCLE_CENTERY)
                    .attr("r", this.CIRCLE_RADIUS)
                    .attr("fill", "white")
                    .attr("stroke", "black");

    anchor_positions = this.plotAnchors(anchors, false);
    this.plotInstances(data, anchor_positions, false);
    this.addToolTip();
}

// plot anchors on circle
plotAnchors = function(columns, isDragged) {    
    if(!isDragged) { //exclude below functionlity since this calculation is not required while dragging
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
            anchors_positions[anchor_name] = positions;
            
            // draw anchors on circle
            svg_container = d3.select("svg")
            circle = svg_container.append("circle")
                                    .attr("cx", anchor_posX)
                                    .attr("cy", anchor_posY)
                                    .data([ {"x":anchor_posX, "y":anchor_posY} ])
                                    .attr("r", 8)
                                    .attr("class", "plotAnchors")
                                    .attr("fill", "red")
                                    .attr("id", anchor_name)                                    
                                    .call(d3.drag()
                                    .on('drag', dragging)
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
      return anchors_positions;
}

// plot instances 
this.plotInstances = function(data, anchor_positions, isDragged) {    
    if(!isDragged) {
        // define a unique color for each class
        classes = d3.map(data, function(d){return d[CLASS_NAME];}).keys();
        colors = d3.scaleOrdinal(d3.schemeCategory10).range();
        dict_classes_colors = {};    
        for(i=0; i<classes.length; i++) {        
            dict_classes_colors[classes[i]] = colors[i];
        }
        displayLegend(classes, dict_classes_colors);
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

    //retain the slider opacity throughout the application  
    d3.selectAll(".plotLegend,.plotcircles").transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .style("opacity", d3.select("#range1").property("value")/100)  

}

//changing the color opacity when using slider
d3.select("#range1").on("input", function() {
    d3.selectAll(".plotLegend,.plotcircles").transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .style("opacity", d3.select("#range1").property("value")/100)
});

// add tool tip for each instance
this.addToolTip = function(vector, row) {
   text = "";
   arrTemp = arrOriginalNormalizedVal[row];
   i = 0;
   for(key in vector) {      
       if(key == this.CLASS_NAME) { //to create distinction between features and class attributes
           text +=  "\n";
           key = key.toUpperCase();           
       }
       text += key + ": " + arrTemp[i] + "\n";       
       i++;
   } 
   return text;
}

// to add legend displaying colors that are representing the classes
function displayLegend(classes, dict_classes_colors) {
    legendCirclePosX = 680;
    legendCirclePosY = 85;
    legendTextPosX = 690;
    legendTextPosY = 90;

    for(i=0; i<classes.length; i++) {
        legendCirclePosY += 20;
        legendTextPosY += 20;
        d3.select("svg").append("circle")
                        .attr("cx", legendCirclePosX)
                        .attr("cy", legendCirclePosY)
                        .attr("r", 6)
                        .attr("class", "plotLegend")
                        .attr("fill", dict_classes_colors[classes[i]])
                        .attr("stroke", "black")
        d3.select("svg").append("text")
                        .attr("x", legendTextPosX)
                        .attr("y", legendTextPosY)
                        .text(classes[i])
    }
}

// to perform operations on dragging the anchor points
function dragging(d, i) {    
    d3.select(this).raise().classed('active', true);    
   
    cursorX = d3.event.x;
    cursorY = d3.event.y;
   
    deltaX = cursorX-CIRCLE_CENTERX;
    deltaY = cursorY-CIRCLE_CENTERY;
    angle = Math.atan2(deltaY, deltaX); //finding angle given circle center and mouse position

    // finding point on circle based on circle center, radius and angle
    newPosX = CIRCLE_CENTERX + (CIRCLE_RADIUS * Math.cos(angle)); 
    newPosY = CIRCLE_CENTERY + (CIRCLE_RADIUS * Math.sin(angle));
                                                  
    currentId = d3.select(this).attr("id");
    txt = d3.select("text#" + currentId).text();  

    //drag anchor to new position
    d3.select(this).attr("cx", d.x = newPosX).attr("cy", d.y = newPosY);

    // drag anchor label to new position                        
    d3.select("text#" + currentId+".plotAnchors")
                .attr("x", newPosX + 10)
                .attr("y", newPosY + 10);

    // updating the position of dragged anchor in the dictionary 
    // and plotting data points using the updated dictionary
    for(key in anchor_positions) {
        if(key == currentId) {
            anchor_positions[key] = [newPosX, newPosY];
            d3.selectAll(".plotcircles").remove();
            plotInstances(DATA, anchor_positions, true);
        }
    }                    
}
