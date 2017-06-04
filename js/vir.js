var api_url = "http://codeforces.com/api/";
var ratings = [];
var places = [];
var rows = [];
var ratingsDict = {};
var handles = [];

var contestId = -1;
var points = -1;
var rating = -1;
var rank = -1;

$(document).ready(function() {
  $('#inputform').submit(function(e) {
    resetData();
    e.preventDefault();
    $('#rating').blur();
    $('#points').blur();
    $('#contestId').blur();

    var newContestId = $('#contestId').val().trim();
    rating = $('#rating').val().trim();
    points = $('#points').val().trim();

    if(!(newContestId && rating && points)) {
      err_message('contestIdDiv', 'All fields required');
      return;
    }

    $("#mainSpinner").addClass("is-active");

    var newContestId = $('#contestId').val().trim();
    rating = $('#rating').val().trim();
    points = $('#points').val().trim();

    if (newContestId != contestId) {
      showMessage("Downloading data can take a few minutes. Thanks for your patience");
      contestId = newContestId;

      req1 = $.get(api_url + 'contest.standings', { contestId: contestId }, function(data, status) {
        var currentRank = 1;
        for (var i = 0; i < data.result.rows.length; i++) {
          rows = data.result.rows;
          if (points >= data.result.rows[i].points && rank == -1) {
            handles.push('virtual user');
            places.push(data.result.rows[i].rank); // Not the best solution, but will work
            rank = data.result.rows[i].rank;
          }
          places.push(data.result.rows[i].rank)
          handles.push(data.result.rows[i].party.members[0].handle);
        }
      }).fail(function() {
        err_message('contestIdDiv', 'Contest not found, or not rated, or not finished yet');
      });

      req2 = $.get(api_url + 'contest.ratingChanges', { contestId: contestId }, function(data, status) {
        for (var i = 0; i < data.result.length; i++) {
          change = data.result[i];
          ratingsDict[change.handle] = change.oldRating;
        }
      }).fail(function() {
        err_message('contestIdDiv', 'Contest not found, or not rated, or not finished yet');
      });

      $.when(req1, req2).then(function() {
        for (var i = 0; i < handles.length; i++) {
          ratings[i] = handles[i] in ratingsDict ? ratingsDict[handles[i]] : rating;
        }
        results = CalculateRatingChanges(ratings, places, handles);
        showResult(results);
      });

    } else {
      for (var i = 0; i < rows.length; i++) {
        if (points >= rows[i].points && rank == -1) {
          handles.push('virtual user');
          places.push(rows[i].rank); // Not the best solution, but will work
          rank = rows[i].rank;
        }
        places.push(rows[i].rank)
        handles.push(rows[i].party.members[0].handle);
      }
      for (var i = 0; i < handles.length; i++) {
        ratings[i] = handles[i] in ratingsDict ? ratingsDict[handles[i]] : rating;
      }
      results = CalculateRatingChanges(ratings, places, handles);
      showResult(results);
    }
  });
});

function resetData() {
  $('#mainSpinner').addClass('is-active');
  ratings = [];
  places = [];
  handles = [];
  rank = -1;
}

function showResult(resluts) {
  $('#mainSpinner').removeClass('is-active');
  for (var i = 0; i < results.length; i++) {
    if (results[i].party == 'virtual user') {
      console.log('found...');
      $('#change').html(results[i].delta);
      $('#rank').html(rank);
      $('#position').html(parseInt(results[i].seed));
    }
  }
}

function err_message(div,msg) {
  $('#mainSpinner').removeClass('is-active');
  $("#"+div+"Err").html(msg);
  $("#"+div).addClass("is-invalid");
}

//
function showMessage(text) {
  console.log("hi");
  var data = {message: text, timeout: 10000};
  $('#loading-text')[0].MaterialSnackbar.showSnackbar(data);
}