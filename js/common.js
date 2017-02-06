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
    duration: 4000,
    easing: 'in',
    startup: true
  },
  tooltip: {
    textStyle: { fontSize: 14 },
  }
};
var scrollableOptions = {
  chartArea: { top: 100, bottom: 80, left: 100, right: 75},
  vAxis: {
    textStyle: { fontSize: 14 }
  },
  hAxis: {
    textStyle: { fontSize: 14 }
  },
};

var annotation = {
  alwaysOutside: true,
  textStyle: {
    fontSize: 10
  },
};

function err_message(div,msg) {
  $("#"+div+"Err").html(msg);
  $("#"+div).addClass("is-invalid");
}