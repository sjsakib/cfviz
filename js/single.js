var api_url = "http://codeforces.com/api/";
//var api_url = "/mnt/BAC4BB93C4BB4FFD/web/cfviz/";
var handle = "";

google.charts.load('current', { 'packages': ['corechart'] });

$(document).ready(function() {
  $("#handleform").submit(function(e) {
    e.preventDefault();
    $("#handle").blur();

    resetData();
    
    handle = $("#handle").val();
    document.title+=": "+handle;

    $.get(api_url+ "user.rating", {'handle': handle}, function(data,status) {
      console.log(data);
      var best = 1e10;
      var worst = -1e10;
      var maxUp = 0;
      var maxDown = 1e10;
      var bestCon = "";
      var worstCon  = "";
      var maxUpCon = "";
      var maxDownCon = "";
      var tot = data.result.length;

      data.result.forEach(function(con) {
        if(con.rank < best) {
          best = con.rank;
          bestCon = con.contestId;
        }
        if(con.rank > worst) {
          worst = con.rank;
          worstCon  = con.contestId;
        }
        var ch = con.newRating - con.oldRating;
        if(ch > maxUp) {
          maxUp = ch;
          maxUpCon = con.contestId;
        }
        if( ch < maxDown ) {
          maxDown = ch;
          maxDownCon = con.contestId;
        }
      });

      var con_url = "http:codeforces.com/contest/";
      $("#contests").removeClass("hidden");
      $("#contestCount").html(tot);
      $("#best").html(best+"<a href=\""+con_url+bestCon+"\" target=\"_blank\"> ("+bestCon+") </a>");
      $("#worst").html(worst+"<a href=\""+con_url+worstCon+"\" target=\"_blank\"> ("+worstCon+") </a>");
      $("#maxUp").html(maxUp+"<a href=\""+con_url+maxUpCon+"\" target=\"_blank\"> ("+maxUpCon+") </a>");
      $("#maxDown").html(maxDown+"<a href=\""+con_url+maxDownCon+"\" target=\"_blank\"> ("+maxDownCon+") </a>");

      $(".share-div").removeClass("hidden");
      $(".sharethis").removeClass("hidden");
      setShareUrl();
    });
    if (typeof google.visualization === 'undefined') {
      google.charts.setOnLoadCallback(drawCharts);
    } else {
      drawCharts();
    }

  });

  handle = getParameterByName("handle");
  if(handle !== null) {
    $("#handle").val(handle);
    $("#handleform").submit();
  }
  $("#handleDiv").removeClass("hidden");
});

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
    //$("#verdicts").height($("#verdicts").width());
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
    //$("#langs").height($("#langs").width());
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

function setShareUrl() {
  var url = "http://cfviz.netlifly.com/index.html?handle="+handle;
  url = encodeURIComponent(url);
  $(".fb-share-button").data('href',url);
  $(".fb-send").data('href',url);
  if(typeof FB !== 'undefined') FB.XFBML.parse();
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