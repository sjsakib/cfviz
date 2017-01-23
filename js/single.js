var api_url = "http://codeforces.com/api/";
$handle = "";

google.charts.load('current', { 'packages': ['corechart'] });


$(document).ready(function() {
  $("#handleform").submit(function(e) {
    e.preventDefault();
    $("#mainSpinner").addClass("is-active");
    $(".chart-card")
      .empty()
      .addClass("hidden");

    handle = $("#handle").val();

    if (typeof google.visualization === 'undefined') {
      google.charts.setOnLoadCallback(drawCharts);
    } else {
      drawCharts();
    }

  });
});

function drawCharts() {
  $.get(api_url + "user.status", { "handle": handle }, function(data, status) {
    console.log(data);

    $(".chart-card").removeClass("hidden");


    var verdicts = {};
    var langs = {};
    var tags = {};

    data.result.forEach(function(sub) {
      if (verdicts[sub.verdict] === undefined) verdicts[sub.verdict] = 1;
      else verdicts[sub.verdict]++;

      if (langs[sub.programmingLanguage] === undefined) langs[sub.programmingLanguage] = 1;
      else langs[sub.programmingLanguage]++;

      if (sub.verdict == 'OK') {
        sub.problem.tags.forEach(function(t) {
          if (tags[t] === undefined) tags[t] = 1;
          else tags[t]++;
        });
      }
    });


    //Plotting the verdicts chart
    var verTable = [
      ["Verdict", "Count"]
    ];
    var verSliceColors = [];
    for (var ver in verdicts) {
      if (ver == "OK") {
        verTable.push(["AC", verdicts[ver]]);
        verSliceColors.push({ color: 'green' });
      } else if (ver == "WRONG_ANSWER") {
        verTable.push(["WA", verdicts[ver]]);
        verSliceColors.push({ color: 'red' });
      } else if (ver == "TIME_LIMIT_EXCEEDED") {
        verTable.push(["TLE", verdicts[ver]]);
        verSliceColors.push({ color: 'blue' });
      } else if (ver == "MEMORY_LIMIT_EXCEEDED") {
        verTable.push(["MLE", verdicts[ver]]);
        verSliceColors.push({ color: 'pink' });
      } else if (ver == "RUNTIME_ERROR") {
        verTable.push(["RTE", verdicts[ver]]);
        verSliceColors.push({ color: 'purple' });
      } else if (ver == "COMPILATION_ERROR") {
        verTable.push(["CPE", verdicts[ver]]);
        verSliceColors.push({ color: 'gray' });
      } else {
        verTable.push([ver, verdicts[ver]]);
        verSliceColors.push({});
      }
    }
    verdicts = new google.visualization.arrayToDataTable(verTable);
    var verOptions = {
      title: 'Verdicts',
      legend: 'none',
      pieSliceText: 'label',
      slices: verSliceColors,
      fontName: 'Roboto',
      titleTextStyle: {
        fontSize: 18,
        bold: false
      },
      is3D: true
    };
    var verChart = new google.visualization.PieChart(document.getElementById('verdicts'));
    verChart.draw(verdicts, verOptions);
    $("#verdictsSpinner").removeClass("is-active");
    $("#verdictsSpinner").addClass("hidden");



    //Plotting the languages chart
    var langTable = [
      ['Language', 'Count']
    ];
    for (var lang in langs) {
      langTable.push([lang, langs[lang]]);
    }
    var langOptions = {
      title: 'Languages',
      legend: 'none',
      pieSliceText: 'label',
      fontName: 'Roboto',
      titleTextStyle: {
        fontSize: 18,
        bold: false
      },
      is3D: true
    };
    langs = new google.visualization.arrayToDataTable(langTable);
    var langChart = new google.visualization.PieChart(document.getElementById('langs'));
    langChart.draw(langs, langOptions);
  })
  .fail(function() {
    $("#handleDiv").addClass("is-invalid");
  })
  .always(function() {
    $("#mainSpinner").removeClass("is-active");
  });
}
