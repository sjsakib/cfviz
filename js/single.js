var api_url = 'https://codeforces.com/api/';
var handle = '';

var verdicts = {};
var langs = {};
var tags = {};
var levels = {};
var ratings = {};
var problems = {};
var totalSub = 0;
var heatmap = {};
var heatmapData = {};
var years = 0;

var req1, req2;

var titleTextStyle = {
  fontSize: 18,
  color: '#393939',
  bold: false
};

google.charts.load('current', { packages: ['corechart', 'calendar'] });

$(document).ready(function () {
  // When the handle form is submitted, this function is called...
  $('#handleform').submit(function (e) {
    e.preventDefault();
    $('#handle').blur();
    resetData(); // When a new submission is made, clear all the previous data and graphs

    handle = $('#handle').val().trim();

    if (!handle) {
      err_message('handleDiv', 'Enter a name');
      $('#mainSpinner').removeClass('is-active');
      return; // No handle is provided, we can't do anything.
    }

    // getting all the submissions of a user
    req1 = $.get(api_url + 'user.status', { handle: handle }, function (data, status) {
     
      $('.sharethis').removeClass('hidden');

      if (data.result.length < 1) {
        err_message('handleDiv', 'No submissions');
        return;
      }

      // parsing all the submission and saving useful data. Don't remember why from the back
      for (var i = data.result.length - 1; i >= 0; i--) {
        var sub = data.result[i];

        // creating unique key for problem {contestID + problem name + problem rating}
        var rating;
        if (sub.problem.rating === undefined) {
          rating = 0;
        } else {
          rating = sub.problem.rating;
        }

        var problemId = sub.problem.contestId + '-' + sub.problem.name + '-' + rating;

        // previous id for removing duplicates
        var problemIdprev =
          sub.problem.contestId - 1 + '-' + sub.problem.name + '-' + rating;

        // next id for removing duplicates
        var problemIdnext =
          sub.problem.contestId + 1 + '-' + sub.problem.name + '-' + rating;

        // checking if problem previously visited
        if (problems[problemIdprev] !== undefined) {
          if (problems[problemIdprev].solved === 0) {
            problems[problemIdprev].attempts++;
          }
          problemId = problemIdprev;
        } else if (problems[problemIdnext] !== undefined) {
          if (problems[problemIdnext].solved === 0) {
            problems[problemIdnext].attempts++;
          }
          problemId = problemIdnext;
        } else if (problems[problemId] !== undefined) {
          if (problems[problemId].solved === 0) {
            problems[problemId].attempts++;
          }
        } else {
          problems[problemId] = {
            problemlink: sub.contestId + '-' + sub.problem.index, // link of problem
            attempts: 1,
            solved: 0 // We also want to save how many submission got AC, a better name would have been number_of_ac
          };
        }

        if (sub.verdict == 'OK') {
          problems[problemId].solved++;
        }

        // modifying level, rating, and tag counter on first AC.
        if (problems[problemId].solved === 1 && sub.verdict == 'OK') {
          sub.problem.tags.forEach(function (t) {
            if (tags[t] === undefined) tags[t] = 1;
            else tags[t]++;
          });

          if (levels[sub.problem.index[0]] === undefined)
            levels[sub.problem.index[0]] = 1;
          else levels[sub.problem.index[0]]++;

          if (sub.problem.rating) {
            if (ratings[sub.problem.rating] === undefined) {
              ratings[sub.problem.rating] = 1;
            } else {
              ratings[sub.problem.rating]++;
            }
          }
        }

        // changing counter of verdict submission
        if (verdicts[sub.verdict] === undefined) verdicts[sub.verdict] = 1;
        else verdicts[sub.verdict]++;

        // changing counter of launguage submission
        if (langs[sub.programmingLanguage] === undefined)
          langs[sub.programmingLanguage] = 1;
        else langs[sub.programmingLanguage]++;

        //updating the heatmap
        var date = new Date(sub.creationTimeSeconds * 1000); // submission date
        date.setHours(0, 0, 0, 0);
        if (heatmap[date.valueOf()] === undefined) heatmap[date.valueOf()] = 1;
        else heatmap[date.valueOf()]++;
        totalSub = data.result.length;

        // how many years are there between first and last submission
        years =
          new Date(data.result[0].creationTimeSeconds * 1000).getYear() -
          new Date(
            data.result[data.result.length - 1].creationTimeSeconds * 1000
          ).getYear();
        years = Math.abs(years) + 1;
      }

      // finally draw the charts if google charts is already loaded,
      // if not set load callback to draw the charts
      if (typeof google.visualization === 'undefined') {
        google.charts.setOnLoadCallback(drawCharts);
      } else {
        drawCharts();
      }
    })
      .fail(function (xhr, status) {
        //console.log(xhr.status);
        if (status != 'abort') err_message('handleDiv', "Couldn't find user");
      })
      .always(function () {
        $('#mainSpinner').removeClass('is-active');
        $('.share-div').removeClass('hidden');
      });

    // With this request we get all the rating changes of the user
    req2 = $.get(api_url + 'user.rating', { handle: handle }, function (data, status) {
      
      if (data.result.length < 1) {
        err_message('handleDiv', 'No contests');
        return;
      }
      var best = 1e10;
      var worst = -1e10;
      var maxUp = 0;
      var maxDown = 0;
      var bestCon = '';
      var worstCon = '';
      var maxUpCon = '';
      var maxDownCon = '';
      var tot = data.result.length;

      data.result.forEach(function (con) {
        // con is a contest
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

      // Showing the rating change data in proper places
      var con_url = 'https://codeforces.com/contest/';
      $('#contests').removeClass('hidden');
      $('.handle-text').html(handle);
      $('#contestCount').html(tot);
      $('#best').html(
        best +
          '<a href="' +
          con_url +
          bestCon +
          '" target="_blank"> (' +
          bestCon +
          ') </a>'
      );
      $('#worst').html(
        worst +
          '<a href="' +
          con_url +
          worstCon +
          '" target="_blank"> (' +
          worstCon +
          ') </a>'
      );
      $('#maxUp').html(
        maxUp +
          '<a href="' +
          con_url +
          maxUpCon +
          '" target="_blank"> (' +
          maxUpCon +
          ') </a>'
      );
      $('#maxDown').html(
        maxDown
          ? maxDown +
              '<a href="' +
              con_url +
              maxDownCon +
              '" target="_blank"> (' +
              maxDownCon +
              ') </a>'
          : '---'
      );
    });
  });

  // If there is a handle parameter in the url, we'll put it in the form
  // and automatically submit it to trigger the submit function, useful for sharing results
  handle = getParameterByName('handle');
  if (handle !== null) {
    $('#handle').val(handle);
    $('#handleform').submit();
  }
  $('#handleDiv').removeClass('hidden');

  // this is to update the heatmap when the form is submitted, contributed
  $('#heatmapCon input').keypress(function (e) {
    var value = $(this).val();
    //Enter pressed
    if (e.which == 13 && value >= 0 && value <= 999) {
      var heatmapOptions = {
        height: years * 140 + 30,
        width: Math.max($('#heatmapCon').width(), 900),
        fontName: 'Roboto',
        titleTextStyle: titleTextStyle,
        colorAxis: {
          minValue: 0,
          maxValue: value,
          colors: ['#ffffff', '#0027ff', '#00127d']
        },
        calendar: {
          cellSize: 15
        }
      };
      heatmap.draw(heatmapData, heatmapOptions);
    }
  });
});

function drawCharts() {
  //Plotting the verdicts chart
  $('#verdicts').removeClass('hidden');
  var verTable = [['Verdict', 'Count']];
  var verSliceColors = [];
  // beautiful names for the verdicts + colors
  for (var ver in verdicts) {
    if (ver == 'OK') {
      verTable.push(['AC', verdicts[ver]]);
      verSliceColors.push({ color: '#4CAF50' });
    } else if (ver == 'WRONG_ANSWER') {
      verTable.push(['WA', verdicts[ver]]);
      verSliceColors.push({ color: '#f44336' });
    } else if (ver == 'TIME_LIMIT_EXCEEDED') {
      verTable.push(['TLE', verdicts[ver]]);
      verSliceColors.push({ color: '#2196F3' });
    } else if (ver == 'MEMORY_LIMIT_EXCEEDED') {
      verTable.push(['MLE', verdicts[ver]]);
      verSliceColors.push({ color: '#673AB7' });
    } else if (ver == 'RUNTIME_ERROR') {
      verTable.push(['RTE', verdicts[ver]]);
      verSliceColors.push({ color: '#FF5722' });
    } else if (ver == 'COMPILATION_ERROR') {
      verTable.push(['CPE', verdicts[ver]]);
      verSliceColors.push({ color: '#607D8B' });
    } else if (ver == 'SKIPPED') {
      verTable.push(['SKIPPED', verdicts[ver]]);
      verSliceColors.push({ color: '#EEEEEE' });
    } else if (ver == 'CLALLENGED') {
      verTable.push(['CLALLENGED', verdicts[ver]]);
      verSliceColors.push({ color: '#E91E63' });
    } else {
      verTable.push([ver, verdicts[ver]]);
      verSliceColors.push({});
    }
  }
  verdicts = new google.visualization.arrayToDataTable(verTable);
  var verOptions = {
    height: $('#verdicts').width(),
    title: 'Verdicts of ' + handle,
    legend: 'none',
    pieSliceText: 'label',
    slices: verSliceColors,
    fontName: 'Roboto',
    titleTextStyle: titleTextStyle,
    is3D: true
  };
  var verChart = new google.visualization.PieChart(document.getElementById('verdicts'));
  verChart.draw(verdicts, verOptions);

  //Plotting the languages chart
  var colors = [
    '#f44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#2196F3',
    '#009688',
    '#8BC34A',
    '#CDDC39',
    '#FFC107',
    '#FF9800',
    '#FF5722',
    '#795548',
    '#607D8B',
    '#E65100',
    '#827717',
    '#004D40',
    '#1A237E',
    '#6200EA',
    '#3F51B5',
    '#F50057',
    '#304FFE',
    '#b71c1c'
  ];

  $('#langs').removeClass('hidden');
  var langTable = [['Language', 'Count']];
  for (var lang in langs) {
    langTable.push([lang, langs[lang]]);
  }
  langs = new google.visualization.arrayToDataTable(langTable);
  var langOptions = {
    height: $('#langs').width(),
    title: 'Languages of ' + handle,
    legend: 'none',
    pieSliceText: 'label',
    fontName: 'Roboto',
    titleTextStyle: titleTextStyle,
    is3D: true,
    colors: colors.slice(0, Math.min(colors.length, langs.getNumberOfRows()))
  };
  var langChart = new google.visualization.PieChart(document.getElementById('langs'));
  langChart.draw(langs, langOptions);

  //the tags chart
  $('#tags').removeClass('hidden');
  var tagTable = [];
  for (var tag in tags) {
    tagTable.push([tag + ': ' + tags[tag], tags[tag]]);
  }
  tagTable.sort(function (a, b) {
    return b[1] - a[1];
  });
  tags = new google.visualization.DataTable();
  tags.addColumn('string', 'Tag');
  tags.addColumn('number', 'solved');
  tags.addRows(tagTable);
  var tagOptions = {
    width: Math.max(600, $('#tags').width()),
    height: Math.max(600, $('#tags').width()) * 0.75,
    chartArea: { width: '80%', height: '70%' },
    title: 'Tags of ' + handle,
    pieSliceText: 'none',
    legend: {
      position: 'right',
      alignment: 'center',
      textStyle: {
        fontSize: 12,
        fontName: 'Roboto'
      }
    },
    pieHole: 0.5,
    tooltip: {
      text: 'percentage'
    },
    fontName: 'Roboto',
    titleTextStyle: titleTextStyle,
    colors: colors.slice(0, Math.min(colors.length, tags.getNumberOfRows()))
  };
  var tagChart = new google.visualization.PieChart(document.getElementById('tags'));
  tagChart.draw(tags, tagOptions);

  //Plotting levels
  $('#levels').removeClass('hidden');
  var levelTable = [];
  for (var level in levels) {
    levelTable.push([level, levels[level]]);
  }
  levelTable.sort(function (a, b) {
    if (a[0] > b[0]) return -1;
    else return 1;
  });
  levels = new google.visualization.DataTable();
  levels.addColumn('string', 'Level');
  levels.addColumn('number', 'solved');
  levels.addRows(levelTable);
  var levelOptions = {
    width: Math.max($('#levels').width(), levels.getNumberOfRows() * 50),
    height: 300,
    title: 'Levels of ' + handle,
    legend: 'none',
    fontName: 'Roboto',
    titleTextStyle: titleTextStyle,
    vAxis: { format: '0' },
    colors: ['#3F51B5']
  };
  var levelChart = new google.visualization.ColumnChart(
    document.getElementById('levels')
  );
  if (levelTable.length > 1) levelChart.draw(levels, levelOptions);

  //Plotting ratings
  $('#ratings').removeClass('hidden');
  var ratingTable = [];
  for (var rating in ratings) {
    ratingTable.push([rating, ratings[rating]]);
  }
  ratingTable.sort(function (a, b) {
    if (parseInt(a[0]) > parseInt(b[0])) return -1;
    else return 1;
  });
  ratings = new google.visualization.DataTable();
  ratings.addColumn('string', 'Rating');
  ratings.addColumn('number', 'solved');
  ratings.addRows(ratingTable);
  var ratingOptions = {
    width: Math.max($('#ratings').width(), ratings.getNumberOfRows() * 50),
    height: 300,
    title: 'Problem ratings of ' + handle,
    legend: 'none',
    fontName: 'Roboto',
    titleTextStyle: titleTextStyle,
    vAxis: { format: '0' },
    colors: ['#3F51B5']
  };
  var ratingChart = new google.visualization.ColumnChart(
    document.getElementById('ratings')
  );
  if (ratingTable.length > 1) ratingChart.draw(ratings, ratingOptions);

  /* heatmap */
  $('#heatmapCon').removeClass('hidden');
  $('#heatMapHandle').html(handle);
  var heatmapTable = [];
  for (var d in heatmap) {
    heatmapTable.push([new Date(parseInt(d)), heatmap[d]]);
  }
  heatmapData = new google.visualization.DataTable();
  heatmapData.addColumn({ type: 'date', id: 'Date' });
  heatmapData.addColumn({ type: 'number', id: 'Submissions' });
  heatmapData.addRows(heatmapTable);

  heatmap = new google.visualization.Calendar(document.getElementById('heatmapDiv'));
  var heatmapOptions = {
    height: years * 140 + 30,
    width: Math.max($('#heatmapCon').width(), 900),
    fontName: 'Roboto',
    titleTextStyle: titleTextStyle,
    colorAxis: {
      minValue: 0,
      colors: ['#ffffff', '#0027ff', '#00127d']
    },
    calendar: {
      cellSize: 15
    }
  };
  heatmap.draw(heatmapData, heatmapOptions);

  //parse all the solved problems and extract some numbers about the solved problems
  var tried = 0;
  var solved = 0;
  var maxAttempt = 0;
  var maxAttemptProblem = '';
  var maxAc = '';
  var maxAcProblem = '';
  var unsolved = [];
  var solvedWithOneSub = 0;
  for (var p in problems) {
    tried++;
    if (problems[p].solved > 0) solved++;
    if (problems[p].solved === 0) unsolved.push(problems[p].problemlink);

    if (problems[p].attempts > maxAttempt) {
      maxAttempt = problems[p].attempts;
      maxAttemptProblem = problems[p].problemlink;
    }
    if (problems[p].solved > maxAc) {
      maxAc = problems[p].solved;
      maxAcProblem = problems[p].problemlink;
    }

    if (problems[p].solved > 0 && problems[p].attempts == 1) solvedWithOneSub++;
  }

  $('#numbers').removeClass('hidden');
  $('#unsolvedCon').removeClass('hidden');
  $('.handle-text').html(handle);
  $('#tried').html(tried);
  $('#solved').html(solved);
  $('#maxAttempt').html(
    maxAttempt +
      '<a href="' +
      get_url(maxAttemptProblem) +
      '" target="blank" > (' +
      maxAttemptProblem +
      ') </a>'
  );
  if (maxAc > 1)
    $('#maxAc').html(
      maxAc +
        '<a href="' +
        get_url(maxAcProblem) +
        '" target="blank" > (' +
        maxAcProblem +
        ') </a>'
    );
  else $('#maxAc').html(solved ? 1 : 0);
  $('#averageAttempt').html((totalSub / solved).toFixed(2));
  $('#solvedWithOneSub').html(
    solvedWithOneSub +
      ' (' +
      (solved ? ((solvedWithOneSub / solved) * 100).toFixed(2) : 0) +
      '%)'
  );

  unsolved.forEach(function (p) {
    var url = get_url(p);
    $('#unsolvedList').append(
      '<div><a href="' + url + '" target="_blank" class="lnk">' + p + '</a></div>'
    );
  });
}

// reset all data
function resetData() {
  // if the requests were already made, abort them
  if (req1) req1.abort();
  if (req2) req2.abort();
  verdicts = {};
  langs = {};
  tags = {};
  levels = {};
  problems = {};
  totalSub = 0;
  heatmap = {};
  ratings = {};
  $('#mainSpinner').addClass('is-active');
  $('.to-clear').empty();
  $('.to-hide').addClass('hidden');
}

// receives the problem id like 650-A
// splits the contest id and problem index and returns the problem url
function get_url(p) {
  var con = p.split('-')[0];
  var index = p.split('-')[1];

  var url = '';
  if (con.length <= 4)
    url = 'https://codeforces.com/contest/' + con + '/problem/' + index;
  else url = 'https://codeforces.com/problemset/gymProblem/' + con + '/' + index;

  return url;
}

//Copied from stackoverflow :D gets url paramenter by name
function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Opens a share window when the share button is clicked
function fbShareResult() {
  var url = window.location.href + '?handle=' + handle; // generation share url
  var top = screen.height / 2 - 150;
  var left = screen.width / 2 - 300;
  window.open(
    'https://facebook.com/sharer/sharer.php?u=' + escape(url),
    'Share',
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600,top=' +
      top +
      ',left=' +
      left
  );
}

// shows am error message in the input form
// Needs the div name of the input widget
function err_message(div, msg) {
  $('#' + div + 'Err').html(msg);
  $('#' + div).addClass('is-invalid');
}
