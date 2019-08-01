(function ($, undefined) {
  'use strict';

  var OFFSET = 5;

  function Rating(element, options) {
    this.$input = $(element);
    this.$rating = $('<span></span>').css({
      cursor: 'default'
    }).insertBefore(this.$input);
    // Merge data and parameter options.
    // Those provided as parameter prevail over the data ones.
    this.options = (function (opts) {
      // Sanitize start, stop, step, and fractions.
      // All of them start, stop, and step must be integers.
      opts.start = parseInt(opts.start, 10);
      opts.start = isNaN(opts.start) ? undefined : opts.start;
      // In case we don't have a valid stop rate try to get a reasonable
      // one based on the existence of a valid start rate.
      opts.stop = parseInt(opts.stop, 10);
      opts.stop = isNaN(opts.stop) ?
        opts.start + OFFSET || undefined : opts.stop;
      // 0 step is ignored.
      opts.step = parseInt(opts.step, 10) || undefined;
      // Symbol fractions and scale (number of significant digits).
      // 0 is ignored and negative numbers are turned to positive.
      opts.fractions = Math.abs(parseInt(opts.fractions, 10)) || undefined;
      opts.scale = Math.abs(parseInt(opts.scale, 10)) || undefined;

      // Extend/Override the default options with those provided either as
      // data attributes or function parameters.
      opts = $.extend({}, $.fn.rating.defaults, opts);
      // Inherit default filled if none is defined for the selected symbol.
      opts.filledSelected = opts.filledSelected || opts.filled;
      return opts;
    }($.extend({}, this.$input.data(), options)));

    this._init();
  };

  Rating.prototype = {
    _init: function () {
      var rating = this,
          $input = this.$input,
          $rating = this.$rating;

      var ifEnabled = function (f) {
        return function (e) {
          // According to the W3C attribute readonly is not allowed on input
          // elements with type hidden.
          // Keep readonly prop for legacy but its use should be deprecated.
          if (!$input.prop('disabled') && !$input.prop('readonly') &&
              $input.data('readonly') === undefined) {
            f.call(this, e);
          }
        }
      };

      // Build the rating control.
      for (var i = 1; i <= this._rateToIndex(this.options.stop); i++) {
        // Create the rating symbol container.
        var $symbol = $('<div class="rating-symbol"></div>').css({
            display: 'inline-block',
            position: 'relative'
        });
        // Add background symbol to the symbol container.
        $('<div class="rating-symbol-background ' + this.options.empty + '"></div>')
          .appendTo($symbol);
        // Add foreground symbol to the symbol container.
        // The filled icon is wrapped with a div to allow fractional selection.
        $('<div class="rating-symbol-foreground"></div>')
          .append('<span class="' + this.options.filled + '"></span>')
          .css({
            display: 'inline-block',
            position: 'absolute',
            overflow: 'hidden',
            left: 0,
            // Overspecify right and left to 0 and let the container direction
            // decide which one is going to take precedence according to the
            // ltr/rtl direction.
            // (https://developer.mozilla.org/en-US/docs/Web/CSS/right)
            // When both the right CSS property and the left CSS property are
            // defined, the position of the element is overspecified. In that
            // case, the left value has precedence when the container is
            // left-to-right (that is that the right computed value is set to
            // -left), and the right value has precedence when the container is
            // right-to-left (that is that the left computed value is set to
            // -right).
            right: 0,
            width: 0
          }).appendTo($symbol);
        $rating.append($symbol);
        this.options.extendSymbol.call($symbol, this._indexToRate(i));
      }
      // Initialize the rating control with the associated input value rate.
      this._updateRate($input.val());

      // Keep rating control and its associated input in sync.
      $input
        .on('change', function () {
          rating._updateRate($(this).val());
        });

      var fractionalIndex = function (e) {
        var $symbol = $(e.currentTarget);
        // Calculate the distance from the mouse pointer to the origin of the
        // symbol. We need to be careful with the CSS direction. If we are
        // right-to-left then the symbol starts at the right. So we have to add
        // the symbol width to the left offset to get the CSS rigth position.
        var x = Math.abs((e.pageX || e.originalEvent.touches[0].pageX) -
          (($symbol.css('direction') === 'rtl' && $symbol.width()) +
          $symbol.offset().left));

        // NOTE: When the mouse pointer is close to the left side of the symbol
        // a negative x is returned. Probably some precision error in the
        // calculation.
        // x should never be less than 0 because this would mean that we are in
        // the previous symbol.
        x = x > 0 ? x : rating.options.scale * 0.1;
        return $symbol.index() + x / $symbol.width();
      };
      // Keep the current highlighted index (fractional or not).
      var index;
      $rating
        .on('mousedown touchstart', '.rating-symbol', ifEnabled(function (e) {
          // Set input 'trigger' the change event.
          $input.val(rating._indexToRate(fractionalIndex(e))).change();
        }))
        .on('mousemove touchmove', '.rating-symbol', ifEnabled(function (e) {
          var current = rating._roundToFraction(fractionalIndex(e));
          if (current !== index) {
            // Trigger pseudo rate leave event if the mouse pointer is not
            // leaving from another symbol (mouseleave).
            if (index !== undefined) $(this).trigger('rating.rateleave');
            // Update index and trigger rate enter event.
            index = current;
            $(this).trigger('rating.rateenter', [rating._indexToRate(index)]);
          }
          // Fill the symbols as fractions chunks.
          rating._fillUntil(current);
        }))
        .on('mouseleave touchend', '.rating-symbol', ifEnabled(function () {
          // When a symbol is left, reset index and trigger rate leave event.
          index = undefined;
          $(this).trigger('rating.rateleave');
          // Restore on hover out.
          rating._fillUntil(rating._rateToIndex(parseFloat($input.val())));
        }));

    },
    // Fill rating symbols until index.
    _fillUntil: function (index) {
      var $rating = this.$rating;
      // Get the index of the last whole symbol.
      var i = Math.floor(index);
      // Hide completely hidden symbols background.
      $rating.find('.rating-symbol-background')
        .css('visibility', 'visible')
        .slice(0, i).css('visibility', 'hidden');
      var $rates = $rating.find('.rating-symbol-foreground');
      // Reset foreground
      $rates.width(0);
      // Fill all the foreground symbols up to the selected one.
      $rates.slice(0, i).width('auto')
        .find('span').attr('class', this.options.filled);
      // Amend selected symbol.
      $rates.eq(index % 1 ? i : i - 1)
        .find('span').attr('class', this.options.filledSelected);
      // Partially fill the fractional one.
      $rates.eq(i).width(index % 1 * 100 + '%');
    },
    // Calculate the rate of an index according the the start and step.
    _indexToRate: function (index) {
      return this.options.start + Math.floor(index) * this.options.step +
        this.options.step * this._roundToFraction(index % 1);
    },
    // Calculate the corresponding index for a rate.
    _rateToIndex: function (rate) {
      return (rate - this.options.start) / this.options.step;
    },
    // Round index to the configured opts.fractions.
    _roundToFraction: function (index) {
      // Get the closest top fraction.
      var fraction = Math.ceil(index % 1 * this.options.fractions) / this.options.fractions;
      // Truncate decimal trying to avoid float precission issues.
      var p = Math.pow(10, this.options.scale);
      return Math.floor(index) + Math.floor(fraction * p) / p;
    },
    // Check the rate is in the proper range [start..stop].
    _contains: function (rate) {
      var start = this.options.step > 0 ? this.options.start : this.options.stop;
      var stop = this.options.step > 0 ? this.options.stop : this.options.start;
      return start <= rate && rate <= stop;
    },
    // Update empty and filled rating symbols according to a rate.
    _updateRate: function (rate) {
      var value = parseFloat(rate);
      if (this._contains(value)) {
        this._fillUntil(this._rateToIndex(value));
        this.$input.val(value);
      } else if (rate === '') {
        this._fillUntil(0);
        this.$input.val('');
      }
    },
    rate: function (value) {
      if (value === undefined) {
        return this.$input.val();
      }
      this._updateRate(value);
    }
  };

  $.fn.rating = function (options) {
    var args = Array.prototype.slice.call(arguments, 1),
        result;
    this.each(function () {
      var $input = $(this);
      var rating = $input.data('rating');
      if (!rating) {
        $input.data('rating', (rating = new Rating(this, options)));
      }
      // Underscore are used for private methods.
      if (typeof options === 'string' && options[0] !== '_') {
        result = rating[options].apply(rating, args);
      }
    });
    return result !== undefined ? result : this;
  };

  // Plugin defaults.
  $.fn.rating.defaults = {
    filled: 'glyphicon glyphicon-star',
    filledSelected: undefined,
    empty: 'glyphicon glyphicon-star-empty',
    start: 0,
    stop: OFFSET,
    step: 1,
    fractions: 1,
    scale: 3,
    extendSymbol: function (rate) {},
  };

  $(function () {
    $('input.rating').rating();
  });
}(jQuery));

/**
 *********************************
 * Emotions Rating - Yanci Nerio *
 *********************************
 * Emotions Rating
 * Version: 2.0.0
 * URL: https://github.com/YanNerio/emotion-ratings
 * Description: This plugin allows you to create ratings using emojis
 * Requires: >= 1.9
 * Author: Yanci Nerio (www.yancinerio.com)
 * License: MIT
 */

;(function($, document, window, undefined) {
    // Optional, but considered best practice by some
    "use strict";

    // Name the plugin so it's only in one place
    var pluginName = 'emotionsRating';
    var $element;
    // Default options for the plugin as a simple object
    var defaults = {
        bgEmotion: "happy",
        emotionsCollection: ['angry','disappointed','meh', 'happy', 'inlove'],
        count: 5,
        color: "#d0a658;",
        emotionSize: 30,
        inputName: "ratings[]",
        emotionOnUpdate: null,
        ratingCode: 5,
        disabled: false

    };
    //the collection of emotions to show on the ratings
    var emotionsArray = {
        angry: "&#x1F620;",
        disappointed: "&#x1F61E;",
        meh: "&#x1F610;", 
        happy: "&#x1F60A;",
        smile: "&#x1F603;",
        wink: "&#x1F609;",
        laughing: "&#x1F606;",
        inlove: "&#x1F60D;",
        heart: "&#x2764;",
        crying: "&#x1F622;",
        star: "&#x2B50;",
        poop: "&#x1F4A9;",
        cat: "&#x1F63A;",
        like: "&#x1F44D;",
        dislike: "&#x1F44E;"
      };
   // var clicked = false;//[false,false,false];
    // Plugin constructor
    // This is the boilerplate to set up the plugin to keep our actual logic in one place
    function Plugin(element, options) {
        this.element = element;

        // Merge the options given by the user with the defaults
        this.settings = $.extend( {}, defaults, options );
        // Attach data to the element
        this.$el      = $(element);
        this.$el.data(name, this);

        this._defaults = defaults;
        this._name = pluginName;

        var meta      = this.$el.data(name + '-opts');
        this.opts     = $.extend(this._defaults, options, meta);

        this.containerCode = this.$el.attr('id');
        this.elementContainer = $(element);
        this.styleCode = 'emotion-style-'+this.containerCode;
        this.containerCode = 'emotion-container-'+this.containerCode;
        this.code = 'emoji-rating-'+this.containerCode;
        
        this.clicked = [];
        this.clicked[this.containerCode] = false;
        this.init();

    }
    
    //Avoiding conflicts with prototype
    $.extend(Plugin.prototype = {
        // Public functions accessible to users
        // Prototype methods are shared across all elements
        // You have access to this.settings and this.element
        init: function() {
            $element = $(this.element);
            this.count = 0;
            this.emotionStyle();
            this.renderEmotion();            
            this.manageHover();
            this.manageClick();
        },
        emotionStyle: function() {
            var styles = "."+this.styleCode+"{margin-right:3px;border-radius: 50%;cursor:pointer;opacity:0.3;display: inline-block;font-size:"
                 + this.settings.emotionSize +"px; text-decoration:none;line-height:0.9;text-align: center;color:"+this.settings.color+"}";
            $element.append("<style>" + styles + "</style>");
        },
        renderEmotion: function () {
           
            var count = this.settings.count;
            var bgEmotion = emotionsArray[this.settings.bgEmotion];
            var container = "<div class='"+this.containerCode+"'>";
            var emotionDiv;
            for (var i = 1; i <= count; i++) {
                emotionDiv = "<div class='"+this.styleCode+"' data-index='" + i + "'>"+bgEmotion+"</div>";
                container += emotionDiv;
            }
            container += "</div>";
            $element.append(container);
            if(this.settings.initialRating > 0){
                this.initalRate(this.settings.initialRating);
            }
        },
        clearEmotion: function(content) {
            if(!this.settings.disabled){
                this.elementContainer.find("."+this.styleCode+"").each( function() {
                    $(this).css("opacity", 0.3);
                    var bgEmotion = emotionsArray[content];
                    $(this).html(bgEmotion);
                });
            }
            
        },
        showEmotion: function(count) {
            this.clearEmotion(this.settings.bgEmotion);
            var emotion = getEmotion(this.settings.emotions,count);
            for (var i = 0; i < count; i++) {               
                this.elementContainer.find("."+this.styleCode+"").eq(i).css("opacity", 1);
                this.elementContainer.find("."+this.styleCode+"").eq(i).html(emotion);
            }
        },
        manageHover: function() {
            if(!this.settings.disabled){
                var self = this;
                this.elementContainer.on({
                    mouseenter: function() {
                        var count = parseInt($(this).data("index"), 10);
                        if (self.clicked[self.containerCode]) {
                            return;
                        }
                        self.showEmotion(count);
                    },
                    mouseleave: function() {
                        if (!self.clicked[self.containerCode]) {
                            self.clearEmotion();
                        }
                    }
                }, "."+this.styleCode+"" );
            }
        },
        manageClick: function() {
            if(!this.settings.disabled){
                var self = this;
                this.elementContainer.on("click", "."+this.styleCode+"", function() {
                    var index = $(this).data("index"),
                    count = parseInt(index, 10);
                    self.showEmotion(count);
                    self.count = count;
                    if (!self.clicked[self.containerCode]) {
                        self.updateInput(count);
                        self.clicked[self.containerCode] = true;
                    } else {
                        self.updateInput(count);
                    }
                    if ($.isFunction(self.settings.onUpdate)) {
                        self.settings.onUpdate.call(self, count);
                    }
                });
            }
        }, 
        initalRate: function(count) {
            var self = this;           
            self.showEmotion(count);
           if (!self.clicked[self.containerCode]) {
                self.appendInput(count);
                self.clicked[self.containerCode] = true;
            }
        },        
        appendInput: function(count) {
            var _input = "<input type='hidden' class='"+ this.code +" validate-rating'" + 
                    " name='" + this.settings.inputName + 
                    "' value='" + count + "' />";
            
            var div = this.elementContainer;
            div.append(_input);
        },
        updateInput: function(count) {
            var _input = this.elementContainer.find("input."+this.code+"");

            _input.val(count);
        }
    });

    $.fn[pluginName] = function(options) {
        // Iterate through each DOM element and return it
        return this.each(function() {
            // prevent multiple instantiations
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    };

    var getEmotion = function(_emotions,count) {
        var emotion;
        if (_emotions.length == 1) {
            emotion = emotionsArray[_emotions[0]];
        }else{
            emotion = emotionsArray[_emotions[count-1]];
        }
        return emotion;
    }

})(jQuery, document, window);
$(function() {
    $("input.check").on("change", function() {
        alert("Rating: " + $(this).val())
    }), $(".rating-tooltip").rating({
        extendSymbol: function(t) {
            $(this).tooltip({
                container: "body",
                placement: "bottom",
                title: "Rate " + t
            })
        }
    }), $(".rating-tooltip-manual").rating({
        extendSymbol: function() {
            var i;
            $(this).tooltip({
                container: "body",
                placement: "bottom",
                trigger: "manual",
                title: function() {
                    return i
                }
            }), $(this).on("rating.rateenter", function(t, n) {
                i = n, $(this).tooltip("show")
            }).on("rating.rateleave", function() {
                $(this).tooltip("hide")
            })
        }
    }), $(".rating").each(function() {
        $('<span class="badge badge-info"></span>').text($(this).val() || " ").insertAfter(this)
    }), $(".rating").on("change", function() {
        $(this).next(".badge").text($(this).val())
    });
    $("#element").emotionsRating({
        emotionSize: 32,
        bgEmotion: "happy",
        emotions: ["angry", "disappointed", "meh", "happy", "inLove"],
        color: "gold"
    })
}); 