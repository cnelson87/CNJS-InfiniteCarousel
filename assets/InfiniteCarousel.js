/*
	TITLE: InfiniteCarousel

	DESCRIPTION: Infinite Carousel widget

	VERSION: 0.1.2

	USAGE: var myCarousel = new InfiniteCarousel('Element', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHOR: CN

	DEPENDENCIES:
		- jquery 2.1x+
		- greensock
		- Class.js

*/

var InfiniteCarousel = Class.extend({
	init: function($el, objOptions) {
		var self = this;

		// defaults
		this.$el = $el;
		this.$window = $(window);
		this.$htmlBody = $('html, body');
		this.options = $.extend({
			initialIndex: 0,
			numItemsToAnimate: 1,
			selectorNavPrev: 'a.arrow-nav-prev',
			selectorNavNext: 'a.arrow-nav-next',
			selectorOuterMask: '.outer-mask',
			selectorInnerTrack: '.inner-track',
			selectorPanels: '.carousel-item',
			classActiveItem: 'active',
			classNavDisabled: 'disabled',
			classInitialized: 'initialized',
			adjOuterTrack: 80,
			enableSwipe: true,
			autoRotate: false,
			autoRotateInterval: 8000,
			maxAutoRotations: 5,
			animationDuration: 0.6,
			animationEasing: 'Power4.easeInOut',
			topOffset: 20,
			selectorFocusEls: 'a, button, input, select, textarea',
			selectorContentEls: 'h2, h3, h4, h5, h6, p, ul, ol, dl',
			customEventPrefix: 'CNJS:InfiniteCarousel'
		}, objOptions || {});

		// element references
		this.$navPrev = this.$el.find(this.options.selectorNavPrev);
		this.$navNext = this.$el.find(this.options.selectorNavNext);
		this.$outerMask = this.$el.find(this.options.selectorOuterMask);
		this.$innerTrack = this.$el.find(this.options.selectorInnerTrack);
		this.$panels = this.$innerTrack.find(this.options.selectorPanels);

		// setup & properties
		this._length = this.$panels.length;
		this.currentIndex = this.options.initialIndex + this._length;
		this.previousIndex = null;
		this.numItemsToAnimate = this.options.numItemsToAnimate;
		this.scrollAmt = -100 * this.numItemsToAnimate;
		this.setAutoRotation = null;
		this.isAnimating = false;
		this.isInitialized = false;
		this.breakpoint = null;

		// init
		this.initDOM();
		this.bindEvents();

	},

	initDOM: function() {
		var self = this;

		// clone items for looping
		this.$panels.clone().appendTo(this.$innerTrack);
		this.$panels.clone().appendTo(this.$innerTrack);
		this.$panels = this.$innerTrack.find(this.options.selectorPanels);

		// add aria attributes
		this.$el.attr({'role': 'tablist', 'aria-live': 'polite'});
		this.$navPrev.attr({'role': 'button', 'tabindex': '0'});
		this.$navNext.attr({'role': 'button', 'tabindex': '0'});
		this.$panels.attr({'role': 'tabpanel', 'aria-hidden': 'true'});

		this.deactivatePanels();
		this.activatePanels();
		this.setBreakpoint();

		TweenMax.set(this.$outerMask, {
			x: 0
		});
		TweenMax.set(this.$innerTrack, {
			x: (this.scrollAmt * this.currentIndex) + '%'
		});

		// auto-rotate items
		if (this.options.autoRotate) {
			this.autoRotationCounter = this._length * this.options.maxAutoRotations;
			this.setAutoRotation = setInterval(function() {
				self.autoRotation();
			}, self.options.autoRotateInterval);
		}

		this.$el.addClass(this.options.classInitialized);
		this.isInitialized = true;

	},

	uninitDOM: function() {
		this.$el.removeAttr('role aria-live').removeClass(this.options.classInitialized);
		this.$navPrev.removeAttr('role tabindex');
		this.$navNext.removeAttr('role tabindex');
		this.$panels.removeAttr('role aria-hidden').removeClass(this.options.classActiveItem);
		this.$panels.find(this.options.selectorFocusEls).removeAttr('tabindex');
		TweenMax.set(this.$outerMask, {
			x: ''
		});
		TweenMax.set(this.$innerTrack, {
			x: ''
		});
		if (this.options.autoRotate) {
			clearInterval(this.setAutoRotation);
		}
	},

	bindEvents: function() {
		var self = this;

		this.$window.on('resize', this.__windowResize.bind(this));

		this.$navPrev.on('click', this.__clickNavPrev.bind(this));

		this.$navNext.on('click', this.__clickNavNext.bind(this));

		if (this.options.enableSwipe) {
			this.$el.swipe({
				fingers: 'all',
				excludedElements: '.noSwipe',
				threshold: 50,
				triggerOnTouchEnd: false, // triggers on threshold
				swipeLeft: function(event) {
					self.$navNext.click();
				},
				swipeRight: function(event) {
					self.$navPrev.click();
				},
				allowPageScroll: 'vertical'
			});
		}

	},

	unbindEvents: function() {
		this.$window.off('resize', this.__windowResize.bind(this));
		this.$navPrev.off('click', this.__clickNavPrev.bind(this));
		this.$navNext.off('click', this.__clickNavNext.bind(this));
		if (this.options.enableSwipe) {
			this.$el.swipe('destroy');
		}
	},

	autoRotation: function() {
		this.previousIndex = this.currentIndex;
		this.currentIndex += this.numItemsToAnimate;
		this.updateCarousel();
		this.autoRotationCounter--;
		if (this.autoRotationCounter === 0) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}
	},


/**
*	Event Handlers
**/

	__windowResize: function(event) {
		this.setBreakpoint();
	},

	__clickNavPrev: function(event) {
		event.preventDefault();

		if (this.isAnimating || this.$navPrev.hasClass(this.options.classNavDisabled)) {return;}

		if (this.options.autoRotate) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

		this.previousIndex = this.currentIndex;
		this.currentIndex -= this.numItemsToAnimate;

		this.updateCarousel(event);

	},

	__clickNavNext: function(event) {
		event.preventDefault();

		if (this.isAnimating || this.$navNext.hasClass(this.options.classNavDisabled)) {return;}

		if (this.options.autoRotate) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

		this.previousIndex = this.currentIndex;
		this.currentIndex += this.numItemsToAnimate;

		this.updateCarousel(event);

	},


/**
*	Public Methods
**/

	updateCarousel: function(event) {
		var self = this;

		this.isAnimating = true;

		this.adjustPosition();
		this.deactivatePanels();
		this.activatePanels();

		TweenMax.to(this.$innerTrack, this.options.animationDuration, {
			x: (this.scrollAmt * this.currentIndex) + '%',
			ease: this.options.animationEasing,
			onComplete: function() {
				self.isAnimating = false;
				if (!!event) {
					self.focusOnPanel(self.$panels.eq(self.currentIndex));
				}
			}
		});

		$.event.trigger(this.options.customEventPrefix + ':carouselUpdated');

	},

	adjustPosition: function() {
		var adjX = this.options.adjOuterTrack;

		if (this.currentIndex < this._length) {
			this.previousIndex += this._length;
			this.currentIndex += this._length;
			if (this.breakpoint === 'desktop') {
				TweenMax.fromTo(this.$outerMask, this.options.animationDuration, {
					x: -adjX
				},{
					x: 0
				});
			}
			TweenMax.set(this.$innerTrack, {
				x: (this.scrollAmt * this.previousIndex) + '%'
			});
		}

		if (this.currentIndex > (this._length * 2) - 1) {
			this.previousIndex -= this._length;
			this.currentIndex -= this._length;
			if (this.breakpoint === 'desktop') {
				TweenMax.fromTo(this.$outerMask, this.options.animationDuration, {
					x: adjX
				},{
					x: 0
				});
			}
			TweenMax.set(this.$innerTrack, {
				x: (this.scrollAmt * this.previousIndex) + '%'
			});
		}

	},

	deactivatePanels: function() {
		this.$panels.removeClass(this.options.classActiveItem).attr({'aria-hidden':'true'});
		this.$panels.find(this.options.selectorFocusEls).attr({'tabindex':'-1'});
	},

	activatePanels: function() {
		var $activePanel = this.$panels.eq(this.currentIndex);
		var $activeClonePanel1 = this.$panels.eq(this.currentIndex - this._length);
		var $activeClonePanel2 = this.$panels.eq(this.currentIndex + this._length);
		$activePanel.addClass(this.options.classActiveItem).attr({'aria-hidden':'false'});
		$activePanel.find(this.options.selectorFocusEls).attr({'tabindex':'0'});
		$activeClonePanel1.addClass(this.options.classActiveItem);
		$activeClonePanel2.addClass(this.options.classActiveItem);
	},

	focusOnPanel: function($activePanel) {
		var topOffset = this.options.topOffset;
		var pnlTop = $activePanel.offset().top;
		var pnlHeight = $activePanel.outerHeight();
		var winTop = this.$window.scrollTop() + topOffset;
		var winHeight = this.$window.height() - topOffset;
		var scrollTop = pnlTop - topOffset;
		var $focusContentEl = $activePanel.find(this.options.selectorContentEls).first();
		var scrollSpeed = 200;

		if (pnlTop < winTop || pnlTop + pnlHeight > winTop + winHeight) {
			this.$htmlBody.animate({scrollTop: scrollTop}, scrollSpeed, function() {
				$focusContentEl.attr({'tabindex': '-1'}).focus();
			});
		} else {
			$focusContentEl.attr({'tabindex': '-1'}).focus();
		}

	},

	setBreakpoint: function() {
		var w = this.$window.width();
		this.breakpoint = (w < 768) ? 'mobile' : 'desktop';
		// console.log(w, this.breakpoint);
	},

	unInitialize: function() {
		this.unbindEvents();
		this.uninitDOM();
		this.$el = null;
		this.$navPrev = null;
		this.$navNext = null;
		this.$outerMask = null;
		this.$innerTrack = null;
		this.$panels = null;
		this.isInitialized = false;
	}

});

//uncomment to use as a browserify module
//module.exports = InfiniteCarousel;
