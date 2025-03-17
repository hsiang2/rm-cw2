// set the dimensions and margins of the graph
    const margin = {top: 30, right: 100, bottom: 50, left: 120},
    width = 730 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;
    
    // append the svg object to the body of the page
    const svgMain = d3.select("#main-chart")
        // .append("svg")
        // .attr("width", width + margin.left + margin.right)
        // .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left},${margin.top})`);

    const svgDetail = d3.select("#detail-chart")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    const colorScaleDiet = d3.scaleOrdinal()
        .domain(['fish', 'meat50', 'meat100', 'meat', 'vegan', 'veggie'])
        .range([ "#89C2D0", "#F9C486", "#E28870", "#EEA279", "#7BAF97", "#B6D089"])
    
    const colorScaleSex = d3.scaleOrdinal()
        .domain(["male", "female"])
        .range(["#91B5DD", "#DD9192"]);
    
    // **設定 `age_group` 的透明度**
    const opacityScale = d3.scaleOrdinal()
        .domain(["20-29", "30-39", "40-49", "50-59", "60-69", "70-79"])
        .range([0.3, 0.45, 0.6, 0.75, 0.9, 1]);  // **年齡越大，透明度越低（更明顯）**
    
    

    const labels = {
        "mean_ghgs": "Mean GHG emissions (kg)",
        "mean_land": "Mean Agricultural Land Use (m²)",
        "mean_watscar": "Mean Water Scarcity",
        "mean_eut": "Mean Eutrophication Potential (g PO4e)",
        "mean_ghgs_ch4": "Mean GHG from CH4 (kg)",
        "mean_ghgs_n2o": "Mean GHG from N2O",
        "mean_bio": "Mean Biodiversity Impact (species/day)",
        "mean_watuse": "Mean Agricultural Water Usage (m³)",
        "mean_acid": "Mean Acidification Potential"
    };

    const dietGroupLabels = {
        "fish": "Fish-eaters",
        "meat50": "Low meat-eaters",
        "meat100": "High meat-eaters",
        "meat": "Medium meat-eaters",
        "vegan": "Vegans",
        "veggie": "Vegetarians"
    };
    
    // Here I set the list of dimension manually to control the order of axis:
    const dimensions = ["mean_ghgs", "mean_land", "mean_watscar", "mean_eut",
    "mean_ghgs_ch4", "mean_ghgs_n2o", "mean_bio", "mean_watuse", "mean_acid"]
    

    let selectedDiet = null;
    let overallData = [], detailData = [];

    Promise.all([
        d3.csv("data/diet.csv"),
        d3.csv("data/diet_age_gender.csv")  
    ]).then(([overall, detail]) => {
// Parse the Data
        overallData = overall.map(d => ({
            ...d,
            mean_ghgs: +d.mean_ghgs,
            mean_land: +d.mean_land,
            mean_watscar: +d.mean_watscar,
            mean_eut: +d.mean_eut,
            mean_ghgs_ch4: +d.mean_ghgs_ch4,
            mean_ghgs_n2o: +d.mean_ghgs_n2o,
            mean_bio: +d.mean_bio,
            mean_watuse: +d.mean_watuse,
            mean_acid: +d.mean_acid,
        }));
        detailData = detail.map(d => ({
            ...d,
            mean_ghgs: +d.mean_ghgs,
            mean_land: +d.mean_land,
            mean_watscar: +d.mean_watscar,
            mean_eut: +d.mean_eut,
            mean_ghgs_ch4: +d.mean_ghgs_ch4,
            mean_ghgs_n2o: +d.mean_ghgs_n2o,
            mean_bio: +d.mean_bio,
            mean_watuse: +d.mean_watuse,
            mean_acid: +d.mean_acid,
        }))
        console.log(overallData)
        console.log(detailData)
      // Color scale: give me a specie name, I return a color
        drawMainChart(overallData);
    })

    function drawMainChart(data) {

        // For each dimension, I build a linear scale. I store all in a y object
        const y = {}
        for (i in dimensions) {
            dimension = dimensions[i]
            y[dimension] = d3.scaleLinear()
            //   .domain( [0,8] ) // --> Same axis range for each group
            // --> different axis range for each group --> 
            //   .domain( d3.extent(data, d=>d[dimension]) )
            .domain([
                d3.min(data, d => d[dimension]) * 0.95, 
                d3.max(data, d => d[dimension]) * 1.05 
            ])
            .range([height, 0])
        }
        
        // Build the X scale -> it find the best position for each Y axis
        x = d3.scalePoint()
            .range([0, width])
            .domain(dimensions);
        
        // Highlight the specie that is hovered
        const highlight = function(event, d){
        
            selected_diet = d.diet_group
        
            // first every group turns grey
            d3.selectAll(".line")
            .transition().duration(200)
            .style("stroke", "lightgrey")
            .style("opacity", "0.2")
            // Second the hovered specie takes its color
            d3.selectAll("." + selected_diet)
            .transition().duration(200)
            .style("stroke", colorScaleDiet(selected_diet))
            .style("opacity", "1")
        }
        
        // Unhighlight
        const doNotHighlight = function(d){
            d3.selectAll(".line")
            .transition().duration(200).delay(800)
            .style("stroke", function(d){ return( colorScaleDiet(d.diet_group))} )
            .style("opacity", "1")
        }
        
        // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
        function path(d) {
            return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
        }
        
        // Draw the lines
        svgMain
            .selectAll("myPath")
            .data(data)
            .join("path")
            // .attr("class", "line")
            .attr("class", function (d) { return "line " + d.diet_group } ) // 2 class for each line: 'line' and the group name
            .attr("d",  path)
            .style("fill", "none" )
            .style("stroke", d => colorScaleDiet(d.diet_group))
            .style("opacity", 0.5)
            .on("click", function(event, d) {
                if (selectedDiet === d.diet_group) {
                    svgDetail.selectAll("*").remove();
                    selectedDiet = null;
                    d3.select("#detail-title").text("");
                } else {
                    selectedDiet = d.diet_group;
                    updateDetailChart(d.diet_group);
                }
            })
            // .on("mouseover", function() {
            //     d3.select(this).style("stroke-width", 3).style("opacity", 1);
            // })
            // .on("mouseout", function() {
            //     d3.select(this).style("stroke-width", 1).style("opacity", 0.7);
            // })
            .on("mouseover", highlight)
            .on("mouseleave", doNotHighlight );

        // **在右側加上每條線的標籤**
        svgMain.selectAll("myLabels")
            .data(data)
            .join("text")
            .attr("x", width + 5) // 放在最右側
            .attr("y", d => y[dimensions[dimensions.length - 1]](d[dimensions[dimensions.length - 1]]))
            .text(d => dietGroupLabels[d.diet_group]) // 顯示 diet_group 名稱
            .style("fill", d => colorScaleDiet(d.diet_group))
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .attr("alignment-baseline", "middle")
            .on("click", function(event, d) {
                if (selectedDiet === d.diet_group) {
                    svgDetail.selectAll("*").remove();
                    selectedDiet = null;
                    d3.select("#detail-title").text("");
                } else {
                    selectedDiet = d.diet_group;
                    updateDetailChart(d.diet_group);
                }
            })
            // .on("mouseover", function() {
            //     d3.select(".line").style("stroke-width", 3).style("opacity", 1);
            // })
            // .on("mouseout", function() {
            //     d3.select(".line").style("stroke-width", 1).style("opacity", 0.7);
            // });
            .on("mouseover", highlight)
            .on("mouseleave", doNotHighlight )
        
        // Draw the axis:
        svgMain.selectAll("myAxis")
            // For each dimension of the dataset I add a 'g' element:
            .data(dimensions).enter()
            .append("g")
            .attr("class", "axis")
            // I translate this element to its right position on the x axis
            .attr("transform", function(d) { return `translate(${x(d)})`})
            // And I build the axis with the call function
            .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); })
            // Add axis title
            .append("text")
            .style("text-anchor", "end")
            .attr("y", height +9)
            .attr("transform", `rotate(-13, 0, ${height + 9})`)
            .text(d => labels[d])
            .style("fill", "#222222")
        
            drawMainLegend();

    }

    // **繪製細節圖**
    function updateDetailChart(selectedDiet) {
        const filteredData = detailData.filter(d => d.diet_group === selectedDiet);

        d3.select("#detail-title").text(`${dietGroupLabels[selectedDiet]} - Age & Sex`)
        .style("color", colorScaleDiet(selected_diet));
        // const meanValues = {};
        // dimensions.forEach(dim => {
        //     meanValues[dim] = d3.mean(filteredData, d => d[dim]);
        // });

        svgDetail.selectAll("*").remove();

          // Here I set the list of dimension manually to control the order of axis:
        //   dimensions = ["mean_ghgs", "mean_land", "mean_watscar", "mean_eut",
        //   "mean_ghgs_ch4", "mean_ghgs_n2o", "mean_bio", "mean_watuse", "mean_acid"]
          
          // For each dimension, I build a linear scale. I store all in a y object
          const y = {}
          for (i in dimensions) {
              dimension = dimensions[i]
              y[dimension] = d3.scaleLinear()
              //   .domain( [0,8] ) // --> Same axis range for each group
              // --> different axis range for each group --> 
              //   .domain( d3.extent(data, d=>d[dimension]) )
              .domain([
                  d3.min(filteredData, d => d[dimension]) * 0.95, 
                  d3.max(filteredData, d => d[dimension]) * 1.05 
              ])
              .range([height, 0])
          }
          
          // Build the X scale -> it find the best position for each Y axis
          x = d3.scalePoint()
              .range([0, width])
              .domain(dimensions);
          
          // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
          function path(d) {
              return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
          }

        //    const tooltip = d3.select("#tooltip");

          const highlight = function(event, d){

            selectedSex = d.sex
            selectedAge = d.age_group
            // first every group turns grey
            d3.selectAll(".line-detail")
            .transition().duration(200)
            .style("stroke", "lightgrey")
            .style("opacity", "0.2")
            // Second the hovered specie takes its color
            d3.selectAll("." +  `${selectedSex}${selectedAge}`)
            .transition().duration(200)
            .style("stroke", colorScaleSex(selectedSex))
            .style("opacity", opacityScale(selectedAge))

            // tooltip.style("visibility", "visible")
            //     .html(`
            //         <strong>Age Group:</strong> ${d.age_group} <br>
            //         <strong>Sex:</strong> ${d.sex} <br>
            //         <strong>GHG Emissions:</strong> ${d.mean_ghgs.toFixed(2)} kg <br>
            //         <strong>Land Use:</strong> ${d.mean_land.toFixed(2)} m²
            //     `)
            //     .style("left", (event.pageX + 10) + "px")
            //     .style("top", (event.pageY - 10) + "px");
            svgDetail.append("text")
            .attr("class", "hover-label")
            .attr("x", width + 10)  // **放在最右側**
            .attr("y", y[dimensions[dimensions.length - 1]](d[dimensions[dimensions.length - 1]]))  
            .text(`${d.age_group}, ${d.sex}`)
            .style("fill", colorScaleSex(d.sex))
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .attr("alignment-baseline", "middle");

            // svgDetail.selectAll("myLabelsDetail")
            //   .data(filteredData)
            //   .join("text")
            //   .attr("x", width + 5) // 放在最右側
            //   .attr("y", d => y[dimensions[dimensions.length - 1]](d[dimensions[dimensions.length - 1]]))
            //   .text(d => (`${selectedSex} ${selectedAge}`))
            //   .style("stroke", colorScaleSex(selectedSex))
            //   .style("opacity", opacityScale(selectedAge))
            //   .style("font-size", "10px")
            //   .attr("alignment-baseline", "middle")
        }
        
        // Unhighlight
        const doNotHighlight = function(d){
            d3.selectAll(".line-detail")
            .transition().duration(200).delay(800)
            .style("stroke", d => colorScaleSex(d.sex))
            .style("opacity", d => opacityScale(d.age_group))

            // tooltip.style("visibility", "hidden");
            svgDetail.selectAll(".hover-label").remove();
        }
          
          // Draw the lines
          svgDetail
              .selectAll("myPathDetail")
              .data(filteredData)
              .join("path")
              .attr("class", function (d) { return "line-detail " + `${d.sex}${d.age_group}` } ) // 2 class for each line: 'line' and the group name
              .attr("d",  path)
              .style("fill", "none" )
              .style("stroke", d => colorScaleSex(d.sex))
              .style("opacity", d => opacityScale(d.age_group))
            //   .on("mouseover", function() {
            //       d3.select(this).style("stroke-width", 3).style("opacity", 1);
            //   })
            //   .on("mouseout", function() {
            //       d3.select(this).style("stroke-width", 1).style("opacity", 0.7);
            //   });
            //   .style("opacity", 0.5)
              .on("mouseover", highlight)
              .on("mouseleave", doNotHighlight )
  
          // **在右側加上每條線的標籤**
        //   svgDetail.selectAll("myLabels")
        //       .data(filteredData)
        //       .join("text")
        //       .attr("x", width + 5) // 放在最右側
        //       .attr("y", d => y[dimensions[dimensions.length - 1]](d[dimensions[dimensions.length - 1]]))
        //       .text(d => (`${d.sex} ${d.age_group}`))
        //       .style("stroke", d => colorScaleSex(d.sex))
        //       .style("opacity", d => opacityScale(d.age_group))
        //       .style("font-size", "10px")
        //       .attr("alignment-baseline", "middle")
        //       .on("mouseover", highlight)
        //       .on("mouseleave", doNotHighlight )
          
          // Draw the axis:
          svgDetail.selectAll("myAxis")
              // For each dimension of the dataset I add a 'g' element:
              .data(dimensions).enter()
              .append("g")
              .attr("class", "axis")
              // I translate this element to its right position on the x axis
              .attr("transform", function(d) { return `translate(${x(d)})`})
              // And I build the axis with the call function
              .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); })
              // Add axis title
              .append("text")
              .style("text-anchor", "end")
              .attr("y", height +9)
              .attr("transform", `rotate(-13, 0, ${height + 9})`)
              .text(d => labels[d])
              .style("fill", "#222222")
  

        // svgDetail.selectAll(".line")
        //     .data(filteredData)
        //     .join("path")
        //     .attr("class", "line")
        //     .attr("d", path)
        //     .style("stroke", d => colorScaleSex(d.sex))
        //     .style("stroke-dasharray", d => lineStyle(d))
        //     .style("opacity", 0.8)
        //     .on("mouseover", function(event, d) {
        //         d3.select(this).style("stroke-width", 3).style("opacity", 1);
        //         tooltip.style("visibility", "visible")
        //             .html(`Age: ${d.age_group}<br>Sex: ${d.sex}<br>GHG: ${d.mean_ghgs}`)
        //             .style("left", (event.pageX + 10) + "px")
        //             .style("top", (event.pageY - 10) + "px");
        //     })
        //     .on("mouseout", function() {
        //         d3.select(this).style("stroke-width", 1).style("opacity", 0.8);
        //         tooltip.style("visibility", "hidden");
        //     });

        // svgDetail.append("path")
        //     .datum(meanValues)
        //     .attr("class", "mean-line")
        //     .attr("d", path)
        //     .style("stroke", "black")
        //     .style("stroke-width", 2)
        //     .style("opacity", 0.3)
        //     .style("stroke-dasharray", "5,5");
        drawDetailLegend();
    }

    function drawMainLegend() {
        const legendContainer = d3.select("#main-legend");
    
        legendContainer.selectAll(".legend-item")
            .data(Object.entries(dietGroupLabels))
            .join("div")
            .attr("class", "legend-item")
            .html(d => `
                <span class="legend-rect" style="background:${colorScaleDiet(d[0])}"></span>
                <span>${d[1]}</span>
            `);
    }

    function drawDetailLegend() {
        const detailLegend = d3.select("#detail-legend");
        detailLegend.html(""); // **清空舊內容**
        
        // **Sex Legend**
        const sexLegend = detailLegend.append("div").attr("class", "legend-container-inner");
        sexLegend.append("span").text("Sex:") .style("font-size", "12px");
    
        ["male", "female"].forEach(sex => {
            sexLegend.append("div")
                .attr("class", "legend-item")
                .html(`
                    <span class="legend-rect" style="background:${colorScaleSex(sex)}"></span>
                    <span>${sex}</span>
                `);
        });
    
        // **Age Group Legend**
        const ageLegend = detailLegend.append("div").attr("class", "legend-container-opacity");
        ageLegend.append("span").text("Age Group:") .style("font-size", "12px").style("margin-right", "15px");
    
        const ageGroups = ["20-29", "30-39", "40-49", "50-59", "60-69", "70-79"];
    
        ageGroups.forEach(age => {
            ageLegend.append("div")
                .attr("class", "legend-item-opacity")
                .html(`
                    <span class="legend-rect-opacity" style="background:#222222; opacity:${opacityScale(age)}"></span>
                    <span>${age}</span>
                `);
        });
    }
    
    