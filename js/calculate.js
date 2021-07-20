function getEloWinProbability(ra, rb) {
  return 1.0 / (1.0 + Math.pow(10.0, (rb - ra) / 400.0));
}

function getSeed(contestants, rating) {
  if (rating in contestants.memSeed) {
    return contestants.memSeed[rating];
  }
  var result = 1.0;
  for (var i = 0; i < contestants.content.length; i++) {
    result += getEloWinProbability(contestants.content[i].rating, rating);
  }
  contestants.memSeed[rating] = result;
  return result;
}

function getRatingToRank(contestants, realRating, rank) {
  var left = 1;
  var right = 8000;
  while (right - left > 1) {
    var mid = parseInt((left + right) / 2);
    if (getSeed(contestants, mid) - getEloWinProbability(realRating, mid) < rank) {
      right = mid;
    } else {
      left = mid;
    }
  }
  return left;
}

function reassignRanks(contestants) {
  var first = 0;
  var points = contestants.content[0].rank;
  for (var i = 1; i < contestants.content.length; i++) {
    if (contestants.content[i].rank > points) {
      for (var j = first; j < i; j++) {
        contestants.content[j].rank = i;
      }
      first = i;
      points = contestants.content[i].rank;
    }
  }
  for (var i = first; i < contestants.content.length; i++) {
    contestants.content[i].rank = contestants.content.length;
  }
}

function process(contestants) {
  if (contestants.content.length == 0) {
    return;
  }
  reassignRanks(contestants);
  for (var i = 0; i < contestants.content.length; i++) {
    var contestant = contestants.content[i];
    var rating = contestant.rating;
    contestant.seed = getSeed(contestants, rating) - 0.5;
    var midRank = Math.sqrt(contestant.rank * contestant.seed);
    contestant.needRating = parseInt(getRatingToRank(contestants, rating, midRank));
    contestant.delta = parseInt((contestant.needRating - contestant.rating) / 2);
  }

  contestants.content.sort(function (a, b) {
    return b.rating - a.rating;
  });

  {
    var sum = 0;
    for (var i = 0; i < contestants.content.length; i++) {
      sum += parseInt(contestants.content[i].delta);
    }
    var inc = parseInt(-sum / contestants.content.length) - 1;
    for (var i = 0; i < contestants.content.length; i++) {
      contestants.content[i].delta += inc;
    }
    console.log(inc);
  }

  var sum = 0;
  var zeroSumCount = parseInt(
    Math.min(
      parseInt(4 * Math.round(Math.sqrt(contestants.content.length))),
      contestants.content.length
    )
  );
  for (var i = 0; i < zeroSumCount; i++) {
    sum += contestants.content[i].delta;
  }
  var inc = parseInt(Math.min(Math.max(parseInt(-sum / zeroSumCount), -10), 0));
  for (var i = 0; i < contestants.content.length; i++) {
    contestants.content[i].delta += inc;
  }
  console.log(inc);
}

function CalculateRatingChanges(previousRatings, standingsRows, userId) {
  var arr = [];
  for (var i = 0; i < standingsRows.length; i++) {
    var currentContestant = {
      party: userId[i],
      rank: standingsRows[i],
      rating: previousRatings[i],
      seed: 0.0,
      needRating: 0.0,
      delta: 0
    };
    arr.push(currentContestant);
  }
  var memTmp = [];
  var contestants = {
    content: arr,
    memSeed: memTmp
  };
  process(contestants);
  var result = {};
  for (var i = 0; i < contestants.content.length; i++) {
    result[contestants.content[i].party] = contestants.content[i].delta;
  }
  return contestants.content;
}
