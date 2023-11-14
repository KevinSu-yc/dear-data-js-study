"use strict"

/* set canvas size and margin */
let plotWidth = 1100;
let plotHeight = 650;

let margin = {
    left: 80,
    right: 80,
    top: 50,
    bottom: 70
};

/* create canvas */
let canvas = d3.select("#plot")
    .append("svg")
    .attr("width", plotWidth)
    .attr("height", plotHeight);

/* create a varible to store the data */
let loadedData;

/* load and parse the data from data.json */
(async function () {
    loadedData = await d3.json("data.json").then(drawPlot);
})();

/* get what date range the readers choose to see (select) and what factors to show on plot (checkboxes) using thier id */
let dateRange = document.getElementById("selectDate");
let sameDayScore = document.getElementById("sameDayScore");
let nextDayScore = document.getElementById("nextDayScore");
let enSearchArea = document.getElementById("enSearchArea");
let scoreDecreasing = document.getElementById("scoreDecreasing");
let scoreNotDecreasing = document.getElementById("scoreNotDecreasing");
let percentageDecreasing = document.getElementById("percentageDecreasing");
let percentageNotDecreasing = document.getElementById("percentageNotDecreasing");

/* add event listener to the select element selectDate and every checkbox, call redrawPlot() when users changes their option.
    reference: Jay Taylor-Laird's code from main.js of example_cleveland_dot_plot in class 9 materials */
dateRange.addEventListener("change", redrawPlot);
sameDayScore.addEventListener("change", redrawPlot);
nextDayScore.addEventListener("change", redrawPlot);
enSearchArea.addEventListener("change", redrawPlot);
scoreDecreasing.addEventListener("change", redrawPlot);
scoreNotDecreasing.addEventListener("change", redrawPlot);
percentageDecreasing.addEventListener("change", redrawPlot);
percentageNotDecreasing.addEventListener("change", redrawPlot);

/********** redrawPlot() **********      

Clear everything in svg and redraw a plot base on what the users choose and checked      
    
************************************/
function redrawPlot() {
    /* "svg *" is to select every element in svg, reference: https://developer.mozilla.org/en-US/docs/Web/CSS/Universal_selectors
       remove() is to delete the selected elements, reference: Jay Taylor-Laird's code from main.js of example_heatmap in class 9 material */
    d3.selectAll("svg *").remove();

    /* .checked is to get the status of the checkbox, true if it's checked false if it's not, refererce: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox 
        .disabled is to set the ability to change of the checkbox, true is unable to change false is changable, reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled 
        this part is to add some limitation to the users so some checkboxes will be disabled in different conditions. */
    if (!nextDayScore.checked && !enSearchArea.checked) { // if the user choose to not show the scores on next day and not show the area graph, then do the following
        /* uncheck and lock the checkboxes for showing the connections lines between the circles */
        scoreDecreasing.checked = false;
        scoreDecreasing.disabled = true;
        scoreNotDecreasing.checked = false;
        scoreNotDecreasing.disabled = true;

        /* uncheck and lock the checkboxes for showing the lines on the area graph */
        percentageDecreasing.checked = false;
        percentageDecreasing.disabled = true;
        percentageNotDecreasing.checked = false;
        percentageNotDecreasing.disabled = true;

    } else if (nextDayScore.checked && !enSearchArea.checked) { // if the user choose to show the scores on next day but not show the area graph, then do the following
        /* unlock the checkboxes for user to see the connection lines between the circles */
        scoreDecreasing.disabled = false;
        scoreNotDecreasing.disabled = false;

        /* uncheck and lock the checkboxes for showing the lines on the area graph */
        percentageDecreasing.checked = false;
        percentageDecreasing.disabled = true;
        percentageNotDecreasing.checked = false;
        percentageNotDecreasing.disabled = true;

    } else if (!nextDayScore.checked && enSearchArea.checked) { // if the user choose to not show the scores on next day but show the area graph, then do the following
        /* uncheck and lock the checkboxes for showing the connections lines between the circles */
        scoreDecreasing.checked = false;
        scoreDecreasing.disabled = true;
        scoreNotDecreasing.checked = false;
        scoreNotDecreasing.disabled = true;

        /* unlock the checkboxes for user to see the lines on the area graph */
        percentageDecreasing.disabled = false;
        percentageNotDecreasing.disabled = false;

    } else { //else let the users be able to use all the checkboxes
        scoreDecreasing.disabled = false;
        scoreNotDecreasing.disabled = false;
        percentageDecreasing.disabled = false;
        percentageNotDecreasing.disabled = false;
    }

    /* use Array.filter to get a new array of data according to the date range the users choose */
    let selectedDataset = loadedData.filter(function (value, index) {
        if (dateRange.value == "whole") { //if the user choose to see the whole data, return true so the new dataset will be the same as original
            return true;
        } else if (dateRange.value == "firstHalf") {
            return index < (loadedData.length / 2); //loadedData.length / 2 is the middle point of the original data, so the index less than it will be the first half of the original data
        } else {
            return index >= (loadedData.length / 2); //loadedData.length / 2 is the middle point of the original data, so the index greater than or equals to it will be the second half of the original data
        }
    })

    drawPlot(selectedDataset); //use drawPlot() to redraw the plot with the selected dataset 
}

/************** drawPlot(dataset) ******************      
Create an initial plot to visualize relationship between factors base of my whole data loaded from data.json.       

parameter:      
dataset: data loaded from data.json     

return:     
dataset: data loaded from data.json     
***************************************************/
function drawPlot(dataset) {

    /* get the date array of every observation using Array.map() and use it for scaling the x axis */
    let dates = dataset.map(function (value) {
        return value.date.slice(5); //I used YYYY-MM-DD in my data for date so I get the MM-DD part by using String.slice() 
    })
    // console.log(dates);

    /* define scale functions to let the data fit my plot */
    let xScale = d3.scalePoint() //use d3.scalePoint() for dates
        .domain(dates)
        .range([margin.right, plotWidth - margin.left])
        .padding(1); //add padding so it won't start from the edge

    let yScale = d3.scaleLinear()
        .domain([45, 100])
        .range([plotHeight - margin.bottom, margin.top]);

    let rScale = d3.scaleSqrt()
        .domain([d3.min(dataset, function (value) { //use d3.min and d3.max to get the minimum value and maximum of value.numberOfNewWords
            return value.numberOfNewWords;
        }), d3.max(dataset, function (value) {
            return value.numberOfNewWords;
        })])
        .range([5, 30]);

    /* define scale function for the percentage of English searches for the area graph */
    let searchScale = d3.scaleLinear()
        .domain([0, 100])
        .range([plotHeight - margin.bottom, margin.top]);

    /* create a new Array to store the percentage of English searches using Array.map() and use it later to draw the area graph and the lines */
    let searchPercentages = dataset.map(function (value) {
        if (value.totalSearches == 0) { //since there is one day that I didn't do any searches I add this condition to avoid 0/0 problem
            return 0;
        } else {
            return value.englishSearches / value.totalSearches * 100; //calculate the percentage
        }
    })
    // console.log(searchPercentages);

    if (enSearchArea.checked) { //if the user choose to see the data of English searches, then draw the area graph

        /* reference: Jay Taylor-Laird's code from lab 9 material: Lab_09_Slides_Fall2021.pdf 
            Define function to draw area graph with date and percentage of English searches using d3.area() */
        let enSearchesPercentageArea = d3.area()
            .x(function (value, index) {
                return xScale(dates[index]);
            })
            .y0(plotHeight - margin.bottom)
            .y1(function (value) {
                return searchScale(value);
            });

        /* Add a path that draw the area base on the function enSearchesPercentageArea
            Draw this area first as the background of this plot */
        canvas.append('path')
            .attr('d', enSearchesPercentageArea(searchPercentages)) //use the function with the array of percentage 
            .attr('fill', 'pink')
            .attr("opacity", 0.5);
    }

    let percentageChangeLines = canvas.selectAll("line.percentageChangeLines") //draw the lines on the area graph indicate the percentage of English searches decrease or not
        .data(dataset)
        .join("line")
        .attr("class", "percentageChangeLines")
        .attr("x1", function (value, index) {
            return xScale(dates[index]); // set the x1 refer to the same day
        })
        .attr("x2", function (value, index) {
            if (index == dataset.length - 1) { //if it's the last day, then set x2 same as x1 because there won't be a data for next day
                return xScale(dates[index]);
            }
            return xScale(dates[index + 1]); // set the x2 refer to the next day
        })
        .attr("y1", function (value, index) {
            return searchScale(searchPercentages[index]); //set the y1 as the percentage of the same day
        })
        .attr("y2", function (value, index) {
            if (index == dataset.length - 1) {
                return searchScale(searchPercentages[index]); //if it's the last day, then set y2 same as y1 because there won't be a data for next day
            }
            return searchScale(searchPercentages[index + 1]); //set the y2 as the percentage of the next day
        })
        .attr("stroke", function (value, index) {
            if (index == dataset.length - 1) { // if it comes to the last object, return none, set this to avoid error when there's nothing in dataset[index + 1] 
                return "none";
            } else if ((searchPercentages[index] > searchPercentages[index + 1]) && percentageDecreasing.checked) { // if the current day's percentage of English searches is greater than next day's and the user choose to see the decreasing lines, set the color to red
                return "red";
            } else if ((searchPercentages[index] <= searchPercentages[index + 1]) && percentageNotDecreasing.checked) { // if the current day's percentage of English searches is less than next day's and the user choose to see the increasing lines, set the color to blue
                return "blue"
            } else { //set the color to none if the user didn't choose to see them
                return "none";
            };
        })
        .attr("stroke-width", "2px")

    let connectionLines = canvas.selectAll("line.connectionLine") //draw the connection lines between the circles
        .data(dataset)
        .join("line")
        .attr("class", "connectionLine")
        .attr("x1", function (value, index) {
            return xScale(dates[index]); // center of the circle on the current day
        })
        .attr("x2", function (value, index) {
            if (index == dataset.length - 1) { //if it's the last day, then set x2 same as x1 because there won't be a data for next day
                return xScale(dates[index]);
            }
            return xScale(dates[index + 1]); // center of the circle on the next day
        })
        .attr("y1", function (value) {
            return yScale(value.testPerformances[0].score); //get current day's test score which is store in the first object in testPerformances
        })
        .attr("y2", function (value, index) {
            if (index == dataset.length - 1) {
                return yScale(value.testPerformances[0].score); //if it's the last day, then set y2 same as y1 because there won't be a data for next day
            }
            return yScale(dataset[index + 1].testPerformances[1].score); //get next day's test score using dataset[index + 1] because it's stored in the next object in the data set
        })
        .attr("stroke", function (value, index) {
            if (index == dataset.length - 1) { // if it comes to the last object, return none, set this to avoid error when there's nothing in dataset[index + 1] 
                return "none";
            } else if (!nextDayScore.checked) { // if the user choose not to see the scores on the next day, return none so the lines won't show
                return "none";
            } else if ((value.testPerformances[0].score > dataset[index + 1].testPerformances[1].score) && scoreDecreasing.checked) { // if the current day's score is greater than next day's score and the user choose to see the decreasing lines, set the color to red
                return "red";
            } else if ((value.testPerformances[0].score <= dataset[index + 1].testPerformances[1].score) && scoreNotDecreasing.checked) { // if the current day's score is less than next day's score and the user choose to see the increasing lines, set the color to blue
                return "blue"
            } else { //set the color to gray if the user didn't choose to see them
                return "gray";
            };
        })
        .attr("stroke-width", "2px")

    /* always draw circles on plot that represents my first test score every day */
    let firstDayScores = canvas.selectAll("circle.firstDayScore")
        .data(dataset)
        .join("circle")
        .attr("class", "firstDayScore")
        .attr("cx", function (value, index) {
            return xScale(dates[index])
        })
        .attr("cy", function (value) {
            return yScale(value.testPerformances[0].score)
        })
        .attr("r", function (value, index) {
            if (index == dataset.length - 1) { //if it's the last day, then set r to 0 because there won't be a data for next day
                return 0;
            }
            return rScale(value.testPerformances[0].numberOfTestedWords);
        })
        .attr("fill", "#aface3") //light blue
        .attr("stroke", "#403ba3") //dark blue
        .attr("opacity", 0.7);

    if (nextDayScore.checked) { // if the user choose to see the scores on next day, draw circles on plot that represents my second test score every day
        let secondDayScores = canvas.selectAll("circle.secondDayScore")
            .data(dataset)
            .join("circle")
            .attr("class", "secondDayScore")
            .attr("cx", function (value, index) {
                return xScale(dates[index])
            })
            .attr("cy", function (value) {
                return yScale(value.testPerformances[1].score)
            })
            .attr("r", function (value, index) {
                if (index == 0) { //if it's the first day, then set r to 0 because there won't be a data for the day before
                    return 0;
                }
                return 4; //set a consistent radius to the circles representing the second test scores
            })
            .attr("fill", "#7ccf63") //light green
            .attr("stroke", "#4c873a") //dark green
            .attr("opacity", 0.7);
    }

    /* draw X, Y axes and translate them to a correct postion */
    let xAsis = canvas.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${plotHeight - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale))
        .selectAll("text") //adapted from https://bl.ocks.org/d3noob/3c040800ff6457717cca586ae9547dbf
        .style("text-anchor", "end")
        .attr("transform", "rotate(-65)") //rotate every date text 65 degrees
        .attr("dx", "-0.8em") //offset the x, y position for every date text, x and y value should be consider unusually due to the rotation
        .attr("dy", "0.15em");

    let yAxis = canvas.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft().scale(yScale));

    /* create X and Y axis label */
    let xAxisLabel = canvas.append("text")
        .attr("class", "axisLabel")
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight - margin.bottom / 10)
        .attr("text-anchor", "middle") //adapted from Jay Taylor-Laird's code from lab 7 starter code, rotate the text for 90 degrees
        .text("Date of Every Observation (MM-DD)");

    let yAxisLabel = canvas.append("text")
        .attr("class", "axisLabel")
        .attr("x", plotHeight / -2) //x and y value should be consider switching since y axis label is rotated
        .attr("y", margin.left / 3)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)") //adapted from Jay Taylor-Laird's code from lab 7 starter code, rotate the text for 90 degrees
        .text("Test Score on Quizlet Each Day (%)");

    if (enSearchArea.checked) { //create the axis and label on the right if the user choose to see the English searches data

        /* draw another Y axis for the percentage of English searches and place it on the right of this plot */
        let yAxisRight = canvas.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${plotWidth - margin.right}, 0)`)
            .call(d3.axisRight().scale(searchScale));

        /* create another Y axis label for the percentage of English searches and place it on the right of this plot */
        let yAxisLabelRight = canvas.append("text")
            .attr("class", "axisLabel")
            .attr("x", plotHeight / 2) //x and y value should be consider switching since y axis label is rotated
            .attr("y", -plotWidth + margin.right / 3)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(90)") //adapted from Jay Taylor-Laird's code from lab 7 starter code, rotate the text for 90 degrees
            .text("Percentage of English Searches Each Day (%)");
    }


    /* Replace key box with html

    // create a box to contain keys that explain this graph
    let keyBox = canvas.append("rect")
        .attr("x", 2)
        .attr("y", 10)
        .attr("width", 950)
        .attr("height", 100)
        .attr("fill", "#eee")
        .attr("stroke", "grey");

    // set variables to help positioning the explanations
    let explainCircleX = margin.left / 4;
    let explainCircleY = margin.top / 6;
    let explainCircleR = 10;

    // create the explanations
    let firstScoreCircle = canvas.append("circle")
        .attr("cx", explainCircleX)
        .attr("cy", explainCircleY)
        .attr("r", explainCircleR)
        .attr("fill", "#aface3")
        .attr("stroke", "#403ba3")
        .attr("opacity", 0.7);

    let secondScoreCircle = canvas.append("circle")
        .attr("cx", explainCircleX + 215)
        .attr("cy", explainCircleY)
        .attr("r", explainCircleR / 2)
        .attr("fill", "#7ccf63")
        .attr("stroke", "#4c873a")
        .attr("opacity", 0.7);

    let firstScoreCircleText = canvas.append("text")
        .attr("x", explainCircleX + 15)
        .attr("y", explainCircleY + explainCircleR / 2)
        .text("Test scores on the same day");

    let secondScoreCircleText = canvas.append("text")
        .attr("x", explainCircleX + 225)
        .attr("y", explainCircleY + explainCircleR / 2)
        .text("Test scores on the next day");

    // create 3 circle using for loop to show different radius
    for (let i = 0; i < 3; i++) {
        let radiusCircles = canvas.append("circle")
            .attr("cx", explainCircleX + i * 25) //add 25 to the x position for every cycle
            .attr("cy", explainCircleY + 35)
            .attr("r", (i + 1) * 4)
            .attr("fill", "#aface3")
            .attr("stroke", "#403ba3")
            .attr("opacity", 0.7);
    }

    let explainRadiusText = canvas.append("text")
        .attr("x", explainCircleX + 70)
        .attr("y", explainCircleY + 40)
        .text("Radius: Amount of tested words");

    let explainPercentageSquare = canvas.append("rect")
        .attr("x", explainCircleX - explainCircleR)
        .attr("y", explainCircleY + 55)
        .attr("width", explainCircleR * 2)
        .attr("height", explainCircleR * 2)
        .attr('fill', 'pink')
        .attr("opacity", 0.6);

    let explainSquareText = canvas.append("text")
        .attr("x", explainCircleX + 15)
        .attr("y", explainCircleY + 70)
        .text("Percentage of English Searches (%)");

    let redLine = canvas.append("line")
        .attr("x1", explainCircleX + 420)
        .attr("x2", explainCircleX + 440)
        .attr("y1", explainCircleY)
        .attr("y2", explainCircleY)
        .attr("stroke", "red");

    let explainRedLineText = canvas.append("text")
        .attr("x", explainCircleX + 450)
        .attr("y", explainCircleY + 5)
        .text("Test Scores/Percentage of English Searches Decreasing");

    let blueLine = canvas.append("line")
        .attr("x1", explainCircleX + 420)
        .attr("x2", explainCircleX + 440)
        .attr("y1", explainCircleY + 35)
        .attr("y2", explainCircleY + 35)
        .attr("stroke", "blue");

    let explainBlueLineText = canvas.append("text")
        .attr("x", explainCircleX + 450)
        .attr("y", explainCircleY + 40)
        .text("Test Scores/Percentage of English Searches Improving or Stay the Same");
    */
    return dataset;
}