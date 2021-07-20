var MAX_TIME_DIFF = 7200; // max time between contests

//common Options for charts
var legend = {
  position: 'top',
  alignment: 'end'
};

var commonOptions = {
  height: 300,
  titleTextStyle: {
    fontSize: 18,
    color: '#393939',
    bold: false
  },
  fontName: 'Roboto',
  bar: { groupWidth: '30%' },
  legend: {
    position: 'top',
    alignment: 'end'
  },
  animation: {
    easing: 'in',
    startup: true
  },
  tooltip: {
    textStyle: { fontSize: 14 }
  }
};

var scrollableOptions = {
  chartArea: { top: 100, bottom: 80, left: 100, right: 75 },
  vAxis: {
    textStyle: { fontSize: 14 }
  },
  hAxis: {
    textStyle: { fontSize: 14 }
  }
};

var annotation = {
  alwaysOutside: true,
  textStyle: {
    fontSize: 10
  }
};

// helper functions, partially copied from single.js

function getSubData(data) {
  var ret = {}; // the object to return
  ret.levels = {};
  ret.pRatings = {};
  ret.tags = {};
  var problems = {};

  // parsing all the submissions and saving useful data
  for (var i = data.result.length - 1; i >= 0; i--) {
    var sub = data.result[i];
    var problemId = sub.problem.contestId + '-' + sub.problem.index;
    if (problems[problemId] === undefined) {
      problems[problemId] = {
        subs: 1,
        solved: 0
      };
    } else {
      if (problems[problemId].solved === 0) problems[problemId].subs++;
    }

    if (sub.verdict == 'OK') {
      problems[problemId].solved++;
    }

    if (problems[problemId].solved === 1 && sub.verdict == 'OK') {
      sub.problem.tags.forEach(function (t) {
        if (ret.tags[t] === undefined) ret.tags[t] = 1;
        else ret.tags[t]++;
      });

      if (ret.levels[sub.problem.index[0]] === undefined)
        ret.levels[sub.problem.index[0]] = 1;
      else ret.levels[sub.problem.index[0]]++;

      if (sub.problem.rating) {
        ret.pRatings[sub.problem.rating] = ret.pRatings[sub.problem.rating] + 1 || 1;
      }
    }
  }
  ret.totalSub = data.result.length;
  ret.tried = 0;
  ret.solved = 0;
  ret.maxSub = 0;
  ret.maxAc = 0;
  ret.unsolved = 0;
  ret.solvedWithOneSub = 0;
  for (var p in problems) {
    ret.tried++;
    if (problems[p].solved > 0) ret.solved++;
    if (problems[p].solved === 0) ret.unsolved++;

    ret.maxSub = Math.max(ret.maxSub, problems[p].subs);
    ret.maxAc = Math.max(ret.maxAc, problems[p].solved);

    if (problems[p].solved == problems[p].subs) ret.solvedWithOneSub++;
  }
  ret.averageSub = ret.totalSub / ret.solved;
  ret.problems = Object.keys(problems);

  return ret;
}

// align levels of solved problems for two users
// if one user have solved no problems of a level and other user have,
// we need to put 0 for the first user and the level
function alignLevels(lev1, lev2) {
  var ret = [];
  for (var l in lev1) {
    if (lev2[l] === undefined) ret.push([l, lev1[l], 0]);
    else {
      ret.push([l, lev1[l], lev2[l]]);
      delete lev2[l];
    }
  }
  for (l in lev2) {
    ret.push([l, 0, lev2[l]]);
  }
  ret.sort(function (a, b) {
    if (a[0] < b[0]) return -1;
    return 1;
  });
  return ret;
}

function alignPRatings(lev1, lev2) {
  var ret = [];
  for (var l in lev1) {
    if (lev2[l] === undefined) ret.push([l, lev1[l], 0]);
    else {
      ret.push([l, lev1[l], lev2[l]]);
      delete lev2[l];
    }
  }
  for (l in lev2) {
    ret.push([l, 0, lev2[l]]);
  }
  ret.sort(function (a, b) {
    if (parseInt(a[0]) < parseInt(b[0])) return -1;
    return 1;
  });
  return ret;
}

// aligns tags
function alignTags(tags1, tags2) {
  var ret = [];
  for (var t in tags1) {
    if (tags2[t] === undefined) ret.push([t, tags1[t], 0]);
    else {
      ret.push([t, tags1[t], tags2[t]]);
      delete tags2[t];
    }
  }
  for (t in tags2) {
    ret.push([t, 0, tags2[t]]);
  }
  ret.sort(function (a, b) {
    if (a[1] + a[2] < b[1] + b[2]) return 1;
    return -1;
  });
  return ret;
}

// returns common contests of two users
function getCommonContests(lst1, lst2) {
  var ret = [];
  for (var con in lst1) {
    if (lst2[con] !== undefined) {
      ret.push({
        contestId: con,
        // there might be <br> tag in problem names, we need re replace them
        contestName: lst1[con][0].replace(new RegExp('<br>', 'g'), ' - '),
        handle1: lst1[con][1],
        handle2: lst2[con][1]
      });
    }
  }
  return ret;
}

// parse all the contests and save useful data
function getContestStat(data) {
  var ret = {};
  ret.best = 1e10;
  ret.worst = -1e10;
  ret.maxUp = 0;
  ret.maxDown = 0;
  ret.bestCon = '';
  ret.worstCon = '';
  ret.maxUpCon = '';
  ret.maxDownCon = '';
  ret.maxRating = 0;
  ret.minRating = 1e10;
  ret.rating = 0;
  ret.tot = data.result.length;
  ret.timeline = [];
  ret.all = {};

  for (var i = 0; i < data.result.length; i++) {
    var con = data.result[i];
    ret.all[con.contestId] = [con.contestName, con.rank];
    if (con.rank < ret.best) {
      ret.best = con.rank;
      ret.bestCon = con.contestId;
    }
    if (con.rank > ret.worst) {
      ret.worst = con.rank;
      ret.worstCon = con.contestId;
    }
    var ch = con.newRating - con.oldRating;
    if (ch > ret.maxUp) {
      ret.maxUp = ch;
      ret.maxUpCon = con.contestId;
    }
    if (ch < ret.maxDown) {
      ret.maxDown = ch;
      ret.maxDownCon = con.contestId;
    }

    ret.maxRating = Math.max(ret.maxRating, con.newRating);
    ret.minRating = Math.min(ret.minRating, con.newRating);

    if (i == data.result.length - 1) ret.rating = con.newRating;

    ret.timeline.push([con.ratingUpdateTimeSeconds, con.newRating]);
  }

  return ret;
}

// align timeline,
// one user might have done a contest and other might haven't
// we need to add a point for the one who hasn't, what his rating was in that time
function alignTimeline(r1, r2) {
  ret = [];
  var i = 0;
  var j = 0;
  while (i <= r1.length || j <= r2.length) {
    if (compDate(r1[i][0], r2[j][0]) === 0) {
      ret.push([new Date(r1[i][0] * 1000), r1[i][1], r2[j][1]]);
      i++;
      j++;
    } else if (compDate(r1[i][0], r2[j][0]) < 0) {
      if (j === 0) ret.push([new Date(r1[i][0] * 1000), r1[i][1], null]);
      else ret.push([new Date(r1[i][0] * 1000), r1[i][1], r2[j - 1][1]]);
      i++;
    } else {
      if (i === 0) ret.push([new Date(r2[j][0] * 1000), null, r2[j][1]]);
      else ret.push([new Date(r2[j][0] * 1000), r1[i - 1][1], r2[j][1]]);
      j++;
    }

    if (i == r1.length) {
      while (j < r2.length) {
        ret.push([new Date(r2[j][0] * 1000), r1[i - 1][1], r2[j][1]]);
        j++;
      }
      break;
    }
    if (j == r2.length) {
      while (i < r1.length) {
        ret.push([new Date(r1[i][0] * 1000), r1[i][1], r2[j - 1][1]]);
        i++;
      }
      break;
    }
  }
  return ret;
}

function compDate(d1, d2) {
  if (Math.abs(d1 - d2) < MAX_TIME_DIFF) {
    return 0;
  }
  return d1 - d2;
}

function err_message(div, msg) {
  $('#' + div + 'Err').html(msg);
  $('#' + div).addClass('is-invalid');
}
