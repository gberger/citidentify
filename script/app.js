(function($, Rx, window) {
  'use strict';

  var cities = window.cities;

  /* UTILS
   *******/

  var shuffle = function (array) {
    var arr = _.clone(array);
    var currentIndex = arr.length;
    var randomIndex;
    var tmp;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      tmp = arr[currentIndex];
      arr[currentIndex] = arr[randomIndex];
      arr[randomIndex] = tmp;
    }

    return arr;
  };

  var sample = function (arr, n) {
    if (isNaN(n)) {
      n = 1;
    }
    var shuffled = shuffle(arr);
    return n === 1 ? shuffled[0] : shuffled.slice(0, n);
  };

  var buildUrl = function (city) {
    return "img/cities/" + city.id + ".png";
  };


  /* JQUERY
   ********/

  var $correct = $('.correct');
  var $total = $('.total');
  var $buttons = $('.choice button');
  var $choice1 = $('#choice-1');
  var $choice2 = $('#choice-2');
  var $choice3 = $('#choice-3');
  var $mapImg = $('#map-img');
  var $refreshButton = $('.refresh-button');

  var elementFromCityId = function (cityId) {
    return $buttons.filter(function (i, el) {
      return $(el).data('city-id') === cityId;
    });
  };


  /* RX.JS
   *******/

  var resultStream = Rx.Observable.fromEvent($buttons, 'click')
    .map(function (e) {
      var guess = $(e.target).data('city-id');
      var actual = $mapImg.data('city-id');
      return {
        guess: guess,
        actual: actual,
        correctness: guess === actual,
        guessElement: elementFromCityId(guess),
        actualElement: elementFromCityId(actual)
      };
    });

  var correctStream = resultStream.scan(0, function (acc, result) {
    return acc + (result.correctness ? 1 : 0);
  });
  correctStream.subscribe(function (correct) {
    $correct.text(correct);
  });

  var totalStream = resultStream.scan(0, function (acc) {
    return acc + 1;
  });
  totalStream.subscribe(function (total) {
    $total.text(total);
  });

  resultStream.subscribe(function (result) {
    console.log(result);
    $buttons.attr('disabled', true);

    if (result.correctness) {
      result.guessElement.addClass("guess-correct");
    } else {
      result.actualElement.addClass("guess-correct");
      result.guessElement.addClass("guess-wrong");
    }
  });

  var refreshStream = Rx.Observable.fromEvent($refreshButton, 'click').startWith('startup');

  refreshStream.subscribe(function () {
    $buttons.removeClass("guess-correct guess-wrong").attr('disabled', false);

    var possible = sample(cities, 3);
    var chosen = sample(possible);
    $choice1.text(possible[0].name).data('city-id', possible[0].id);
    $choice2.text(possible[1].name).data('city-id', possible[1].id);
    $choice3.text(possible[2].name).data('city-id', possible[2].id);
    $mapImg.attr('src', 'img/blank.gif');
    setTimeout(function () {
      $mapImg.attr('src', buildUrl(chosen)).data('city-id', chosen.id);
    }, 0);
  });

})(jQuery, Rx, window);