// set the dimensions and margins of the graph
    const margin = {top: 30, right: 50, bottom: 50, left: 120},
    width = 800 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;
    
    // append the svg object to the body of the page
    const svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left},${margin.top})`);
        
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

    // Parse the Data
    d3.csv("diet.csv").then( _data => {
        data = _data
        data.forEach(d => {
            d.mean_ghgs = +d.mean_ghgs;
            d.mean_land = +d.mean_land;
            d.mean_watscar = +d.mean_watscar;
            d.mean_eut = +d.mean_eut;
            d.mean_ghgs_ch4 = +d.mean_ghgs_ch4;
            d.mean_ghgs_n2o = +d.mean_ghgs_n2o;
            d.mean_bio = +d.mean_bio;
            d.mean_watuse = +d.mean_watuse;
            d.mean_acid = +d.mean_acid;

        });
        console.log(data)
      // Color scale: give me a specie name, I return a color
      const color = d3.scaleOrdinal()
        .domain(['fish', 'meat50', 'meat100', 'meat', 'vegan', 'veggie'])
        .range([ "#440154ff", "#21908dff", "#fde725ff", "#a83e32", "#db7323", "#3f7fc4"])
    
      // Here I set the list of dimension manually to control the order of axis:
      dimensions = ["mean_ghgs", "mean_land", "mean_watscar", "mean_eut",
     "mean_ghgs_ch4", "mean_ghgs_n2o", "mean_bio", "mean_watuse", "mean_acid"]
    
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
          .style("stroke", color(selected_diet))
          .style("opacity", "1")
      }
    
      // Unhighlight
      const doNotHighlight = function(d){
        d3.selectAll(".line")
          .transition().duration(200).delay(800)
          .style("stroke", function(d){ return( color(d.diet_group))} )
          .style("opacity", "1")
      }
    
      // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
      function path(d) {
          return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
      }
    
      // Draw the lines
      svg
        .selectAll("myPath")
        .data(data)
        .join("path")
          .attr("class", function (d) { return "line " + d.diet_group } ) // 2 class for each line: 'line' and the group name
          .attr("d",  path)
          .style("fill", "none" )
          .style("stroke", function(d){ return( color(d.diet_group))} )
          .style("opacity", 0.5)
          .on("mouseover", highlight)
          .on("mouseleave", doNotHighlight )

     // **在右側加上每條線的標籤**
     svg.selectAll("myLabels")
        .data(data)
        .join("text")
        .attr("x", width + 5) // 放在最右側
        .attr("y", d => y[dimensions[dimensions.length - 1]](d[dimensions[dimensions.length - 1]]))
        .text(d => d.diet_group) // 顯示 diet_group 名稱
        .style("fill", d => color(d.diet_group))
        .style("font-size", "10px")
        .attr("alignment-baseline", "middle")
        .on("mouseover", highlight)
          .on("mouseleave", doNotHighlight )
    
      // Draw the axis:
      svg.selectAll("myAxis")
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
          .style("fill", "black")
    
    })