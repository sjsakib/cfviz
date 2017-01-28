var MAX_TIME_DIFF = 7200;

function getContestStat(data) {
  var ret = {};
  ret.best = 1e10;
  ret.worst = -1e10;
  ret.maxUp = 0;
  ret.maxDown = 1e10;
  ret.bestCon = "";
  ret.worstCon = "";
  ret.maxUpCon = "";
  ret.maxDownCon = "";
  ret.maxRating = 0;
  ret.minRating = 1e10;
  ret.rating = 0;
  ret.tot = data.result.length;
  ret.timeline = [];

  for(var i=0;i<data.result.length;i++) {
    var con = data.result[i];
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

    ret.maxRating = Math.max(ret.maxRating,con.newRating);
    ret.minRating = Math.min(ret.minRating,con.newRating);

    if(i == data.result.length-1) ret.rating = con.newRating;

    ret.timeline.push([con.ratingUpdateTimeSeconds, con.newRating]);
  }

  return ret;
}


//TODO: Fix this function
function alignTimeline(r1,r2) {
  ret = [];
  var i = 0;
  var j = 0;
  while(i <= r1.length || j <= r2.length) {
    if( compDate(r1[i][0], r2[j][0]) === 0) {
      ret.push([new Date(r1[i][0]* 1000), r1[i][1], r2[j][1]]);
      i++;
      j++;
    } else if(compDate(r1[i][0],r2[j][0]) < 0) {
      if(j === 0) ret.push([new Date(r1[i][0]* 1000), r1[i][1], null]);
      else ret.push([new Date(r1[i][0]* 1000), r1[i][1], r2[j][1]]);
      i++;
    } else {
      if(i === 0) ret.push([new Date(r2[j][0]* 1000), null,r2[j][1]]);
      else ret.push([new Date(r2[j][0]* 1000), r1[i][1], r2[j][1]]);
      j++;
    }

    if(i == r1.length) {
      while(j<r2.length) {
        ret.push([new Date(r2[j][0]* 1000), r1[i-1][1], r2[j][1]]);
        j++;
      }
      break;
    }
    if(j == r2.length) {
      while(i<r1.length) {
        ret.push([new Date(r1[i][0]* 1000), r1[i][1], r2[j-1][1]]);
        i++;
      }
      break;
    }
  }
  return ret;
}

function compDate(d1,d2) {
  if(Math.abs(d1-d2) < MAX_TIME_DIFF) {
    return 0;
  }
  return d1-d2;
}