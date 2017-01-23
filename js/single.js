var api_url = "http://codeforces.com/api/";
$handle = "";

google.charts.load('current', {'packages':['corechart']});


$(document).ready(function() {
    $("#handleform").submit(function(e) {
        e.preventDefault();
        $(".handle-spinner").addClass("is-active");
        handle = $("#handle").val();

        $.get(api_url+"user.info", { "handles": handle }, function(data, status) {
            $(".handle-spinner").removeClass("is-active");
            $(".chart-card").removeClass("hidden");
            $(".chart-holder").empty();
            $(".loading-spinner").removeClass("hidden");
            $(".loading-spinner").addClass("is-active");

            if(typeof google.visualization === 'undefined') {
                google.charts.setOnLoadCallback(drawCharts);
            } else {
                drawCharts();
            }
        }).fail(function () {
            $(".handle-spinner").removeClass("is-active");
            console.log("Couldn't connect to server or user does not exists");
            $("#handleDiv").addClass("is-invalid");
        });

    });
});

function drawCharts() {
    $.get(api_url+"user.status", {"handle": handle}, function(data, status) {
        console.log(data);
        var verdicts = {};
        data.result.forEach(function(sub) {
            if(verdicts[sub.verdict] == undefined) verdicts[sub.verdict] = 1;
            else verdicts[sub.verdict]++;
        });
        var verTable = [["Verdict", "Count"]];
        var sliceColors = [];
        for(ver in verdicts) {
            if(ver == "OK") {
                verTable.push(["AC",verdicts[ver]]);
                sliceColors.push({color: 'green'})
            } else if(ver == "WRONG_ANSWER") {
                verTable.push(["WA",verdicts[ver]]);
                sliceColors.push({color: 'red'})
            } else if(ver == "TIME_LIMIT_EXCEEDED") {
                verTable.push(["TLE",verdicts[ver]]);
                sliceColors.push({color: 'blue'})
            } else if(ver == "MEMORY_LIMIT_EXCEEDED") {
                verTable.push(["MLE",verdicts[ver]]);
                sliceColors.push({color: 'pink'})
            } else if(ver == "RUNTIME_ERROR") {
                verTable.push(["RTE",verdicts[ver]]);
                sliceColors.push({color: 'purple'})
            } else if(ver == "COMPILATION_ERROR") {
                verTable.push(["CPE",verdicts[ver]]);
                sliceColors.push({color: 'gray'})
            } else  {
                verTable.push([ver,verdicts[ver]]);
                sliceColors.push({});
            }
        }
        verdicts = new google.visualization.arrayToDataTable(verTable);
        var options = {
          title: 'Verdicts',
          legend: 'none',
          pieSliceText: 'label',
          slices: sliceColors,
          fontName: 'Roboto',
          titleTextStyle: {
            fontSize: 18,
            bold: false
          },
          is3D: true
        };
        var chart = new google.visualization.PieChart(document.getElementById('verdicts'));
        chart.draw(verdicts,options);
        $("#verdictsSpinner").removeClass("is-active");
        $("#verdictsSpinner").addClass("hidden");
    });
}