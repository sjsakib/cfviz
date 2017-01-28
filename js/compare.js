var api_url = "http://codeforces.com/api/";
var handle1 = "";
var handle2 = "";

var conData1 = {};
var conData2 = {};

google.charts.load('current', { 'packages': ['corechart', 'line'] });

$(document).ready(function() {
  $("#handleform").submit(function(e) {
    e.preventDefault();
    $("#handle1").blur();
    $("#handle2").blur();

    resetData();
    
    handle1 = $("#handle1").val();
    handle2 = $("#handle2").val();

    //Getting handle1 contest data
    var req1 = $.get(api_url+ "user.rating", {'handle': handle1}, function(data,status) {
      console.log(data);
      conData1 = getContestStat(data);
    }).fail(function() {
      $("handle1Div").addClass("is-invalid");
    });

    //Getting handle1 contest data
    var req2 = $.get(api_url+ "user.rating", {'handle': handle2}, function(data,status) {
      console.log(data);
      conData2 = getContestStat(data);
    }).fail(function() {
      $("handle2Div").addClass("is-invalid");
    });

    $.when(req1,req2).then(function() {
      if (typeof google.visualization === 'undefined') {
        google.charts.setOnLoadCallback(drawConCharts);
      } else {
        drawConCharts();
      }
    });

  });

  handle = getParameterByName("handle");
  if(handle !== null) {
    $("#handle").val(handle);
    $("#handleform").submit();
  }
  $("#handleDiv").removeClass("hidden");
});


function drawConCharts() {

  var colors = ['#009688', '#3F51B5']
  //Rating
  var rating = new google.visualization.arrayToDataTable([
    ['Handle', handle1, handle2],
    ['Current Rating', conData1.rating, conData2.rating],
    ['Max Rating', conData1.maxRating, conData2.maxRating],
    ['Min Rating', conData1.minRating, conData2.minRating]
  ]);
  var ratingOptions = {
    title: "Rating",
    titleTextStyle: {
      fontSize: 18,
      bold: false
    },
    fontName: 'Roboto',
    vAxis: {
      viewWindow: {
        min: 400
      }
    },
    bar: { groupWidth: '30%' },
    legend: {
      position: 'top',
      alignment: 'end'
    },
    animation: {
      duration: 4000,
      easing: 'in',
      startup: true
    },
    colors: colors
  };
  var ratingChart = new google.visualization.ColumnChart(document.getElementById('ratings'));
  $("#ratings").removeClass('hidden');
  ratingChart.draw(rating,ratingOptions);

  //Contests Count
  var contests = new google.visualization.arrayToDataTable([
    ['Handle', 'Contests', {role: 'style'}],
    [ handle1, conData1.tot, colors[0] ],
    [ handle2,  conData2.tot, colors[1] ]
  ]);
  var contestsOptions = {
    title: "Contests",
    fontName: 'Roboto',
    titleTextStyle: {
      fontSize: 18,
      bold: false
    },
    bar: { groupWidth: '30%' },
    legend: 'none',
    animation: {
      duration: 4000,
      easing: 'in',
      startup: true
    },
  };
  var contestsChart = new google.visualization.ColumnChart(document.getElementById('contestsCount'));
  $("#contestsCount").removeClass('hidden');
  contestsChart.draw(contests,contestsOptions);

  //Max up and downs
  var upDowns = new google.visualization.arrayToDataTable([
    ['Handle', handle1, handle2],
    ['Max Up', conData1.maxUp, conData2.maxUp],
    ['Max Down', conData1.maxDown, conData2.maxDown],
  ]);
  var upDownsOptions = {
    title: "Ups and Donws",
    fontName: 'Roboto',
    legend: { 
      position: 'top',
      alignment: 'end'
    },
    titleTextStyle: {
      fontSize: 18,
      bold: false
    },
    bar: {groupWidth: '30%'},
    animation: {
      duration: 1000,
      easing: 'in',
      startup: true
    },
    colors: colors
  };
  var upDownsChart = new google.visualization.ColumnChart(document.getElementById('upDowns'));
  $("#upDowns").removeClass('hidden');
  upDownsChart.draw(upDowns,upDownsOptions);

  //Worst Best
  $("#bestWorst").removeClass("hidden");
  $("#user1").html(handle1);
  $("#user2").html(handle2);
  $("#user1Best").html(conData1.best);
  $("#user2Best").html(conData2.best);
  $("#user1Worst").html(conData1.worst);
  $("#user2Worst").html(conData2.worst);

  //Rating Timeline
  var timeline = new google.visualization.DataTable();
  timeline.addColumn('date','Date');
  timeline.addColumn('number',handle1);
  timeline.addColumn('number',handle2);

  timeline.addRows(alignTimeline(conData1.timeline,conData2.timeline));

  $("#timelineCon").removeClass('hidden');
  var timelineOptions = {
    title: 'Timeline',
    fontName: 'Roboto',
    titleTextStyle: {
      fontSize: 18,
      bold: false
    },
    legend: {
      position: 'top',
      alignment: 'end',
    },
    width: Math.max(timeline.getNumberOfRows()*10,$("#timelineCon").width()),
    height: 300,
    hAxis: {
      format: 'MMM yy',
    },
    vAxis: {
      minValue: 0,
    },
    colors: colors
  };
  var timelineChart = new google.visualization.LineChart(document.getElementById('timeline'));
  timelineChart.draw(timeline,timelineOptions);


}


function drawCharts() {
  $.get(api_url + "user.status", { "handle": handle }, function(data, status) {
    console.log(data);

    $(".chart-card").removeClass("hidden");


    var verdicts = {};
    var langs = {};
    var tags = {};
    var levels = {};
    var problems = {};
 
    for(var i = data.result.length-1;i>=0;i--) {
      var sub = data.result[i];
      var problemId = sub.problem.contestId+'-'+sub.problem.index;
      if(problems[problemId] === undefined) {
        problems[problemId] = {
          attempts: 1,
          solved: 0,
        };
      } else {
        if(problems[problemId].solved === 0) problems[problemId].attempts++;
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

        if(levels[sub.problem.index] === undefined) levels[sub.problem.index] = 1;
        else levels[sub.problem.index]++;

        problems[problemId].solved++;

      }
    }


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


    //the tags chart
    var tagTable = [['Tag', 'Count']];
    for(var tag in tags) {
      tagTable.push([tag+": "+tags[tag], tags[tag]]);
    }
    var tagOptions = {
      title: 'Tags',
      pieSliceText: 'none',
      legend: {
        position: 'bottom',
        maxLines: 2,
        fontName: 'Roboto',
      },
      pieHole: 0.5,
      tooltip: {
        ignoreBounds: true,
        text: 'value'
      },
      fontName: 'Roboto',
      titleTextStyle: {
        fontSize: 18,
        bold: false
      },
    };
    $("#tags").height($("#tags").width());
    tags = new google.visualization.arrayToDataTable(tagTable);
    var tagChart = new google.visualization.PieChart(document.getElementById('tags'));
    tagChart.draw(tags, tagOptions);

    //Plotting levels
    var levelTable = [
      ['Level', 'Solved']
    ];
    for (var level in levels) {
      levelTable.push([level, levels[level]]);
    }
    levelTable.sort(function(a,b) {
      if(a[0] == 'Level') return -1;
      if(a[0] > b[0]) return -1;
      else return 1;
    });
    var levelOptions = {
      title: 'Levels (Index in contest)',
      legend: 'none',
      fontName: 'Roboto',
      titleTextStyle: {
        fontSize: 18,
        bold: false
      },
      hAxis: {format: '0'},
    };
    levels = new google.visualization.arrayToDataTable(levelTable);
    var levelChart = new google.visualization.BarChart(document.getElementById('levels'));
    levelChart.draw(levels, levelOptions);

    //The numbers
    var tried = 0;
    var solved = 0;
    var maxAttempt = 0;
    var maxAttemptProblem = "";
    var maxAc = "";
    var maxAcProblem = "";
    var unsolved = [];
    for(var p in problems) {
      tried++;
      if(problems[p].solved > 0) solved++;
      if(problems[p].solved === 0) unsolved.push(p);

      if(problems[p].attempts > maxAttempt) {
        maxAttempt = problems[p].attempts;
        maxAttemptProblem = p;
      }
      if(problems[p].solved > maxAc) {
        maxAc = problems[p].solved;
        maxAcProblem = p;
      }
    }
    $(".num-card").removeClass("hidden");
    $("#tried").html(tried);
    $("#solved").html(solved);
    $("#maxAttempt").html(maxAttempt+"<a href=\""+get_url(maxAttemptProblem)+"\" target=\"blank\" > ("+maxAttemptProblem+") </a>");
    if(maxAc > 1) $("#maxAc").html(maxAc+"<a href=\""+get_url(maxAcProblem)+"\" target=\"blank\" > ("+maxAcProblem+") </a>");
    else $("#maxAc").html(1);
    $("#averageAttempt").html((data.result.length/solved).toFixed(2));

    unsolved.forEach(function(p) {
      var url = get_url(p);
      $("#unsolvedList").append("<div><a href=\""+url+"\" target=\"_blank\" class=\"lnk\">"+p+"</a></div>");
    });

  })
  .fail(function() {
    $("#handleDiv").addClass("is-invalid");
  })
  .always(function() {
    $("#mainSpinner").removeClass("is-active");
  });
}

function resetData() {
  $("#mainSpinner").addClass("is-active");
  $(".chart-card")
    .empty()
    .addClass("hidden");
  $(".share-div").addClass("hidden");
  $(".num-card").addClass("hidden");
  $("#unsolvedList").empty();

}

function get_url(p) {
  var con = p.split('-')[0];
  var index = p.split('-')[1];

  var url = "";
  if(con.length < 4) url = "http://codeforces.com/contest/"+con+"/problem/"+index;
  else url = "http://codeforces.com/problemset/gymProblem/"+con+"/"+index;

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
  var url;
  if(handle) url = window.location.href+"?handle="+handle;
  else url = window.location.href;
  window.open("https://www.facebook.com/sharer/sharer.php?u="+escape(url), '', 
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
}