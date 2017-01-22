var api_url = "http://codeforces.com/api/";
$handle = "";


$(document).ready(function() {
    $("#handleform").submit(function(e) {
        e.preventDefault();
        console.log("submitted");
        handle = $("#handle").val();
        $.get(api_url+"user.info", { "handles": handle }, function(data, status) {
            $(".chart-card").removeClass("hidden");
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(drawCharts);
        }).fail(function () {
            console.log("Couldn't connect to server or user does not exists");
            $("#handleDiv").addClass("is-invalid");
        });

    });
});

function drawCharts() {
    $.get(api_url+"user.status", {"handle": handle}, function(data, status) {
        console.log(data);
        var verdicts = {};
        /*verdicts = {
            "Failed": 0,
            "AC": 0,
            "Partial": 0,
            "CE": 0,
            "RTE": 0,
            "WA": 0,
            "PE": 0,
            "TLE": 0,
            "MLE": 0,
            "ILE": 0,
            "SV": 0,
            "Crashed": 0,
            "IPC": 0,
            "Challenged": 0,
            "Skipped": 0,
            "Testing": 0,
            "Rejected": 0
        };*/
        data.result.forEach(function(sub) {
            if(verdicts[sub.verdict] == undefined) verdicts[sub.verdict] = 1;
            else verdicts[sub.verdict]++;
        });
        var verTable = [["Verdict", "Count"]];
        for(ver in verdicts) {
            verTable.push([ver,verdicts[ver]]);
        }
        console.log(verTable);
        verdicts = new google.visualization.arrayToDataTable(verTable);
        console.log(verdicts);
        var options = {
          title: 'Verdicts',
          legend: 'none',
          piSliceText: 'label'
        };
        var chart = new google.visualization.PieChart(document.getElementById('verdicts'));
        chart.draw(verdicts,options);
    });
}