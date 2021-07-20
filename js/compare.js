var api_url = 'https://codeforces.com/api/';
var handle1 = '';
var handle2 = '';

var conData1 = {}; // contest data for user 1
var conData2 = {}; // contest data for suer 1

var subData1 = {}; // submission data for user 1
var subData2 = {}; // submission data for user 2

var colors = ['#009688', '#3F51B5'];

var req1, req2, req3, req4;

google.charts.load('current', { packages: ['corechart'] });

$(document).ready(function () {
  $('#handleform').submit(function (e) {
    e.preventDefault();
    $('#handle1').blur();
    $('#handle2').blur();

    resetData();

    handle1 = $('#handle1').val().trim();
    handle2 = $('#handle2').val().trim();

    if (!handle1) {
      err_message('handle2Div', 'Enter a name');
      $('#mainSpinner').removeClass('is-active');
      return;
    }
    if (!handle2) {
      err_message('handle2Div', 'Enter a name');
      $('#mainSpinner').removeClass('is-active');
      return;
    }

    //Getting handle1 contest data
    req1 = $.get(api_url + 'user.rating', { handle: handle1 }, function (data, status) {
      console.log(data);
      if (data.result.length > 0) conData1 = getContestStat(data);
      else {
        err_message('handle1Div', 'No contests');
        conData1 = null;
      }
    }).fail(function (xhr, status) {
      if (status != 'abort') {
        err_message('handle1Div', "Couldn't find user");
        $('#mainSpinner').removeClass('is-active');
      }
    });

    //Getting handle2 contest data
    req2 = $.get(api_url + 'user.rating', { handle: handle2 }, function (data, status) {
      console.log(data);
      if (data.result.length > 0) conData2 = getContestStat(data);
      else {
        err_message('handle2Div', 'No contests');
        conData2 = null;
      }
    }).fail(function (xhr, status) {
      if (status != 'abort') {
        err_message('handle2Div', "Couldn't find user");
        $('#mainSpinner').removeClass('is-active');
      }
    });

    $.when(req1, req2).then(function () {
      if (typeof google.visualization === 'undefined') {
        if (conData1 && conData2) google.charts.setOnLoadCallback(drawConCharts);
      } else {
        if (conData1 && conData2) drawConCharts();
      }

      // getting handle1 submission data
      // firefox doesn't allow more then 3 active connections at a time
      // that's why we have to send req3 and req4 when req1 and req2 is done
      req3 = $.get(api_url + 'user.status', { handle: handle1 }, function (data, status) {
        console.log(data);
        if (data.result.length > 0) subData1 = getSubData(data);
        else {
          err_message('handle1Div', 'No submissions');
          subData1 = null;
        }
      });
      req4 = $.get(api_url + 'user.status', { handle: handle2 }, function (data, status) {
        console.log(data);
        if (data.result.length > 0) subData2 = getSubData(data);
        else {
          err_message('handle2Div', 'No submissions');
          subData2 = null;
        }
      });

      $.when(req3, req4).then(function () {
        if (typeof google.visualization === 'undefined') {
          if (subData1 && subData2) google.charts.setOnLoadCallback(drawSubCharts);
        } else {
          if (subData1 && subData2) drawSubCharts();
        }
        $('.share-div').removeClass('hidden');
        $('#mainSpinner').removeClass('is-active');
        $('.sharethis').removeClass('hidden');
      });
    });
  });

  handle1 = getParameterByName('handle1');
  handle2 = getParameterByName('handle2');
  if (handle1 !== null && handle2 !== null) {
    $('#handle1').val(handle1);
    $('#handle2').val(handle2);
    $('#handleform').submit();
  }
  $('#handleDiv').removeClass('hidden');
});

// draw contest related charts, those can be done when req1 and req2 is complete
function drawConCharts() {
  //Rating
  var rating = new google.visualization.arrayToDataTable([
    ['Handle', handle1, handle2],
    ['Current Rating', conData1.rating, conData2.rating],
    ['Max Rating', conData1.maxRating, conData2.maxRating],
    ['Min Rating', conData1.minRating, conData2.minRating]
  ]);
  var ratingOptions = $.extend({}, commonOptions, {
    legend: legend,
    colors: colors,
    vAxis: {
      minValue: 0
    }
  });
  var ratingChart = new google.visualization.ColumnChart(
    document.getElementById('ratings')
  );
  $('#ratings').removeClass('hidden');
  ratingChart.draw(rating, ratingOptions);

  // Contests Count
  plotTwo('contestsCount', conData1.tot, conData2.tot, 'Contests');

  // Max up and downs
  var upDowns = new google.visualization.arrayToDataTable([
    ['Handle', handle1, handle2],
    ['Max Up', conData1.maxUp, conData2.maxUp],
    ['Max Down', conData1.maxDown, conData2.maxDown]
  ]);
  var upDownsOptions = $.extend({}, commonOptions, {
    legend: legend,
    colors: colors
  });
  var upDownsChart = new google.visualization.ColumnChart(
    document.getElementById('upDowns')
  );
  $('#upDowns').removeClass('hidden');
  upDownsChart.draw(upDowns, upDownsOptions);

  //Worst Best
  $('#bestWorst').removeClass('hidden');
  $('#user1').html(handle1);
  $('#user2').html(handle2);
  $('#user1Best').html(conData1.best);
  $('#user2Best').html(conData2.best);
  $('#user1Worst').html(conData1.worst);
  $('#user2Worst').html(conData2.worst);

  // Rating Timeline
  var timeline = new google.visualization.DataTable();
  timeline.addColumn('date', 'Date');
  timeline.addColumn('number', handle1);
  timeline.addColumn('number', handle2);

  timeline.addRows(alignTimeline(conData1.timeline, conData2.timeline));

  $('#timelineCon').removeClass('hidden');
  var timelineOptions = $.extend({}, commonOptions, scrollableOptions, {
    title: 'Timeline',
    legend: legend,
    width: Math.max(timeline.getNumberOfRows() * 7, $('#timelineCon').width()),
    height: 400,
    hAxis: {
      format: 'MMM yyyy'
    },
    vAxis: {
      viewWindowMode: 'pretty'
    },
    colors: colors,
    curveType: 'function'
  });
  var timelineChart = new google.visualization.LineChart(
    document.getElementById('timeline')
  );
  timelineChart.draw(timeline, timelineOptions);

  // Common Contests
  $('#commonContestsCon').removeClass('hidden');
  $('#user1Con').html(handle1);
  $('#user2Con').html(handle2);
  var con_url = 'https://codeforces.com/contest/';
  var commonContests = getCommonContests(conData1.all, conData2.all);
  commonContests.sort(function (a, b) {
    return a.contestId - b.contestId;
  });
  commonContests.forEach(function (con) {
    var handle1El = '<td><span class="handle1Color">' + con.handle1 + '</span></td>';
    var handle2El = '<td><span class="handle2Color">' + con.handle2 + '</span></td>';
    var dis = con.handle2 - con.handle1;
    dis =
      dis > 0
        ? '<td><span class="handle1Color">' + Math.abs(dis) + '</span></td>'
        : '<td><span class="handle2Color">' + Math.abs(dis) + '</span></td>';
    $('#commonContestList').append(
      '<tr><td><a class="lnk" href="' +
        con_url +
        con.contestId +
        '" target="_blank">' +
        con.contestName +
        '</a></td>' +
        handle1El +
        handle2El +
        dis +
        '</tr>'
    );
  });
  if (commonContests.length === 0) {
    $('#commonContestList').append('<tr><td>No common contests</td><tr>');
  }
}

// draw the charts that need all the submission data of two users
function drawSubCharts() {
  // Tried and solved
  var solvedTried = new google.visualization.arrayToDataTable([
    ['Handle', handle1, handle2],
    ['Tried', subData1.tried, subData2.tried],
    ['Solved', subData1.solved, subData2.solved]
  ]);
  var solvedTriedOptions = $.extend({}, commonOptions, {
    legend: legend,
    colors: colors,
    vAxis: {
      minValue: 0
    }
  });
  var solvedTriedChart = new google.visualization.ColumnChart(
    document.getElementById('solvedTried')
  );
  $('#solvedTried').removeClass('hidden');
  solvedTriedChart.draw(solvedTried, solvedTriedOptions);

  plotTwo('unsolved', subData1.unsolved, subData2.unsolved, 'Unsolved');
  plotTwo('averageSub', subData1.averageSub, subData2.averageSub, 'Average Submission');
  plotTwo('maxSub', subData1.maxSub, subData2.maxSub, 'Max submission');
  plotTwo('maxAc', subData1.maxAc, subData2.maxAc, 'Max AC');
  plotTwo(
    'oneSub',
    subData1.solved ? (subData1.solvedWithOneSub / subData1.solved) * 100 : 0,
    subData2.solved ? (subData2.solvedWithOneSub / subData2.solved) * 100 : 0,
    'Solved with one submission (%)'
  );

  // Common Solved
  $('#commonSolvedTable').removeClass('hidden');
  var commonSolved = $(subData1.problems).filter(subData2.problems).length;
  $('#commonSolved').html(commonSolved);

  // levels
  $('#levels').removeClass('hidden');
  var levels = new google.visualization.DataTable();
  levels.addColumn('string', 'Index');
  levels.addColumn('number', handle1);
  levels.addColumn('number', handle2);
  levels.addRows(alignLevels(subData1.levels, subData2.levels));
  var levelsView = new google.visualization.DataView(levels);
  levelsView.setColumns([
    0,
    1,
    {
      calc: 'stringify',
      sourceColumn: 1,
      type: 'string',
      role: 'annotation'
    },
    2,
    {
      calc: 'stringify',
      sourceColumn: 2,
      type: 'string',
      role: 'annotation'
    }
  ]);

  var levelsOptions = $.extend({}, scrollableOptions, commonOptions, {
    width: Math.max($('#levels').width(), levels.getNumberOfRows() * 65),
    height: 400,
    title: 'Levels',
    legend: legend,
    colors: colors,
    bar: { groupWidth: '65%' },
    annotations: annotation
  });
  var levelsChart = new google.visualization.ColumnChart(
    document.getElementById('levels')
  );
  levelsChart.draw(levelsView, levelsOptions);

  /* Problem Ratings */
  $('#pRatings').removeClass('hidden');
  var pRatings = new google.visualization.DataTable();
  pRatings.addColumn('string', 'Rating');
  pRatings.addColumn('number', handle1);
  pRatings.addColumn('number', handle2);
  pRatings.addRows(alignPRatings(subData1.pRatings, subData2.pRatings));
  var pRatingsView = new google.visualization.DataView(pRatings);
  pRatingsView.setColumns([
    0,
    1,
    {
      calc: 'stringify',
      sourceColumn: 1,
      type: 'string',
      role: 'annotation'
    },
    2,
    {
      calc: 'stringify',
      sourceColumn: 2,
      type: 'string',
      role: 'annotation'
    }
  ]);

  var pRatingsOptions = $.extend({}, scrollableOptions, commonOptions, {
    width: Math.max($('#pRatings').width(), pRatings.getNumberOfRows() * 65),
    height: 400,
    title: 'Problem Ratings',
    legend: legend,
    colors: colors,
    bar: { groupWidth: '65%' },
    annotations: annotation
  });
  var pRatingsChart = new google.visualization.ColumnChart(
    document.getElementById('pRatings')
  );
  pRatingsChart.draw(pRatingsView, pRatingsOptions);

  //Tags chart
  $('#tags').removeClass('hidden');
  var tags = new google.visualization.DataTable();
  tags.addColumn('string', 'Index');
  tags.addColumn('number', handle1);
  tags.addColumn('number', handle2);
  tags.addRows(alignTags(subData1.tags, subData2.tags));
  var tagsView = new google.visualization.DataView(tags);
  tagsView.setColumns([
    0,
    1,
    {
      calc: 'stringify',
      sourceColumn: 1,
      type: 'string',
      role: 'annotation'
    },
    2,
    {
      calc: 'stringify',
      sourceColumn: 2,
      type: 'string',
      role: 'annotation'
    }
  ]);
  var tagsOptions = $.extend({}, scrollableOptions, commonOptions, {
    width: Math.max($('#tags').width(), tags.getNumberOfRows() * 75),
    height: 400,
    title: 'Tags',
    legend: legend,
    colors: colors,
    bar: { groupWidth: '60%' },
    annotations: annotation,
    chartArea: { top: 100, bottom: 120, left: 100, right: 75 }
  });
  var tagsChart = new google.visualization.ColumnChart(document.getElementById('tags'));
  tagsChart.draw(tagsView, tagsOptions);
}

// when we need to compare two numbers, we can use this function
// it takes the two numbers, a title and a div. then draws a column chart in that div comparing the numbers
function plotTwo(div, n1, n2, title) {
  if (!(n1 || n2)) return;
  var table = new google.visualization.arrayToDataTable([
    ['Handle', title, { role: 'style' }],
    [handle1, n1, colors[0]],
    [handle2, n2, colors[1]]
  ]);
  var options = $.extend({}, commonOptions, {
    title: title,
    vAxis: {
      minValue: 0
    },
    legend: 'none'
  });
  var chart = new google.visualization.ColumnChart(document.getElementById(div));
  $('#' + div).removeClass('hidden');
  chart.draw(table, options);
}

function resetData() {
  $('#mainSpinner').addClass('is-active');
  $('.to-clear').empty();
  $('.to-hide').addClass('hidden');

  if (req1) req1.abort();
  if (req2) req2.abort();
  if (req3) req3.abort();
  if (req4) req4.abort();
}

function get_url(p) {
  var con = p.split('-')[0];
  var index = p.split('-')[1];

  var url = '';
  if (con.length < 4) url = 'https://codeforces.com/contest/' + con + '/problem/' + index;
  else url = 'https://codeforces.com/problemset/gymProblem/' + con + '/' + index;

  return url;
}

//Copied from stackoverflow :D
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

function fbShareResult() {
  var url;
  if (handle1 && handle2)
    url = window.location.href + '?handle1=' + handle1 + '&handle2=' + handle2;
  else url = window.location.href;
  window.open(
    'https://www.facebook.com/sharer/sharer.php?u=' + escape(url),
    '',
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600'
  );
}
