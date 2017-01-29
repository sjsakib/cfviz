var api_url = "http://codeforces.com/api/";
var handle = "";

var verdicts = {};
var langs = {};
var tags = {};
var levels = {};
var problems = {};
var totalSub = 0;

var req1,req2;

google.charts.load('current', { 'packages': ['corechart'] });

$(document).ready(function() {
  $("#handleform").submit(function(e) {

    e.preventDefault();
    $("#handle").blur();
    resetData();
    handle = $("#handle").val();

    req1 = $.get(api_url + "user.status", { "handle": handle }, function(data, status) {
      console.log(data);

      for (var i = data.result.length - 1; i >= 0; i--) {
        var sub = data.result[i];
        var problemId = sub.problem.contestId + '-' + sub.problem.index;
        if (problems[problemId] === undefined) {
          problems[problemId] = {
            attempts: 1,
            solved: 0,
          };
        } else {
          if (problems[problemId].solved === 0) problems[problemId].attempts++;
        }

        if (verdicts[sub.verdict] === undefined) verdicts[sub.verdict] = 1;
        else verdicts[sub.verdict]++;

        if (langs[sub.programmingLanguage] === undefined) langs[sub.programmingLanguage] = 1;
        else langs[sub.programmingLanguage]++;

        if (sub.verdict == 'OK') {
          sub.problem.tags.forEach(function(t) {
            if (tags[t] === undefined) tags[t] = 1;
            else tags[t]++;
          });

          if (levels[sub.problem.index] === undefined) levels[sub.problem.index] = 1;
          else levels[sub.problem.index]++;

          problems[problemId].solved++;

        }
        totalSub = data.result.length;
      }

      if (typeof google.visualization === 'undefined') {
        google.charts.setOnLoadCallback(drawCharts);
      } else {
        drawCharts();
      }
    }).fail(function(xhr,status) {
      console.log(status);
      if(status != 'abort') $("#handleDiv").addClass("is-invalid");
    })
    .always(function() {
      $("#mainSpinner").removeClass("is-active");
    });

    req2 = $.get(api_url + "user.rating", { 'handle': handle }, function(data, status) {
      console.log(data);
      var best = 1e10;
      var worst = -1e10;
      var maxUp = 0;
      var maxDown = 1e10;
      var bestCon = "";
      var worstCon = "";
      var maxUpCon = "";
      var maxDownCon = "";
      var tot = data.result.length;

      data.result.forEach(function(con) {
        if (con.rank < best) {
          best = con.rank;
          bestCon = con.contestId;
        }
        if (con.rank > worst) {
          worst = con.rank;
          worstCon = con.contestId;
        }
        var ch = con.newRating - con.oldRating;
        if (ch > maxUp) {
          maxUp = ch;
          maxUpCon = con.contestId;
        }
        if (ch < maxDown) {
          maxDown = ch;
          maxDownCon = con.contestId;
        }
      });

      var con_url = "http:codeforces.com/contest/";
      $("#contests").removeClass("hidden");
      $("#contestCount").html(tot);
      $("#best").html(best + "<a href=\"" + con_url + bestCon + "\" target=\"_blank\"> (" + bestCon + ") </a>");
      $("#worst").html(worst + "<a href=\"" + con_url + worstCon + "\" target=\"_blank\"> (" + worstCon + ") </a>");
      $("#maxUp").html(maxUp + "<a href=\"" + con_url + maxUpCon + "\" target=\"_blank\"> (" + maxUpCon + ") </a>");
      $("#maxDown").html(maxDown + "<a href=\"" + con_url + maxDownCon + "\" target=\"_blank\"> (" + maxDownCon + ") </a>");

      $(".share-div").removeClass("hidden");
      $(".sharethis").removeClass("hidden");
    });

  });

  handle = getParameterByName("handle");
  if (handle !== null) {
    $("#handle").val(handle);
    $("#handleform").submit();
  }
  $("#handleDiv").removeClass("hidden");
});

function drawCharts() {
  //Plotting the verdicts chart
  $('#verdicts').removeClass('hidden');
  var verTable = [
    ["Verdict", "Count"]
  ];
  var verSliceColors = [];
  for (var ver in verdicts) {
    if (ver == "OK") {
      verTable.push(["AC", verdicts[ver]]);
      verSliceColors.push({ color: '#4CAF50' });
    } else if (ver == "WRONG_ANSWER") {
      verTable.push(["WA", verdicts[ver]]);
      verSliceColors.push({ color: '#f44336' });
    } else if (ver == "TIME_LIMIT_EXCEEDED") {
      verTable.push(["TLE", verdicts[ver]]);
      verSliceColors.push({ color: '#2196F3' });
    } else if (ver == "MEMORY_LIMIT_EXCEEDED") {
      verTable.push(["MLE", verdicts[ver]]);
      verSliceColors.push({ color: '#673AB7' });
    } else if (ver == "RUNTIME_ERROR") {
      verTable.push(["RTE", verdicts[ver]]);
      verSliceColors.push({ color: '#FF5722' });
    } else if (ver == "COMPILATION_ERROR") {
      verTable.push(["CPE", verdicts[ver]]);
      verSliceColors.push({ color: '#607D8B' });
    } else if (ver == "SKIPPED") {
      verTable.push(["SKIPPED", verdicts[ver]]);
      verSliceColors.push({ color: '#EEEEEE' });
    } else if (ver == "CLALLENGED") {
      verTable.push(["CLALLENGED", verdicts[ver]]);
      verSliceColors.push({ color: '#E91E63' });
    } else {
      verTable.push([ver, verdicts[ver]]);
      verSliceColors.push({});
    }
  }
  verdicts = new google.visualization.arrayToDataTable(verTable);
  var verOptions = {
    height: $('#verdicts').width(),
    title: 'Verdicts of '+handle,
    legend: 'none',
    pieSliceText: 'label',
    slices: verSliceColors,
    fontName: 'Roboto',
    titleTextStyle: {
      fontSize: 18,
      bold: false,
      color: '#757575'
    },
    is3D: true
  };
  var verChart = new google.visualization.PieChart(document.getElementById('verdicts'));
  verChart.draw(verdicts, verOptions);


  //Plotting the languages chart
  var colors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3','#009688',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800','#FF5722','#795548','#607D8B', '#E65100',
    '#827717','#004D40','#1A237E','#6200EA','#F50057','#304FFE','#b71c1c'];

  $('#langs').removeClass('hidden');
  var langTable = [
    ['Language', 'Count']
  ];
  for (var lang in langs) {
    langTable.push([lang, langs[lang]]);
  }
  langs = new google.visualization.arrayToDataTable(langTable);
  var langOptions = {
    height: $('#langs').width(),
    title: 'Languages of '+handle,
    legend: 'none',
    pieSliceText: 'label',
    fontName: 'Roboto',
    titleTextStyle: {
      fontSize: 18,
      bold: false,
      color: '#757575'
    },
    is3D: true,
    colors: colors.slice(0,Math.min(colors.length,langs.getNumberOfRows()))
  };
  var langChart = new google.visualization.PieChart(document.getElementById('langs'));
  langChart.draw(langs, langOptions);


  //the tags chart
  $('#tags').removeClass('hidden');
  var tagTable = [
    ['Tag', 'Count']
  ];
  for (var tag in tags) {
    tagTable.push([tag + ": " + tags[tag], tags[tag]]);
  }
  tagTable.sort(function(a,b) {
    if(a[1] == 'Cound') return -1;
    return b[1] - a[1];
  });
  tags = new google.visualization.arrayToDataTable(tagTable);
  var tagOptions = {
    width: Math.max(600,$('#tags').width()),
    height: Math.max(600,$('#tags').width())*0.75,
    chartArea: {width: '80%', height: '70%'},
    title: 'Tags of '+handle,
    pieSliceText: 'none',
    legend: {
      position: 'right',
      alignment: 'center',
      textStyle: {
        fontSize: 12,
        fontName: 'Roboto',
      }
    },
    pieHole: 0.5,
    tooltip: {
      ignoreBounds: true,
      text: 'value'
    },
    fontName: 'Roboto',
    titleTextStyle: {
      fontSize: 18,
      bold: false,
      color: '#757575'
    },
    colors: colors.slice(0,Math.min(colors.length,tags.getNumberOfRows()))
  };
  var tagChart = new google.visualization.PieChart(document.getElementById('tags'));
  tagChart.draw(tags, tagOptions);

  //Plotting levels
  $('#levels').removeClass('hidden');
  var levelTable = [
    ['Level', 'Solved']
  ];
  for (var level in levels) {
    levelTable.push([level, levels[level]]);
  }
  levelTable.sort(function(a, b) {
    if (a[0] == 'Level') return -1;
    if (a[0] > b[0]) return -1;
    else return 1;
  });
  levels = new google.visualization.arrayToDataTable(levelTable);
  var levelOptions = {
    width: Math.max($('#levels').width(),levels.getNumberOfRows()*50),
    height: 300,
    title: 'Levels (index in contest) of '+handle,
    legend: 'none',
    fontName: 'Roboto',
    titleTextStyle: {
      fontSize: 18,
      bold: false,
      color: '#757575'
    },
    vAxis: { format: '0' },
    colors: ['#3F51B5']
  };
  var levelChart = new google.visualization.ColumnChart(document.getElementById('levels'));
  levelChart.draw(levels, levelOptions);

  //The numbers
  var tried = 0;
  var solved = 0;
  var maxAttempt = 0;
  var maxAttemptProblem = "";
  var maxAc = "";
  var maxAcProblem = "";
  var unsolved = [];
  var solvedWithOneSub = 0;
  for (var p in problems) {
    tried++;
    if (problems[p].solved > 0) solved++;
    if (problems[p].solved === 0) unsolved.push(p);

    if (problems[p].attempts > maxAttempt) {
      maxAttempt = problems[p].attempts;
      maxAttemptProblem = p;
    }
    if (problems[p].solved > maxAc) {
      maxAc = problems[p].solved;
      maxAcProblem = p;
    }

    if(problems[p].solved == problems[p].attempts) solvedWithOneSub++;
  }
  $('#numbers').removeClass('hidden');
  $('#unsolvedCon').removeClass('hidden');
  $('.handle-text').html(handle);
  $("#tried").html(tried);
  $("#solved").html(solved);
  $("#maxAttempt").html(maxAttempt + "<a href=\"" + get_url(maxAttemptProblem) + "\" target=\"blank\" > (" + maxAttemptProblem + ") </a>");
  if (maxAc > 1) $("#maxAc").html(maxAc + "<a href=\"" + get_url(maxAcProblem) + "\" target=\"blank\" > (" + maxAcProblem + ") </a>");
  else $("#maxAc").html(1);
  $("#averageAttempt").html((totalSub / solved).toFixed(2));
  $("#solvedWithOneSub").html(solvedWithOneSub+" ("+(solvedWithOneSub/solved*100).toFixed(2)+"%)");

  unsolved.forEach(function(p) {
    var url = get_url(p);
    $("#unsolvedList").append("<div><a href=\"" + url + "\" target=\"_blank\" class=\"lnk\">" + p + "</a></div>");
  });
}

function resetData() {
  if(req1) req1.abort();
  if(req2) req2.abort();
  verdicts = {};
  langs = {};
  tags = {};
  levels = {};
  problems = {};
  totalSub = 0;
  $("#mainSpinner").addClass("is-active");
  $(".to-clear").empty();
  $(".to-hide").addClass("hidden");

}


function get_url(p) {
  var con = p.split('-')[0];
  var index = p.split('-')[1];

  var url = "";
  if (con.length < 4) url = "http://codeforces.com/contest/" + con + "/problem/" + index;
  else url = "http://codeforces.com/problemset/gymProblem/" + con + "/" + index;

  return url;
}

//Copied from stackoverflow :D
function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function fbShareResult() {
  var url = window.location.href + "?handle=" + handle;
  var top = screen.height / 2 - 150;
  var left = screen.width / 2 - 300;
  window.open("https://facebook.com/sharer/sharer.php?u=" + escape(url), 'Share',
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600,top=' + top + ',left=' + left);
}
