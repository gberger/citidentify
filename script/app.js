(function($, Rx, window) {
  'use strict';

  var cities = window.cities;

  var DELAY = 2 * 1000;

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

  /* CLASS
   *******/

  var Deck = function(arr) {
    var arrShuffled = shuffle(arr);
    return {
      arr: arrShuffled,
      draw: function(n) {
        var ret = this.arr.slice(this.index, this.index + n);
        if(this.index + n >= this.arr.length) {
          ret = ret.concat(this.arr.slice(0, n - (this.arr.length - this.index)))
        }

        this.index += n;
        if(this.index >= this.arr.length) {
          this.loops += Math.floor(this.index / arr.length);
          this.index %= arr.length;
        }

        return ret;
      },
      index: 0,
      loops: 0
    }
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
  var $imgLoader = $('#img-loader');
  var $restartButton = $('.restart-button');

  var $datasets = $('.datasets button');
  var $init = $('.init');
  var $game = $('.game');
  var $fin = $('.fin');

  var elementFromCityId = function (cityId) {
    return $buttons.filter(function (i, el) {
      return $(el).data('city-id') === cityId;
    });
  };


  /* RX.JS
   *******/

  var dataset = new Rx.BehaviorSubject(new Deck(cities));

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

  resultStream = resultStream.scan({total: 0}, function(acc, result) {
    result.total = acc.total + 1;
    return result;
  });

  var correctStream = resultStream.scan(0, function (acc, result) {
    return acc + (result.correctness ? 1 : 0);
  });
  correctStream.subscribe(function (correct) {
    $correct.text(correct);
  });

  var totalStream = resultStream.map(function (res) {
    return res.total;
  });
  totalStream.subscribe(function (total) {
    $total.text(total);
  });

  resultStream.subscribe(function (result) {
    $buttons.attr('disabled', true);

    if (result.correctness) {
      result.guessElement.addClass("guess-correct");
    } else {
      result.actualElement.addClass("guess-correct");
      result.guessElement.addClass("guess-wrong");
    }
  });

  var refreshStream = resultStream.map(function(){return DELAY});

  var refresh = function(delay) {
    if(dataset.value.loops > 0){
      setTimeout(function() {
        $game.hide();
        $fin.show();
      }, delay);
    } else {
      var possible = dataset.value.draw(3);
      var chosen = sample(possible);

      var url = buildUrl(chosen);
      $imgLoader.attr('src', url);

      setTimeout(function () {
        $buttons.removeClass("guess-correct guess-wrong").attr('disabled', false);
        $choice1.text(possible[0].name).data('city-id', possible[0].id);
        $choice2.text(possible[1].name).data('city-id', possible[1].id);
        $choice3.text(possible[2].name).data('city-id', possible[2].id);
        $mapImg.attr('src', url).data('city-id', chosen.id);
      }, delay);
    }
  };

  refreshStream.subscribe(refresh);

  /* FIN */
  var restartStream = Rx.Observable.fromEvent($restartButton, 'click');

  restartStream.subscribe(function() {
    window.location.reload();
  });

  /* INIT */
  // TODO rethink set selection.
  var datasetStream = Rx.Observable.fromEvent($datasets, 'click')
    .map(function(e) {
      return $(e.target).data('dataset');
    })
    .map(function(setName) {
      if(setName === "USA") {
        return _.filter(cities, function(city) {
          return city.country === "USA";
        });
      } else if(setName === "BRA") {
        return _.filter(cities, function(city) {
          return city.country === "BRA";
        });
      }
    })
    .map(function(set) {
      return shuffle(set);
    });

  datasetStream.subscribe(function(set) {
    dataset.onNext(new Deck(set));
  });

  datasetStream.subscribe(function() {
    $init.hide();
    $game.show();
    refresh(0);
  });

})(jQuery, Rx, window);