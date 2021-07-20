// Virtual rating change

var api_url = 'https://codeforces.com/api/';
var ratings = [];
var places = [];
var rows = [];
var ratingsDict = {};
var handles = [];

var contestId = -1;
var points = -1;
var rating = -1;
var rank = -1;
var penalty = -1;
var userHandle = null;

$(document).ready(function () {
  $('#inputform').submit(function (e) {
    $('#mainSpinner').addClass('is-active');
    resetData();
    e.preventDefault();
    $('#rating').blur();
    $('#points').blur();
    $('#contestId').blur();

    // the user may want to know rating change for the same contest for different points, rank, oldrating
    // we don't want to download the contest data again, as it takes really long
    // so we'll take a newContestId var, and check later if this is the same as the previously entered contestId
    var newContestId = $('#contestId').val().trim();
    rating = $('#rating').val().trim();
    points = $('#points').val().trim();
    penalty = $('#penalty').val().trim();
    userHandle = $('#handle').val().trim();

    if (!newContestId) {
      err_message('contestIdDiv', 'Not valid contest ID');
      return;
    }
    if (!points) {
      err_message('pointsDiv', 'Not valid points');
      return;
    }
    if (!penalty) {
      err_message('penaltyDiv', 'Not valid penalty');
      return;
    }
    if (!(rating || userHandle)) {
      err_message('ratingDiv', 'Rating must not be empty without user handle');
      return;
    }

    if (
      newContestId != contestId ||
      rows.length == 0 ||
      Object.keys(ratingsDict).length == 0
    ) {
      showMessage('Downloading data can take a few minutes. Thanks for your patience.');
      contestId = newContestId;

      var req1 = $.get(
        api_url + 'contest.standings',
        { contestId: contestId },
        function (data, status) {
          rows = data.result.rows;
        }
      ).fail(getDataFailed);

      // we need all the participants' ratings before the contest
      var req2 = $.get(
        api_url + 'contest.ratingChanges',
        { contestId: contestId },
        function (data, status) {
          if (data.result.length == 0) {
            getDataFailed();
            req1.abort();
            return;
          }
          for (var i = 0; i < data.result.length; i++) {
            var change = data.result[i];
            ratingsDict[change.handle] = change.oldRating;
          }
        }
      ).fail(getDataFailed);

      $.when(req1, req2).then(function () {
        if (Object.keys(ratingsDict).length != 0) {
          refresh();
        }
      });
    } else {
      setTimeout(refresh, 2);
    }
  });
});

function getDataFailed() {
  err_message(
    'contestIdDiv',
    'Contest not found, or not rated, or not finished yet, or bad network'
  );
}

function refresh() {
  var handleFound = false;
  for (var i = 0; i < rows.length; i++) {
    // trying to guess what what would have been his rank if he participated in the real contest
    if (
      (points > rows[i].points ||
        (points == rows[i].points && penalty <= rows[i].penalty)) &&
      rank == -1
    ) {
      handles.push('virtual user');
      places.push(rows[i].rank);
      rank = rows[i].rank;
    }
    let currentHandle = rows[i].party.members[0].handle;
    if (userHandle == currentHandle) {
      handleFound = true;
    } else if (currentHandle) {
      places.push(rows[i].rank);
      handles.push(rows[i].party.members[0].handle);
    }
  }

  if (userHandle != '' && !handleFound) {
    err_message('handleDiv', 'User did not participate in contest');
    return;
  }

  if (!rating) rating = ratingsDict[userHandle];

  for (var i = 0; i < handles.length; i++) {
    ratings[i] = handles[i] in ratingsDict ? ratingsDict[handles[i]] : rating;
  }

  var results = CalculateRatingChanges(ratings, places, handles);
  showResult(results);
}

function resetData() {
  $('#mainSpinner').addClass('is-active');
  $('#result').addClass('hidden');
  ratings = [];
  places = [];
  handles = [];
  rank = -1;
}

function showResult(results) {
  $('#mainSpinner').removeClass('is-active');
  $('#result').removeClass('hidden');
  for (var i = 0; i < results.length; i++) {
    if (results[i].party == 'virtual user') {
      $('#change').html(results[i].delta > 0 ? '+' + results[i].delta : results[i].delta);
      $('#rank').html(rank);
      $('#position').html(parseInt(results[i].seed));
    }
  }
}

function err_message(div, msg) {
  $('#mainSpinner').removeClass('is-active');
  $('#' + div + 'Err').html(msg);
  $('#' + div).addClass('is-invalid');
}

//
function showMessage(text) {
  var data = { message: text, timeout: 10000 };
  $('#loading-text')[0].MaterialSnackbar.showSnackbar(data);
}
